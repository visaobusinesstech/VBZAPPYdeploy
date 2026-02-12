import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { 
  BarChart3,
  FileText,
  Clock,
  Send,
  Plus,
  AlignJustify
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/SidebarContext";

// Componentes das seções
import { 
  EmailDashboard,
  EmailTemplatesComplete,
  EmailScheduling,
  EmailHistory,
  EmailFilterBar
} from "@/components/email";

export default function EmailPage() {
  const { t } = useTranslation();
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const [viewMode, setViewMode] = useState<'dashboard' | 'templates' | 'scheduling' | 'history'>('dashboard');
  const [isCreating, setIsCreating] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    canal: 'all',
    tipoEnvio: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // View buttons configuration
  const viewButtons = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      active: viewMode === 'dashboard'
    },
    {
      id: 'templates',
      label: 'Template',
      icon: FileText,
      active: viewMode === 'templates'
    },
    {
      id: 'scheduling',
      label: 'Agendamento',
      icon: Clock,
      active: viewMode === 'scheduling'
    },
    {
      id: 'history',
      label: 'Histórico',
      icon: Send,
      active: viewMode === 'history'
    }
  ];

  const handleViewModeChange = (mode: 'dashboard' | 'templates' | 'scheduling' | 'history') => {
    setViewMode(mode);
    setIsCreating(false);
  };

  const handleNewItem = () => {
    setIsCreating(true);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Faixa branca contínua com botões de navegação */}
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
          </div>
        </div>

        {/* Barra de filtros */}
        {/* Filtros - para todas as seções incluindo dashboard */}
        <EmailFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          searchPlaceholder={
            viewMode === 'dashboard' ? 'Filtrar dados...' :
            viewMode === 'templates' ? 'Filtrar por nome do template...' :
            viewMode === 'scheduling' ? 'Filtrar agendamentos...' :
            'Filtrar histórico...'
          }
          showCanalFilter={false}
          showStatusFilter={viewMode === 'templates' || viewMode === 'history' || viewMode === 'dashboard'}
          showTipoEnvioFilter={false}
        />
      </div>

      {/* Botão flutuante de ação */}
      {(viewMode === 'templates' || viewMode === 'scheduling') && !isCreating && (
        <Button
          onClick={handleNewItem}
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

      {/* Container principal */}
      <div className="px-6 py-6">
        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'dashboard' && (
          <EmailDashboard statusFilter={filters.status} dateFilter={filters.dateFrom} />
        )}

        {viewMode === 'templates' && (
          <EmailTemplatesComplete isCreating={isCreating} onCreatingChange={setIsCreating} />
        )}

        {viewMode === 'scheduling' && (
          <EmailScheduling isCreating={isCreating} onCreatingChange={setIsCreating} />
        )}

        {viewMode === 'history' && (
          <EmailHistory statusFilter={filters.status} dateFilter={filters.dateFrom} />
        )}
      </div>
    </div>
  );
}
