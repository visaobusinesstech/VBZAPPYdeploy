import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/contexts/SidebarContext';
import { DocumentationContent } from '@/components/documentation/DocumentationContent';
import {
  BookOpen,
  Search,
  ChevronRight,
  Home,
  Users,
  Folder,
  Calendar,
  TrendingUp,
  Building2,
  Mail,
  MessageCircle,
  Bot,
  Zap,
  Settings,
  FileSpreadsheet,
  Palette,
  UserPlus,
  Globe,
  AlignJustify,
  CheckCircle,
  ArrowRight,
  FileText,
  Truck,
  Archive,
  DollarSign,
  Target
} from 'lucide-react';

// Seções da documentação
const documentationSections = [
  {
    id: 'introducao',
    title: 'Introdução ao Sistema',
    icon: Home,
    color: '#3F30F1',
    subsections: [
      { id: 'visao-geral', title: 'Visão Geral do Sistema' },
      { id: 'primeiros-passos', title: 'Primeiros Passos' },
      { id: 'interface', title: 'Navegação e Interface' }
    ]
  },
  {
    id: 'cadastro',
    title: 'Cadastro e Autenticação',
    icon: UserPlus,
    color: '#2563eb',
    subsections: [
      { id: 'registro-empresa', title: 'Registro de Nova Empresa' },
      { id: 'cadastro-usuarios', title: 'Cadastro de Usuários' },
      { id: 'perfis-permissoes', title: 'Perfis e Permissões' },
      { id: 'areas-setores', title: 'Criação de Áreas e Setores' }
    ]
  },
  {
    id: 'personalizacao',
    title: 'Personalização Visual',
    icon: Palette,
    color: '#8b5cf6',
    subsections: [
      { id: 'identidade-visual', title: 'Identidade Visual da Empresa' },
      { id: 'cores-tema', title: 'Personalização de Cores' },
      { id: 'logo-marca', title: 'Upload de Logo e Marca' },
      { id: 'modo-escuro', title: 'Modo Escuro' }
    ]
  },
  {
    id: 'atividades',
    title: 'Gestão de Atividades',
    icon: TrendingUp,
    color: '#10b981',
    subsections: [
      { id: 'criar-atividade', title: 'Criar Nova Atividade' },
      { id: 'kanban-atividades', title: 'Visão Kanban' },
      { id: 'lista-prazo', title: 'Visão Lista e Prazos' },
      { id: 'importar-atividades', title: 'Importar Atividades via Excel' },
      { id: 'sprints', title: 'Gestão de Sprints' }
    ]
  },
  {
    id: 'projetos',
    title: 'Gestão de Projetos',
    icon: Folder,
    color: '#f59e0b',
    subsections: [
      { id: 'criar-projeto', title: 'Criar Novo Projeto' },
      { id: 'kanban-projetos', title: 'Visão Kanban de Projetos' },
      { id: 'importar-projetos', title: 'Importar Projetos via Excel' },
      { id: 'vincular-atividades', title: 'Vincular Atividades a Projetos' }
    ]
  },
  {
    id: 'contatos',
    title: 'Gestão de Contatos',
    icon: Users,
    color: '#06b6d4',
    subsections: [
      { id: 'cadastrar-contato', title: 'Cadastrar Novo Contato' },
      { id: 'importar-contatos', title: 'Importar Contatos via Excel' },
      { id: 'organizar-contatos', title: 'Organização e Filtros' },
      { id: 'tags-categorias', title: 'Tags e Categorias' }
    ]
  },
  {
    id: 'empresas',
    title: 'Gestão de Empresas',
    icon: Building2,
    color: '#ec4899',
    subsections: [
      { id: 'cadastrar-empresa', title: 'Cadastrar Nova Empresa' },
      { id: 'importar-empresas', title: 'Importar Empresas via Excel' },
      { id: 'visualizar-detalhes', title: 'Visualizar Detalhes da Empresa' }
    ]
  },
  {
    id: 'funil-vendas',
    title: 'Funil de Vendas',
    icon: Target,
    color: '#f43f5e',
    subsections: [
      { id: 'criar-lead', title: 'Criar Novo Lead' },
      { id: 'etapas-funil', title: 'Configurar Etapas do Funil' },
      { id: 'mover-leads', title: 'Mover Leads entre Etapas' },
      { id: 'relatorios-vendas', title: 'Relatórios de Vendas' }
    ]
  },
  {
    id: 'leads-vendas',
    title: 'Leads & Vendas',
    icon: DollarSign,
    color: '#16a34a',
    subsections: [
      { id: 'visao-geral', title: 'Visão Geral de Leads & Vendas' },
      { id: 'kanban-oportunidades', title: 'Kanban de Oportunidades' },
      { id: 'criacao-lead-modal', title: 'Criação de Leads pelo Modal' },
      { id: 'leads-whatsapp', title: 'Leads a partir do WhatsApp' }
    ]
  },
  {
    id: 'inventario',
    title: 'Gestão de Inventário',
    icon: Archive,
    color: '#14b8a6',
    subsections: [
      { id: 'cadastrar-item', title: 'Cadastrar Item no Estoque' },
      { id: 'importar-inventario', title: 'Importar Inventário via Excel' },
      { id: 'controle-estoque', title: 'Controle de Estoque' },
      { id: 'fornecedores', title: 'Gestão de Fornecedores' }
    ]
  },
  {
    id: 'whatsapp',
    title: 'Integração WhatsApp',
    icon: MessageCircle,
    color: '#25D366',
    subsections: [
      { id: 'conectar-whatsapp', title: 'Como Conectar o WhatsApp' },
      { id: 'qr-code', title: 'Escanear QR Code' },
      { id: 'gerenciar-conversas', title: 'Gerenciar Conversas' },
      { id: 'atendimento-manual', title: 'Atendimento Manual' }
    ]
  },
  {
    id: 'email',
    title: 'Sistema de Email',
    icon: Mail,
    color: '#3b82f6',
    subsections: [
      { id: 'configurar-smtp', title: 'Configurar SMTP' },
      { id: 'templates-email', title: 'Criar Templates de Email' },
      { id: 'envio-massa', title: 'Envio em Massa' },
      { id: 'agendar-emails', title: 'Agendar Envio de Emails' }
    ]
  },
  {
    id: 'agentes-ia',
    title: 'Agentes de IA',
    icon: Bot,
    color: '#a855f7',
    subsections: [
      { id: 'criar-agente', title: 'Criar Agente de IA' },
      { id: 'configurar-personalidade', title: 'Configurar Personalidade' },
      { id: 'base-conhecimento', title: 'Base de Conhecimento' },
      { id: 'integracao-whatsapp', title: 'Integração com WhatsApp' },
      { id: 'configurar-openai', title: 'Configurar OpenAI API' }
    ]
  },
  {
    id: 'automacoes',
    title: 'Automações e Workflows',
    icon: Zap,
    color: '#eab308',
    subsections: [
      { id: 'criar-automacao', title: 'Criar Nova Automação' },
      { id: 'workflow-builder', title: 'Usando o Workflow Builder' },
      { id: 'gatilhos-acoes', title: 'Gatilhos e Ações' },
      { id: 'exemplos-automacao', title: 'Exemplos de Automações' }
    ]
  },
  {
    id: 'google-calendar',
    title: 'Integração Google Calendar',
    icon: Calendar,
    color: '#4285f4',
    subsections: [
      { id: 'conectar-google', title: 'Conectar Google Calendar' },
      { id: 'sincronizar-eventos', title: 'Sincronizar Eventos' },
      { id: 'criar-eventos', title: 'Criar Eventos no Google' },
      { id: 'ia-calendario', title: 'IA para Gestão de Calendário' }
    ]
  },
  {
    id: 'excel',
    title: 'Importação de Planilhas Excel',
    icon: FileSpreadsheet,
    color: '#059669',
    subsections: [
      { id: 'formato-planilha', title: 'Formato das Planilhas' },
      { id: 'importar-dados', title: 'Como Importar Dados' },
      { id: 'modelos-excel', title: 'Modelos de Planilha' },
      { id: 'mapeamento-campos', title: 'Mapeamento de Campos' }
    ]
  },
  {
    id: 'configuracoes',
    title: 'Configurações do Sistema',
    icon: Settings,
    color: '#6b7280',
    subsections: [
      { id: 'config-empresa', title: 'Configurações da Empresa' },
      { id: 'config-usuarios', title: 'Gerenciar Usuários' },
      { id: 'config-email', title: 'Configurações de Email' },
      { id: 'config-whatsapp', title: 'Configurações WhatsApp' },
      { id: 'config-tema', title: 'Configurações de Tema' }
    ]
  }
];

