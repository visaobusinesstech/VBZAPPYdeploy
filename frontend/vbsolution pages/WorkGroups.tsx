import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkGroup } from '@/contexts/WorkGroupContext';
import { useVB } from '@/contexts/VBContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { toast } from '@/hooks/use-toast';
import { useFilters } from '@/hooks/useFilters';
import FilterBar from '@/components/FilterBar';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkGroupCreateModal from '@/components/WorkGroupCreateModal';
import WorkGroupDetailModal from '@/components/WorkGroupDetailModal';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { usersService } from '@/services/usersService';
import { supabase } from '@/integrations/supabase/client';

import { 
  Plus,
  Users,
  List,
  User,
  BarChart3,
  Kanban,
  Edit,
  Trash2,
  AlignJustify,
  Calendar
} from 'lucide-react';

const WorkGroups = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useVB();
  const { companies, employees } = state;
  const { workGroups, addWorkGroup, updateWorkGroup, deleteWorkGroup } = useWorkGroup();
  const { user } = useAuth();
  const { users: companyUsers } = useCompanyUsers(user?.id);
  
  // Debug: verificar grupos recebidos
  console.log('WorkGroups na página:', workGroups);
  console.log('Quantidade de grupos na página:', workGroups?.length || 0);

  // Monitorar mudanças no estado de grupos
  useEffect(() => {
    console.log('🔄 [EFFECT] Estado de grupos mudou:', workGroups?.length || 0, 'grupos');
    if (workGroups && Array.isArray(workGroups)) {
      workGroups.forEach((group, index) => {
        console.log(`📋 [EFFECT] Grupo ${index}:`, group.name, group.id);
      });
    }
  }, [workGroups]);
  const { topBarColor } = useTheme();
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  
  // Estados para controle da interface
  const [viewMode, setViewMode] = useState<'board' | 'lista' | 'dashboard'>('board');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedWorkGroup, setSelectedWorkGroup] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Estados para filtros
  const {
    filters,
    updateFilter,
    clearFilters
  } = useFilters({
    search: ''
  });
  
  // Estado adicional para filtro de data
  const [dateFilter, setDateFilter] = useState<string>('');

  // Detectar estado do sidebar
  useEffect(() => {
    const handleSidebarChange = () => {
      const sidebar = document.querySelector('[data-expanded]');
      if (sidebar) {
        setIsSidebarExpanded(sidebar.getAttribute('data-expanded') === 'true');
      }
    };

    // Observer para mudanças no sidebar
    const observer = new MutationObserver(handleSidebarChange);
    const sidebarElement = document.querySelector('.fixed.left-0.top-\\[38px\\]');
    
    if (sidebarElement) {
      observer.observe(sidebarElement, { attributes: true, attributeFilter: ['class'] });
      // Check inicial
      setIsSidebarExpanded(sidebarElement.classList.contains('w-\\[240px\\]') || !sidebarElement.classList.contains('w-\\[64px\\]'));
    }

    return () => observer.disconnect();
  }, []);

  // Função para formatar data
  const formatDate = (date: string | Date) => {
    if (!date) return 'Data não disponível';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Funções de controle
  const handleCreateWorkGroup = async (workGroupData: any) => {
    console.log('🚀 [CREATE] handleCreateWorkGroup chamado com dados:', workGroupData);
    console.log('📊 [CREATE] Grupos antes da criação:', workGroups.length);
    
    try {
      // Validação básica
      if (!workGroupData.name || !workGroupData.name.trim()) {
        console.error('❌ [CREATE] Nome do grupo é obrigatório');
        toast({
          title: "Erro",
          description: "Nome do grupo é obrigatório",
          variant: "destructive"
        });
        return;
      }

      const newWorkGroup = {
        name: workGroupData.name.trim(),
        description: workGroupData.description || '',
        color: workGroupData.color || '#3B82F6',
        photo: workGroupData.photo || '',
        sector: workGroupData.department || 'Não definido',
        members: Array.isArray(workGroupData.members) ? workGroupData.members : [],
        tasksCount: 0,
        completedTasks: 0,
        activeProjects: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      console.log('📋 [CREATE] Dados do grupo preparados:', newWorkGroup);

      const created = await addWorkGroup(newWorkGroup);
      
      console.log('✅ [CREATE] Grupo criado com sucesso, mostrando toast');
      
      toast({
        title: "Grupo criado",
        description: `Grupo "${workGroupData.name}" foi criado com sucesso`
      });
    } catch (error) {
      console.error('❌ [CREATE] Erro ao criar grupo:', error);
      console.error('❌ [CREATE] Stack trace:', error.stack);
      toast({
        title: "Erro",
        description: `Erro ao criar grupo de trabalho: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleWorkGroupClick = async (workGroup: any) => {
    try {
      const membersFromContext = Array.isArray(workGroup?.members) ? workGroup.members : [];
      let members: any[] = membersFromContext;
      if (members.length === 0) {
        const settingIds = Array.isArray((workGroup?.settings || {}).members) ? (workGroup.settings.members as any[]) : [];
        const ids = settingIds.map((x: any) => String(x)).filter(Boolean);
        if (ids.length > 0) {
          try {
            const usersData = await usersService.list({ ids: ids.join(',') });
            members = ids.map((id: string) => {
              const u = (usersData || []).find((u: any) => String(u.id) === id) || {};
              const cu = (companyUsers || []).find((cu: any) => String(cu.id) === id) || {};
              return {
                id,
                name: cu?.nome || cu?.name || cu?.full_name || u?.nome || u?.name || u?.email || 'Usuário',
                email: cu?.email || u?.email || '',
                avatar: cu?.avatar_url || u?.avatar_url || u?.photo || '',
                role: 'member'
              };
            });
          } catch (error) {
            console.error('Erro ao buscar usuários do grupo:', error);
            // Fallback silencioso ou toast se necessário
          }
        }
      }
      if (members.length > 0) {
        const improved = members.map(m => {
          if (m?.name && m.name !== 'Usuário') return m;
          const cu = (companyUsers || []).find((cu: any) => String(cu.id) === String(m.id));
          if (!cu) return m;
          return {
            ...m,
            name: cu?.nome || cu?.name || cu?.full_name || cu?.email || m.name,
            email: cu?.email || m.email,
            avatar: cu?.avatar_url || m.avatar
          };
        });
        members = improved;
      }
      setSelectedWorkGroup({ ...workGroup, members });
    } catch {
      const fallbackMembers = Array.isArray(workGroup?.members) ? workGroup.members : [];
      setSelectedWorkGroup({ ...workGroup, members: fallbackMembers });
    }
    setIsDetailModalOpen(true);
  };

  const handleDeleteWorkGroup = (workGroupId: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo de trabalho?')) return;
    
    deleteWorkGroup(workGroupId);
    toast({
      title: "Grupo excluído",
      description: "Grupo foi excluído com sucesso"
    });
  };

  const handleUpdateWorkGroup = async (workGroupId: string, updates: any) => {
    try {
      const { name, description, members: desiredMemberIds } = updates || {};
      const hasGroupFieldUpdates = typeof name !== 'undefined' || typeof description !== 'undefined';
      if (hasGroupFieldUpdates) {
        await updateWorkGroup(workGroupId, { name, description });
      }
      
      if (Array.isArray(desiredMemberIds)) {
        const desiredSet = new Set(desiredMemberIds.map((id: any) => String(id)));
        const optimisticMembers = Array.from(desiredSet).map((id) => {
          const u = (companyUsers || []).find((cu: any) => String(cu.id) === String(id));
          return {
            id,
            name: u?.nome || u?.name || 'Usuário',
            email: u?.email || '',
            avatar: u?.avatar_url || u?.photo || '',
            role: 'member'
          };
        });
        setSelectedWorkGroup((prev: any) => ({ ...(prev || {}), members: optimisticMembers }));
        await updateWorkGroup(workGroupId, { members: Array.from(desiredSet) as any });
      }
      
      toast({
        title: "Grupo atualizado",
        description: "As alterações foram salvas no Supabase."
      });
    } catch (error: any) {
      console.error('Erro ao atualizar grupo:', error);
      toast({
        title: "Erro",
        description: error?.message || "Erro ao atualizar grupo de trabalho",
        variant: "destructive"
      });
    }
  };

  const handleFilterApply = () => {
    // Os filtros já são aplicados automaticamente através do filteredWorkGroups
    toast({
      title: "Filtros aplicados",
      description: "Os filtros foram aplicados com sucesso"
    });
  };

  const handleViewModeChange = (mode: 'board' | 'lista' | 'dashboard') => {
    setViewMode(mode);
  };

  // Filtrar grupos de trabalho baseado nos filtros ativos
  const filteredWorkGroups = (workGroups || []).filter(workGroup => {
    // Filtro de busca
    if (filters.search && !workGroup.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !workGroup.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Filtro de status (Ativos ou Desativados)
    // Quando archived é false, mostra apenas grupos ativos
    // Quando archived é true, mostra apenas grupos desativados (não ativos)
    const groupStatus = (workGroup as any).status || 'active';
    if (!filters.archived) {
      // Modo "Ativos": mostrar apenas grupos com status 'active'
      if (groupStatus !== 'active') {
        return false;
      }
    } else {
      // Modo "Desativados": mostrar apenas grupos que NÃO estão ativos
      if (groupStatus === 'active') {
        return false;
      }
    }
    
    // Filtro de data de criação
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      const filterDateEnd = new Date(dateFilter);
      filterDateEnd.setHours(23, 59, 59, 999);
      
      if (workGroup.createdAt) {
        const groupCreatedDate = new Date(workGroup.createdAt);
        if (groupCreatedDate < filterDate || groupCreatedDate > filterDateEnd) {
          return false;
        }
      } else {
        // Se não tiver data de criação, não incluir no resultado quando há filtro de data
        return false;
      }
    }
    
    return true;
  });

  // Log para debug
  console.log('📊 [PAGE] Total de grupos:', workGroups?.length || 0);
  console.log('📊 [PAGE] Grupos filtrados:', filteredWorkGroups?.length || 0);
  console.log('📊 [PAGE] Filtros ativos:', filters);

  // Botões de visualização
  const viewButtons = [
    { 
      id: 'board', 
      label: 'Quadro',
      icon: Kanban,
      active: viewMode === 'board'
    },
    {
      id: 'lista', 
      label: 'Lista',
      icon: List,
      active: viewMode === 'lista'
    }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando grupos de trabalho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Faixa branca contínua com botões de navegação e filtros */}
      <div className="bg-white -mt-6 -mx-6">
        {/* Botões de visualização */}
        <div className="px-6 py-4 border-b border-gray-200">
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
              
              {viewButtons.map((button) => {
                const Icon = button.icon;
                return (
                  <Button
                    key={button.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewModeChange(button.id as any)}
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
                  </Button>
                );
              })}
            </div>
            
            {/* Botões de ação na extrema direita */}
            <div className="flex items-center gap-2">
            </div>
          </div>
        </div>

        {/* Barra de filtros funcionais */}
        <FilterBar
          filters={{...filters, dateFrom: dateFilter}}
          onFilterChange={(key, value) => {
            if (key === 'dateFrom') {
              setDateFilter(value);
            } else {
              updateFilter(key as any, value);
            }
          }}
          onApplyFilters={handleFilterApply}
          onClearFilters={() => {
            clearFilters();
            setDateFilter('');
          }}
          employees={employees}
          departments={[]}
          searchPlaceholder="Filtrar por nome do grupo..."
          showResponsibleFilter={false}
          showWorkGroupFilter={false}
        />
      </div>

      {/* Container principal com altura total */}
      <div className={`pt-2 h-full ${isSidebarExpanded ? 'px-1' : 'px-2'}`}
           style={{height: 'calc(100vh - 72px)'}}>

        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'board' && (
          <div className="w-full p-6 pl-2">
            {/* Grid moderno de grupos de trabalho */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWorkGroups.map(workGroup => (
                <Card 
                  key={workGroup.id} 
                  className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer bg-white relative overflow-hidden aspect-square flex flex-col shadow-lg"
                  style={{
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}
                  onClick={() => handleWorkGroupClick(workGroup)}
                >
                  
                  {/* Botões de ação no canto inferior direito */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWorkGroupClick(workGroup);
                      }}
                      className="p-1.5 text-gray-500 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-md transition-all duration-200 shadow-sm border border-gray-200 hover:border-blue-300"
                      title="Editar grupo"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkGroup(workGroup.id);
                      }}
                      className="p-1.5 text-gray-500 hover:text-red-600 bg-white hover:bg-red-50 rounded-md transition-all duration-200 shadow-sm border border-gray-200 hover:border-red-300"
                      title="Excluir grupo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <CardContent className="p-3 flex-1 flex flex-col">
                    {/* Header sem ícone */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm text-gray-900 truncate mb-1 break-words">{workGroup.name}</h3>
                      </div>
                      <Badge 
                        variant={workGroup.status === 'active' ? 'default' : 'secondary'}
                        className={`text-xs px-1.5 py-0.5 ${
                          workGroup.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {workGroup.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    {/* Descrição */}
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed break-words flex-1">
                      {workGroup.description}
                    </p>

                    {/* Estatísticas minimalistas */}
                    <div className="space-y-1.5 mt-auto pr-16">
                      {/* Data de criação */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1 border-t border-gray-100">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>Criado em {formatDate(workGroup.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}


        {viewMode === 'lista' && (
          <div className="p-6 space-y-4">
            {filteredWorkGroups.map((workGroup) => (
            <Card 
              key={workGroup.id}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => handleWorkGroupClick(workGroup)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-lg text-gray-900 truncate mb-1 break-words">{workGroup.name}</h3>
                      <p className="text-gray-600 mb-1 line-clamp-1 break-words text-sm">{workGroup.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(workGroup.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={workGroup.status === 'active' ? 'default' : 'secondary'}
                      className={`text-xs px-1.5 py-0.5 ${
                        workGroup.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {workGroup.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>

                    {/* Botões de ação para lista */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWorkGroupClick(workGroup);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkGroup(workGroup.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}



      {/* Empty State */}
        {filteredWorkGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {workGroups.length === 0 ? 'Nenhum grupo de trabalho' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="text-gray-600 mb-6">
              {workGroups.length === 0 
                ? 'Comece criando seu primeiro grupo de trabalho para organizar sua equipe.'
                : 'Tente ajustar os filtros para encontrar os grupos que procura.'
              }
            </p>
        </div>
      )}
      </div>

      {/* Botão flutuante para criar novo grupo */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group"
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
        title="Criar novo grupo"
      >
        <Plus className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-200" />
      </button>

      {/* Modals */}
      <WorkGroupCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateWorkGroup}
        availableUsers={(companyUsers || []).map(u => ({ id: u.id, nome: u.nome, email: u.email, photo: u.avatar_url }))}
      />
      
      <WorkGroupDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        workGroup={selectedWorkGroup}
        onUpdate={handleUpdateWorkGroup}
        availableUsers={(companyUsers || []).map(u => ({ id: u.id, nome: u.nome, email: u.email, photo: u.avatar_url }))}
      />
    </div>
  );
};

export default WorkGroups;
