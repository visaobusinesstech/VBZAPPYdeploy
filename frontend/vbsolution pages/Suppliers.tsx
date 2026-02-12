
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSidebar } from '@/contexts/SidebarContext';
import ImprovedSuppliersPage from '@/components/suppliers/ImprovedSuppliersPage';
import { 
  BarChart3, 
  Calendar, 
  AlignJustify,
  Building2,
  Users,
  MapPin,
  Phone,
  TrendingUp,
  
} from 'lucide-react';

const Suppliers = () => {
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const [viewMode, setViewMode] = useState<'fornecedores' | 'dashboard'>('fornecedores');
  const importFunctionRef = useRef<((data: any[]) => Promise<void>) | null>(null);

  const handleViewModeChange = (mode: 'fornecedores' | 'dashboard') => {
    setViewMode(mode);
  };

  // Botões de visualização
  const viewButtons = [
    {
      id: 'fornecedores',
      label: 'Fornecedores',
      icon: Building2,
      active: viewMode === 'fornecedores'
    }
  ];

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
            
            {/* Botões de ação na extrema direita */}
            <div className="flex items-center gap-2">
            </div>
          </div>
        </div>
      </div>

      {/* Container principal */}
      <div className="px-6 py-6">
        {viewMode === 'fornecedores' && (
          <ImprovedSuppliersPage 
            onImportReady={(fn) => {
              importFunctionRef.current = fn;
            }}
          />
        )}


      </div>
    </div>
  );
};

export default Suppliers;
