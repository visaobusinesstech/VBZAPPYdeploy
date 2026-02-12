import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSidebar } from '@/contexts/SidebarContext';
import { useRightDrawer } from '@/contexts/RightDrawerContext';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  MoreHorizontal,
  User,
  Phone,
  Mail,
  Building,
  Calendar,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Users,
  Tag,
  ChevronDown,
  AlignJustify,
  List,
  Grid,
  Grid3X3,
  MessageCircle,
  Building2,
  RefreshCw
} from 'lucide-react';
import { UploadButton } from '@/components/UploadButton';
import { useToast } from '@/hooks/useToast';
import ContactDetailsModal from '@/components/ContactDetailsModal';
import EditContactModal from '@/components/EditContactModal';
import RegisterContactModal from '@/components/RegisterContactModal';
import { Checkbox } from '@/components/ui/checkbox';
import ButtonTheme from '@/components/ButtonTheme';
import { useWhatsAppConversations } from '@/hooks/useWhatsAppConversations';
import { useWhatsAppContacts } from '@/hooks/useWhatsAppContacts';
import { WhatsAppContactsList } from '@/components/WhatsAppContactsList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useConnections } from '@/contexts/ConnectionsContext';
import { API_CONFIG } from '@/config/api';

interface Contact {
  id: string;
  id_usuario: string;
  id_empresa?: string;
  atendimento_id?: string;
  chat_id?: string;
  business_id?: string;
  name_wpp?: string;
  name: string;
  full_name?: string;
  phone: string;
  email?: string;
  created_at: string;
  updated_at: string;
  // Campos adicionais que podem ser adicionados
  company?: string;
  gender?: string;
  status?: 'active' | 'inactive' | 'lead';
  pipeline?: string;
  tags?: string[];
  whatsapp_opted?: boolean;
  profile_image_url?: string;
  last_contact_at?: string;
}

