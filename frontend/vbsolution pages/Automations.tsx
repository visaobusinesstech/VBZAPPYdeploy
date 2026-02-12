'use client';

import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { 
  Zap,
  AlignJustify,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import WorkflowBuilder from '@/components/WorkflowBuilder';
import AutomationTemplatesPage from '@/components/AutomationTemplatesPage';
import { Step } from '@/types/workflow';
import { useSidebar } from '@/contexts/SidebarContext';
import { AutomationTemplate } from '@/data/automation-templates';

type ViewMode = 'list' | 'builder';

export default function Automations() {
  const location = useLocation();
  const { id: automationId } = useParams();
  const navigate = useNavigate();
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Detectar ação baseada na URL
  useEffect(() => {
    const pathname = location.pathname;
    
    if (pathname.includes('/automations/new')) {
      // Nova automação
      setSelectedAutomation(null);
      setShowBuilder(true);
      setViewMode('builder');
    } else if (automationId && pathname === `/automations/${automationId}`) {
      // Editar automação existente
      setSelectedAutomation(automationId);
      setShowBuilder(true);
      setViewMode('builder');
    } else if (pathname === '/automations' || pathname.endsWith('/automations')) {
      // Lista de automações (página principal)
      setShowBuilder(false);
      setViewMode('list');
      setSelectedAutomation(null);
    }
  }, [location.pathname, automationId]);

  const handleSelectTemplate = (template: AutomationTemplate) => {
    console.log('Template selecionado:', template);
    // TODO: Implementar criação de automação a partir do template
    // Por enquanto, redireciona para o builder com o template
    navigate('/automations/new', { state: { template } });
  };

  const handleBackToList = () => {
    navigate('/automations');
  };

  const handleSaveBuilder = (steps: Step[]) => {
    console.log('Salvando automação:', steps);
    // TODO: Implementar salvar na API
    handleBackToList();
  };

  if (showBuilder && viewMode === 'builder') {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] min-h-0 bg-white">
        {/* Header bar similar ao Respond.io - dentro do Layout normal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackToList}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Voltar para lista
            </Button>
            <div>
              <h2 className="text-xl font-semibold">
                {selectedAutomation ? 'Editar Automação' : 'Nova Automação'}
              </h2>
              <p className="text-sm text-gray-600">
                {selectedAutomation ? 'Configure sua automação existente' : 'Configure sua nova automação'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Zap className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>
        
        {/* Workflow builder - ocupando altura disponível dinamicamente */}
        <div className="flex-1 min-h-0">
          <WorkflowBuilder
            onSave={handleSaveBuilder}
            title={selectedAutomation ? 'Editar Automação' : 'Nova Automação'}
            isFullscreen={false}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header fixo responsivo ao sidebar */}
        <div 
          className="fixed top-[38px] right-0 bg-white border-b border-gray-200 z-30 transition-all duration-300"
          style={{
            left: sidebarExpanded ? '240px' : '64px'
          }}
        >
          {/* Navbar com botão de navegação */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Botão de toggle da sidebar - só aparece quando colapsada */}
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
                
                {/* Botão de navegação - Automações */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg bg-gray-50 text-slate-900 shadow-inner"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Automações
                </Button>
              </div>
            </div>
          </div>

          {/* Faixa de busca */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {/* Campo de busca */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    placeholder="Buscar automações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-8 text-sm border-0 bg-transparent focus:border-0 focus:ring-0 text-black placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Container principal com padding para o header fixo */}
        <div className="overflow-x-hidden px-1 pt-[140px]">
          <AutomationTemplatesPage 
            onSelectTemplate={handleSelectTemplate} 
            searchTerm={searchTerm}
          />
        </div>
      </div>
    </>
  );
}