const Documentation = () => {
  const { t } = useTranslation();
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('introducao');
  const [selectedSubsection, setSelectedSubsection] = useState('visao-geral');
  const [showSearch, setShowSearch] = useState(false);

  // Estilos inline para compactar a documentação
  const compactStyles = `
    .documentation-content h2 { font-size: 1.5rem; margin-bottom: 0.75rem; font-weight: 700; }
    .documentation-content h3 { font-size: 1.25rem; margin-bottom: 0.5rem; font-weight: 600; }
    .documentation-content h4 { font-size: 1rem; margin-bottom: 0.5rem; font-weight: 600; }
    .documentation-content p { margin-bottom: 0.75rem; line-height: 1.6; font-size: 0.9375rem; }
    .documentation-content .space-y-6 > * + * { margin-top: 1rem !important; }
    .documentation-content .space-y-4 > * + * { margin-top: 0.75rem !important; }
    .documentation-content .space-y-3 > * + * { margin-top: 0.5rem !important; }
    .documentation-content .space-y-2 > * + * { margin-top: 0.4rem !important; }
    .documentation-content [data-card] { margin-bottom: 0.75rem; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
    .documentation-content [data-card-header] { padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; }
    .documentation-content [data-card-content] { padding: 0.75rem 1rem; }
    .documentation-content [data-card-title] { font-size: 0.9375rem; font-weight: 600; }
    .documentation-content ul li { font-size: 0.875rem; line-height: 1.5; }
    .documentation-content .text-lg { font-size: 0.9375rem !important; }
    .documentation-content .text-xl { font-size: 1.125rem !important; }
    .documentation-content .text-3xl { font-size: 1.5rem !important; }
    .documentation-content .mb-6 { margin-bottom: 1rem !important; }
    .documentation-content .mb-4 { margin-bottom: 0.75rem !important; }
    .documentation-content .mb-3 { margin-bottom: 0.5rem !important; }
    .documentation-content strong { font-weight: 600; }
  `;

  // Filtrar seções baseado na busca
  const filteredSections = documentationSections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.subsections.some(sub => sub.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const currentSection = documentationSections.find(s => s.id === selectedSection);

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{compactStyles}</style>

      {/* Faixa branca contínua com botão de navegação */}
      <div className="bg-white -mt-6 -mx-6">
        {/* Botão de navegação */}
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
              
              {/* Botão Documentação */}
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg bg-gray-50 text-slate-900 shadow-inner"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Documentação
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex h-[calc(100vh-140px)] px-3 py-6 gap-6">
        {/* Sidebar de navegação */}
        <div className="w-80 rounded-lg border border-gray-200 bg-white p-4 overflow-y-auto flex-shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
            <h3 className="text-sm font-semibold text-gray-900">Índice</h3>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 ml-auto"
              onClick={() => {
                setShowSearch(!showSearch);
                if (!showSearch) {
                  setTimeout(() => document.getElementById('search-input')?.focus(), 100);
                }
              }}
              title="Pesquisar"
            >
              <Search size={16} />
            </Button>
          </div>
          {showSearch && (
            <div className="mb-4 px-2">
              <Input
                id="search-input"
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          )}
          <nav className="space-y-1">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              const isActive = selectedSection === section.id;
              
              return (
                <div key={section.id}>
                  <button
                    onClick={() => {
                      setSelectedSection(section.id);
                      setSelectedSubsection(section.subsections[0].id);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    style={isActive ? { backgroundColor: `${section.color}15`, color: section.color } : {}}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{section.title}</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {isActive && (
                    <div className="ml-6 mt-1 space-y-1">
                      {section.subsections.map((subsection) => (
                        <button
                          key={subsection.id}
                          onClick={() => setSelectedSubsection(subsection.id)}
                          className={`w-full text-left px-3 py-1.5 text-sm rounded transition-all ${
                            selectedSubsection === subsection.id
                              ? 'text-blue-700 font-medium bg-blue-50'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {subsection.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Conteúdo da documentação */}
        <div className="flex-1 rounded-lg border border-gray-200 bg-white p-6 overflow-y-auto documentation-content">
          <DocumentationContent section={selectedSection} subsection={selectedSubsection} />
        </div>
      </div>
    </div>
  );
};

export default Documentation;