export default function Contacts() {
  const { t } = useTranslation();
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const { isRightDrawerOpen } = useRightDrawer();
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const { activeConnection } = useConnections();
  const { updateContactName } = useWhatsAppConversations();
  const { 
    contacts: whatsappContacts, 
    loading: whatsappLoading, 
    syncContacts,
    totalContacts: whatsappTotalContacts,
    onlineContacts: whatsappOnlineContacts,
    aiContacts: whatsappAiContacts
  } = useWhatsAppContacts();
  
  const [syncingBaileys, setSyncingBaileys] = useState(false);
  
  // Funções de atualização
  const handleUpdateContact = async (contactId: string, updatedData: Partial<Contact>) => {
    try {
      console.log('💾 handleUpdateContact: Atualizando contato:', contactId, updatedData);
      
      // Buscar o contato atual para obter o owner_id
      const currentContact = contacts.find(c => c.id === contactId);
      if (!currentContact) {
        throw new Error('Contato não encontrado');
      }
      
      // Preparar dados para atualização no Supabase
      const updateData = {
        ...updatedData,
        updated_at: new Date().toISOString()
      };
      
      console.log('💾 handleUpdateContact: Dados para atualização:', updateData);
      
      // Atualizar no Supabase
      const { data, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ handleUpdateContact: Contato atualizado no Supabase:', data);
      
      // Atualizar localmente
      setContacts(prev => prev.map(contact => 
        contact.id === contactId ? { ...contact, ...updatedData } : contact
      ));
      
      success('Contato atualizado com sucesso!');
    } catch (error) {
      showError('Erro ao atualizar contato');
    }
  };

  const handleUpdateContactName = async (contactId: string, name: string) => {
    try {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) return;
      
      // Usar a função do hook WhatsApp para atualizar o nome
      await updateContactName(contactId, name, contact.owner_id);
      
      // Atualizar localmente
      setContacts(prev => prev.map(contact => 
        contact.id === contactId ? { ...contact, name } : contact
      ));
      
      success('Nome do contato atualizado com sucesso!');
    } catch (error) {
      showError('Erro ao atualizar nome do contato');
    }
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactDetails(false);
    setShowEditModal(true);
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowEditModal(false);
    setShowContactDetails(true);
  };

  const handleDeleteContact = async (contact: Contact) => {
    // Confirmação simples
    if (!window.confirm(`Tem certeza que deseja excluir o contato "${contact.name}"?`)) {
      return;
    }

    try {
      // Excluir do Supabase
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);
      
      if (error) {
        throw error;
      }
      
      // Remover da lista local
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      
      // Fechar modais se estiverem abertos
      setShowContactDetails(false);
      setShowEditModal(false);
      setSelectedContact(null);
      
      success('Contato excluído com sucesso!');
    } catch (error) {
      showError('Erro ao excluir contato');
    }
  };

  // Função para importação em massa de contatos via Excel
  const handleImportContacts = async (data: any[]) => {
    try {
      console.log('📊 [IMPORT] Iniciando importação de', data.length, 'contatos');

      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar id_empresa do usuário para garantir visibilidade e persistência pós F5
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('id_empresa')
        .eq('id', user.id)
        .single();
      if (userErr || !userData?.id_empresa) {
        throw new Error('Não foi possível obter id_empresa do usuário');
      }

      // Filtrar apenas linhas com dados válidos
      const validData = data.filter(row => {
        return row.name && row.name.trim() !== '' && row.name.trim() !== 'Exemplo';
      });

      console.log(`📊 [IMPORT] Dados válidos: ${validData.length} de ${data.length} total`);

      if (validData.length === 0) {
        throw new Error('Nenhum dado válido encontrado para importar');
      }

      // Processar dados importados
      const contactsDataRaw = validData.map((row) => {
        // Processar status - sempre usar 'active' para contatos sem status definido
        let processedStatus = 'active'; // Status padrão
        if (row.status && row.status !== 'Exemplo' && row.status.trim() !== '') {
          const statusMap: { [key: string]: string } = {
            'ativo': 'active',
            'inativo': 'inactive',
            'lead': 'lead',
            'cliente': 'customer',
            'prospecto': 'lead'
          };
          processedStatus = statusMap[row.status.toLowerCase()] || 'active';
        }

        // Normalizar telefone (remover caracteres não numéricos)
        const normalizedPhone = String(row.phone || '')
          .replace(/\D/g, '');

        const contactData = {
          id_empresa: userData.id_empresa,
          owner_id: user.id,
          name: row.name,
          phone: normalizedPhone,
          email: row.email || null,
          company: row.company || null,
          status: processedStatus as 'active' | 'inactive' | 'lead' | 'customer',
          pipeline: row.pipeline || null,
          whatsapp_opted: row.whatsapp_opted !== false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_contact_at: new Date().toISOString()
        };
        
        console.log('🔍 [IMPORT] Dados do contato individual:', contactData);
        return contactData;
      });

      // Remover duplicatas por (owner_id, phone) dentro do lote para evitar conflito na mesma requisição
      const dedupedMap = new Map<string, any>();
      for (const item of contactsDataRaw) {
        const key = `${item.owner_id}-${item.phone}`;
        if (!dedupedMap.has(key)) {
          dedupedMap.set(key, item);
        }
      }
      const contactsData = Array.from(dedupedMap.values());

      console.log('📤 [IMPORT] Dados preparados para inserção:', contactsData);

      // Inserir/atualizar (upsert) todos os contatos no Supabase evitando duplicatas por (owner_id, phone)
      const { data: insertedContacts, error } = await supabase
        .from('contacts')
        .upsert(contactsData, { onConflict: 'owner_id,phone', ignoreDuplicates: false })
        .select();

      if (error) {
        throw error;
      }

      console.log('✅ [IMPORT] Contatos importados com sucesso:', insertedContacts);

      await reloadContacts();

      success('Importação concluída', `${insertedContacts?.length || 0} contatos foram importados com sucesso`);

    } catch (error: any) {
      const message = error?.message || 'Erro ao importar contatos';
      showError('Erro na importação', message);
    }
  };
  
  // Estados
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // Filtros
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'whatsapp'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const reloadContacts = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id_empresa')
        .eq('id', user.id)
        .single();
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id_empresa', userData?.id_empresa)
        .order('created_at', { ascending: false });
      if (error) {
        showError('Erro', 'Erro ao carregar contatos do banco de dados');
        setContacts([]);
      } else {
        setContacts(data || []);
      }
    } catch (err) {
      showError('Erro', 'Erro ao carregar contatos');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    reloadContacts();
  }, [reloadContacts]);

  const filteredContacts = React.useMemo(() => {
    return contacts.filter(contact => {
      const term = (searchTerm || '').toLowerCase();
      const name = (contact.name || '').toLowerCase();
      const phone = contact.phone || '';
      const email = (contact.email || '').toLowerCase();
      const company = (contact.company || '').toLowerCase();

      const matchesSearch =
        (name && name.includes(term)) ||
        (phone && phone.includes(searchTerm)) ||
        (email && email.includes(term)) ||
        (company && company.includes(term));
      
      const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus;
      const matchesPipeline = selectedPipeline === 'all' || contact.pipeline === selectedPipeline;
      const matchesTags = selectedTags.length === 0 || (contact.tags && selectedTags.some(tag => contact.tags!.includes(tag)));

      return matchesSearch && matchesStatus && matchesPipeline && matchesTags;
    });
  }, [contacts, searchTerm, selectedStatus, selectedPipeline, selectedTags]);

  // Handlers

  const handleRegisterContact = () => {
    setShowRegisterModal(true);
  };

  const handleContactSelect = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  const handleBulkDeleteContacts = async () => {
    if (selectedContacts.length < 2) return;
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedContacts.length} contatos selecionados?`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', selectedContacts);
      if (error) {
        throw error;
      }
      setContacts(prev => prev.filter(c => !selectedContacts.includes(c.id)));
      setSelectedContacts([]);
      success('Contatos excluídos com sucesso!');
    } catch (err) {
      showError('Erro ao excluir contatos selecionados');
    }
  };

  // Sincronizar contatos do Baileys
  const handleSyncBaileysContacts = async () => {
    if (!activeConnection?.id) {
      showError('Erro', 'Nenhuma conexão WhatsApp ativa');
      return;
    }

    if (!user?.id) {
      showError('Erro', 'Usuário não autenticado');
      return;
    }

    setSyncingBaileys(true);

    try {
      // Buscar id_empresa do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id_empresa')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.id_empresa) {
        throw new Error('Não foi possível obter id_empresa do usuário');
      }

      // Buscar contatos do Baileys
      const API_URL = API_CONFIG.API_URL;
      const encodedConnectionId = encodeURIComponent(activeConnection.id);
      const response = await fetch(
        `${API_URL}/api/baileys-simple/connections/${encodedConnectionId}/contacts`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': activeConnection.owner_id || user.id,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar contatos do Baileys');
      }

      const data = await response.json();
      const baileysContacts = data.data || [];

      if (baileysContacts.length === 0) {
        success('Sincronização', 'Nenhum contato encontrado no WhatsApp');
        return;
      }

      // Processar e salvar contatos
      let saved = 0;
      let updated = 0;
      let skipped = 0;

      for (const baileysContact of baileysContacts) {
        // Extrair número do JID (formato: 5511999999999@s.whatsapp.net)
        const jid = baileysContact.id || baileysContact.jid || '';

        // Ignorar grupos (JIDs terminados em @g.us)
        if (jid.includes('@g.us')) {
          skipped++;
          continue;
        }

        const phoneMatch = jid.match(/^(\d+)@/);
        const phone = phoneMatch ? phoneMatch[1] : baileysContact.phone || '';
        
        if (!phone) {
          skipped++;
          continue;
        }

        // Normalizar telefone (remover caracteres não numéricos)
        const normalizedPhone = phone.replace(/\D/g, '');
        
        if (normalizedPhone.length < 10) {
          skipped++;
          continue;
        }

        // Buscar foto do perfil se não existir
        let profilePictureUrl = baileysContact.imgUrl || baileysContact.profilePicture;
        
        if (!profilePictureUrl) {
           try {
             const picData = await getContactProfilePicture(jid);
             if (picData && picData.url) {
               profilePictureUrl = picData.url;
             }
           } catch (e) {
             console.warn(`Não foi possível obter foto para ${jid}`);
           }
        }

        // Verificar se contato já existe pelo número (não pode ter duplicata)
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('id_empresa', userData.id_empresa)
          .eq('phone', normalizedPhone)
          .maybeSingle();

        const contactData = {
          id_empresa: userData.id_empresa,
          id_usuario: user.id,
          name: baileysContact.name || baileysContact.notify || baileysContact.verifiedName || 'Contato WhatsApp',
          phone: normalizedPhone,
          whatsapp_jid: jid,
          whatsapp_name: baileysContact.name || baileysContact.notify || baileysContact.verifiedName,
          whatsapp_profile_picture: profilePictureUrl,
          whatsapp_verified: baileysContact.verified || false,
          whatsapp_opted: true,
          status: 'active',
          updated_at: new Date().toISOString()
        };

        if (existingContact) {
          // Atualizar contato existente
          await supabase
            .from('contacts')
            .update(contactData)
            .eq('id', existingContact.id);
          updated++;
        } else {
          // Criar novo contato
          contactData.created_at = new Date().toISOString();
          await supabase
            .from('contacts')
            .insert(contactData);
          saved++;
        }
      }

      // Recarregar contatos
      const { data: refreshedContacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('id_empresa', userData.id_empresa)
        .order('created_at', { ascending: false });

      if (refreshedContacts) {
        setContacts(refreshedContacts);
      }

      success(
        'Sincronização concluída',
        `${saved} contatos salvos, ${updated} atualizados, ${skipped} ignorados`
      );
    } catch (err: any) {
      console.error('Erro ao sincronizar contatos do Baileys:', err);
      showError('Erro', err.message || 'Erro ao sincronizar contatos do WhatsApp');
    } finally {
      setSyncingBaileys(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sem contato';
    const date = new Date(dateString);
    const timestamp = date.getTime();
    if (isNaN(timestamp)) return 'Sem contato';

    const now = Date.now();
    const diffMs = Math.max(0, now - timestamp);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSec < 60) return 'Agora';
    if (diffMin < 60) return `há ${diffMin} min`;
    if (diffHours < 24) return `há ${diffHours} h`;
    if (diffDays < 7) return `há ${diffDays} dias`;
    if (diffWeeks < 5) return `há ${diffWeeks} semanas`;
    if (diffYears < 5) return `há ${diffMonths} meses`;

    return date.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'lead': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'lead': return 'Lead';
      case 'inactive': return 'Inativo';
      default: return 'Desconhecido';
    }
  };
  
  const formatWhatsAppPhone = (phone: string) => {
    const cleaned = (phone || '').replace(/\D/g, '');
    if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
      const cc = cleaned.slice(0, 2);
      const ddd = cleaned.slice(2, 4);
      const rest = cleaned.slice(4);
      if (rest.length === 9) {
        return `+${cc} (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
      }
      if (rest.length === 8) {
        return `+${cc} (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
      }
    }
    return cleaned ? `+${cleaned}` : '';
  };

  return (
    <>
      <div className="min-h-screen bg-transparent">
        {/* Header fixo responsivo ao sidebar */}
        <div 
          className="fixed top-[38px] right-0 bg-gray-50/90 dark:bg-black/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-30 transition-all duration-300"
          style={{
            left: sidebarExpanded ? '240px' : '64px'
          }}
        >
        {/* Botões de visualização */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Botão fixo de toggle da sidebar - SEMPRE VISÍVEL quando colapsada */}
              {!sidebarExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                  onClick={expandSidebarFromMenu}
                  title="Expandir barra lateral"
                >
                  <AlignJustify size={14} />
                </Button>
              )}
              
              {[
                { 
                  id: 'all', 
                  label: 'Todos',
                  icon: Users,
                  active: activeTab === 'all',
                  count: contacts.length
                }
              ].map((button) => {
                const Icon = button.icon;
                return (
                <Button
                    key={button.id}
                    variant="ghost"
                  size="sm"
                    onClick={() => setActiveTab(button.id as 'all' | 'whatsapp')}
                  className={`
                      h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg
                      ${button.active 
                        ? 'bg-gray-50 text-slate-900 shadow-inner' 
                        : 'text-slate-700 hover:text-slate-900 hover:bg-gray-25'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {button.label}
                    <Badge variant="secondary" className="ml-2">{button.count}</Badge>
                </Button>
                );
              })}
            </div>
            
            {/* Botões de ação na extrema direita */}
            <div className="flex items-center gap-2">
              {/* Botão de Sincronizar Contatos do Baileys */}
              {activeConnection?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSyncBaileysContacts}
                  disabled={syncingBaileys}
                  className="h-8 px-3 text-xs hover:bg-blue-50"
                  title="Sincronizar contatos do WhatsApp"
                >
                  {syncingBaileys ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3 mr-1" />
                      Sincronizar WhatsApp
                    </>
                  )}
                </Button>
              )}
              
              {/* Botão de Upload/Importação Excel */}
              <UploadButton
                entityType="contacts"
                onImportComplete={handleImportContacts}
                title="Importar planilha Excel de contatos"
              />
              
            </div>
          </div>
        </div>

        {/* Barra de filtros funcionais */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* Campo de busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  placeholder="Filtrar por nome do contato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8 text-sm border-0 bg-transparent focus:border-0 focus:ring-0 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Filtros funcionais */}
            <div className="flex items-center gap-2">
              {/* Filtro de Status */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-7 w-20 border-0 bg-transparent text-gray-900 text-xs shadow-none pl-2 pr-0.5 hover:bg-blue-50 focus:bg-blue-50">
                  <User className="h-3 w-3 mr-3" />
                  <SelectValue placeholder="Status" />
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Status</SelectItem>
                  <SelectItem value="active" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Ativo</SelectItem>
                  <SelectItem value="lead" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Lead</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Inativo</SelectItem>
                </SelectContent>
              </Select>



              {/* Botão de visualização Lista */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 px-3 text-xs shadow-none border-0 bg-transparent text-gray-900 hover:bg-blue-50 focus:bg-blue-50"
              >
                <List className="h-3 w-3 mr-1" />
                Lista
              </Button>

              {/* Botão de visualização Grid */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-7 px-3 text-xs shadow-none border-0 bg-transparent text-gray-900 hover:bg-blue-50 focus:bg-blue-50"
              >
                <Grid3X3 className="h-3 w-3 mr-1" />
                Grid
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Container principal com padding para o header fixo */}
      <div className="pt-[100px] pl-0 pr-4" style={{minHeight: 'calc(100vh - 38px)'}}>
          <div className="min-h-[600px]">
            <div className="p-6">
              {activeTab === 'all' ? (
                <>
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-gray-500 ml-3">Carregando contatos...</p>
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <Users className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">Nenhum contato encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Selection Bar */}
                      {selectedContacts.length > 0 && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-4">
                            <span className="text-sm text-blue-700">
                              {selectedContacts.length} contato(s) selecionado(s)
                </span>
                {selectedContacts.length > 1 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDeleteContacts}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Excluir selecionados
                  </Button>
                )}
            </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedContacts([])}
                          >
                            Limpar Seleção
                          </Button>
          </div>
                      )}

                      {/* Contacts List/Grid */}
                      {viewMode === 'list' ? (
                        <div className="overflow-x-hidden">
                          <table className="w-full table-fixed">
                            <thead className="border-b border-gray-200 bg-transparent">
                              <tr>
                                <th className="px-3 py-3 text-left w-10">
                                  <Checkbox
                                    checked={selectedContacts.length > 0 && selectedContacts.length === filteredContacts.length}
                                    onCheckedChange={() => handleSelectAll()}
                                    className="data-[state=checked]:bg-transparent data-[state=checked]:border-[#021529] text-[#021529]"
                                  />
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-4/12">
                                  Contato
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">
                                  Empresa
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                  Status
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                                  Pipeline
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                  Último Contato
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                                  Ações
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-transparent divide-y divide-gray-200">
                              {filteredContacts.map((contact) => (
                                <tr 
                                  key={contact.id} 
                                  className={`cursor-pointer transition-colors ${selectedContacts.includes(contact.id) ? 'bg-gray-100 border-l-4 border-[#021529]' : 'hover:bg-gray-50'}`}
                                  onClick={() => handleViewContact(contact)}
                                >
                                  <td className="px-3 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={selectedContacts.includes(contact.id)}
                                      onCheckedChange={() => handleContactSelect(contact.id)}
                                      className="data-[state=checked]:bg-transparent data-[state=checked]:border-[#021529] text-[#021529]"
                                    />
                                  </td>
                                  <td className="px-3 py-4">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        {contact.profile_image_url ? (
                                          <img
                                            className="h-10 w-10 rounded-full"
                                            src={contact.profile_image_url}
                                            alt={contact.name}
                                          />
                                        ) : (
                                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                            <User className="h-6 w-6 text-gray-600" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="ml-4 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">{contact.name}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-1 truncate">
                                          <Phone className="w-3 h-3" />
                                          {formatWhatsAppPhone(contact.phone)}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-4">
                                    <div className="space-y-1">
                                      <div className="text-sm text-gray-900 truncate max-w-[220px] sm:max-w-[300px]">{contact.company || '-'}</div>
                                      {contact.email && (
                                        <div className="text-sm text-gray-500 flex items-center gap-1 break-all">
                                          <Mail className="w-3 h-3" />
                                          {contact.email}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <Badge className={getStatusColor(contact.status || 'inactive')}>
                                      {getStatusText(contact.status || 'inactive')}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{contact.pipeline || '-'}</div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{formatDate(contact.last_contact_at || contact.updated_at)}</div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewContact(contact);
                                        }}
                                        className="p-2 h-8 w-8"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditContact(contact);
                                        }}
                                        className="p-2 h-8 w-8"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteContact(contact);
                                        }}
                                        className="p-2 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredContacts.map((contact) => (
                            <Card 
                              key={contact.id} 
                              className={`cursor-pointer hover:shadow-none transition-shadow bg-transparent border-0 shadow-none ${selectedContacts.includes(contact.id) ? 'bg-gray-100' : ''}`}
                              onClick={() => handleViewContact(contact)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    {contact.profile_image_url ? (
                                      <img
                                        className="h-10 w-10 rounded-full"
                                        src={contact.profile_image_url}
                                        alt={contact.name}
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                        <User className="h-6 w-6 text-gray-600" />
                                      </div>
                                    )}
                                    <div>
                                      <h3 className="font-medium text-gray-900">{contact.name}</h3>
                                      <p className="text-sm text-gray-500">{contact.company || 'Sem empresa'}</p>
                                    </div>
                                  </div>
                                  <div onClick={(e) => e.stopPropagation()}>
                                    {/* Checkbox removido no modo Grid conforme solicitado */}
                                  </div>
                                </div>
                                
                                <div className="space-y-2 mb-3">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    {formatWhatsAppPhone(contact.phone)}
                                  </div>
                                  {contact.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Mail className="w-4 h-4" />
                                      {contact.email}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <Badge className={getStatusColor(contact.status || 'inactive')}>
                                    {getStatusText(contact.status || 'inactive')}
                                  </Badge>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewContact(contact);
                                      }}
                                      className="p-1 h-6 w-6"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditContact(contact);
                                      }}
                                      className="p-1 h-6 w-6"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <WhatsAppContactsList
                  onContactSelect={handleViewContact}
                  showFilters={true}
                  className="h-full"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {!isRightDrawerOpen && (
        <Button
          onClick={handleRegisterContact}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 transition-colors duration-200"
        style={{
          backgroundColor: '#021529',
          borderColor: '#021529'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#001122';
          e.currentTarget.style.borderColor = '#001122';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#021529';
          e.currentTarget.style.borderColor = '#021529';
        }}
      >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Modais */}
      {showContactDetails && selectedContact && (
        <ContactDetailsModal
          contact={selectedContact}
          isOpen={showContactDetails}
          onClose={() => setShowContactDetails(false)}
          onEditContact={handleEditContact}
          onDeleteContact={handleDeleteContact}
        />
      )}

      {showEditModal && selectedContact && (
        <EditContactModal
          contact={selectedContact}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdateContact={handleUpdateContact}
          onUpdateContactName={handleUpdateContactName}
        />
      )}


      {showRegisterModal && (
        <RegisterContactModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onContactCreated={(contact) => {
            setContacts([contact, ...contacts]);
            success('Sucesso', 'Contato criado com sucesso');
          }}
        />
      )}
    </>
  );
}
