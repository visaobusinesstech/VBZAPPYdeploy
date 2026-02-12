import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useCompaniesSimple as useCompanies } from '@/hooks/useCompaniesSimple';
import { useAuth } from '@/hooks/useAuth';
import { useFilters } from '@/hooks/useFilters';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useRightDrawer } from '@/contexts/RightDrawerContext';
import CompaniesTable from '@/components/companies/CompaniesTable';
import { CreateCompanyModal } from '@/components/CreateCompanyModal';
import FilterBar from '@/components/FilterBar';
import { 
  Building2, 
  Plus, 
  Search,
  Zap,
  X,
  List,
  AlignJustify,
  BarChart3,
  Calendar
} from 'lucide-react';
import { UploadButton } from '@/components/UploadButton';

const Companies = () => {
  const navigate = useNavigate();
  const { companies, loading, error, createCompany, updateCompany, deleteCompany, fetchCompanies } = useCompanies();
  const { user, session, loading: authLoading } = useAuth();
  const { topBarColor } = useTheme();
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const { isRightDrawerOpen } = useRightDrawer();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'lista' | 'dashboard'>('lista');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Hook para gerenciar filtros
  const { filters, updateFilter, clearFilters, getFilterParams } = useFilters();

  // Setores disponíveis (mesmos do modal de criar empresa)
  const sectors = [
    { value: 'tecnologia', label: 'Tecnologia' },
    { value: 'saude', label: 'Saúde' },
    { value: 'educacao', label: 'Educação' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'varejo', label: 'Varejo' },
    { value: 'industria', label: 'Indústria' },
    { value: 'servicos', label: 'Serviços' },
    { value: 'outros', label: 'Outros' }
  ];

  // Função para mudança de modo de visualização
  const handleViewModeChange = (mode: 'lista' | 'dashboard') => {
    setViewMode(mode);
  };

  // Filtrar empresas baseado nos filtros aplicados
  const filteredCompanies = useMemo(() => {
    if (!companies) return [];

    let filtered = [...companies];

    // Filtro por busca (nome da empresa)
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(company => 
        company.fantasy_name?.toLowerCase().includes(searchLower) ||
        company.company_name?.toLowerCase().includes(searchLower) ||
        company.email?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por setor
    if (filters.sector && filters.sector !== 'all') {
      filtered = filtered.filter(company => company.sector === filters.sector);
    }

    // Filtro por data (filtra por created_at - data de criação)
    if (filters.dateFrom) {
      // Normalizar a data do filtro para comparar apenas dia, mês e ano
      const filterDateStr = filters.dateFrom; // Formato: YYYY-MM-DD
      const [filterYear, filterMonth, filterDay] = filterDateStr.split('-').map(Number);
      
      filtered = filtered.filter(company => {
        if (!company.created_at) return false;
        
        // Criar objeto Date a partir do created_at
        const companyDate = new Date(company.created_at);
        
        // Extrair ano, mês e dia da data de criação
        const companyYear = companyDate.getFullYear();
        const companyMonth = companyDate.getMonth() + 1; // getMonth() retorna 0-11
        const companyDay = companyDate.getDate();
        
        // Comparar apenas dia, mês e ano (ignorando hora, minuto, segundo)
        return companyYear === filterYear && 
               companyMonth === filterMonth && 
               companyDay === filterDay;
      });
    }

    return filtered;
  }, [companies, filters]);

  // Botões de visualização seguindo o padrão de Activities
  const viewButtons = [
    {
      id: 'lista',
      label: 'Lista',
      icon: List,
      active: viewMode === 'lista'
    }
  ];

  const handleCreateCompany = async (formData: any) => {
    try {
      await createCompany(formData);
      setIsCreateModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Empresa cadastrada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar empresa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCompany = async (id: string, updates: any) => {
    try {
      await updateCompany(id, updates);
      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar empresa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a empresa "${name}"?`)) {
      try {
        console.log('🗑️ Tentando excluir empresa:', id, name);
        const result = await deleteCompany(id);
        
        if (result.error) {
          console.error('❌ Erro na exclusão:', result.error);
          toast({
            title: "Erro",
            description: result.error,
            variant: "destructive",
          });
        } else {
          console.log('✅ Empresa excluída com sucesso');
          toast({
            title: "Sucesso",
            description: "Empresa excluída com sucesso!",
          });
          // Recarregar a lista
          fetchCompanies();
        }
      } catch (error) {
        console.error('❌ Erro inesperado:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir empresa. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  // Função para importação em massa de empresas via Excel
  const handleImportCompanies = async (data: any[]) => {
    try {
      console.log('📊 [IMPORT] Iniciando importação de', data.length, 'empresas');

      // Filtrar apenas linhas com dados válidos
      const validData = data.filter(row => {
        return row.fantasy_name && row.fantasy_name.trim() !== '' && row.fantasy_name.trim() !== 'Exemplo';
      });

      console.log(`📊 [IMPORT] Dados válidos: ${validData.length} de ${data.length} total`);

      if (validData.length === 0) {
        throw new Error('Nenhum dado válido encontrado para importar');
      }

      // Processar dados importados
      const companiesData = await Promise.all(validData.map(async (row) => {
        // Processar status
        let processedStatus = 'active';
        if (row.status && row.status !== 'Exemplo') {
          const statusMap: { [key: string]: string } = {
            'ativo': 'active',
            'ativa': 'active',
            'inativo': 'inactive',
            'inativa': 'inactive',
            'prospecto': 'prospect',
            'cliente': 'customer'
          };
          processedStatus = statusMap[row.status.toLowerCase()] || row.status.toLowerCase();
        }

        // Processar tamanho
        let processedSize = undefined;
        if (row.size && row.size !== 'Exemplo') {
          const sizeMap: { [key: string]: string } = {
            'pequena': 'small',
            'média': 'medium',
            'grande': 'large',
            'corporação': 'enterprise',
            'empresa': 'enterprise'
          };
          processedSize = sizeMap[row.size.toLowerCase()] || row.size.toLowerCase();
        }

        return {
          fantasy_name: row.fantasy_name,
          company_name: row.legal_name || row.fantasy_name,
          cnpj: row.cnpj || undefined,
          phone: row.phone || undefined,
          email: row.email || undefined,
          address: row.address || undefined,
          city: row.city || undefined,
          state: row.state || undefined,
          cep: row.zip_code || undefined,
          sector: row.industry || undefined,
          status: processedStatus,
          description: row.notes || undefined
        };
      }));

      console.log('📊 [IMPORT] Empresas a serem importadas:', companiesData);

      // Importar empresas uma por uma
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const companyData of companiesData) {
        try {
          await createCompany(companyData);
          successCount++;
        } catch (error: any) {
          failCount++;
          errors.push(`Erro ao importar ${companyData.fantasyName}: ${error.message}`);
          console.error('❌ [IMPORT] Erro ao importar empresa:', companyData.fantasyName, error);
        }
      }

      console.log(`✅ [IMPORT] Importação concluída: ${successCount} sucesso, ${failCount} falhas`);

      if (successCount > 0) {
        toast({
          title: "Importação concluída!",
          description: `${successCount} empresa(s) importada(s) com sucesso${failCount > 0 ? ` (${failCount} falha(s))` : ''}.`,
        });
        
        // Recarregar a lista
        fetchCompanies();
      } else {
        throw new Error('Não foi possível importar nenhuma empresa');
      }

      if (errors.length > 0) {
        console.error('❌ [IMPORT] Erros durante importação:', errors);
      }

    } catch (error: any) {
      console.error('❌ [IMPORT] Erro geral na importação:', error);
      toast({
        title: "Erro na importação",
        description: error.message || 'Erro inesperado ao importar empresas',
        variant: "destructive"
      });
    }
  };


  // Função para limpar todos os filtros (incluindo os extras)
  const handleClearFilters = () => {
    clearFilters();
    // Limpar também os campos extras que não estão no FilterState padrão
    updateFilter('sector' as any, 'all');
    updateFilter('dateFrom' as any, '');
  };

  // Função para aplicar filtros
  const applyFilters = async () => {
    const filterParams = getFilterParams();
    // Aqui você pode implementar a lógica de filtros específica para empresas
    console.log('Aplicando filtros:', filterParams);
  };

  // Aplicar filtros automaticamente
  const handleFilterApply = () => {
    applyFilters();
  };

  // Função para focar no campo de busca
  const handleSearchIconClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Tratamento de erro seguindo o padrão das outras páginas
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar empresas</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchCompanies} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Loading state seguindo o padrão das outras páginas
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando suas empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header fixo responsivo ao sidebar */}
      <div 
        className="fixed top-[38px] right-0 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 z-30 transition-all duration-300"
        style={{
          left: sidebarExpanded ? '240px' : '64px'
        }}
      >
        {/* Botões de visualização */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
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
              {/* Botão de Upload/Importação Excel */}
              <UploadButton
                entityType="companies"
                onImportComplete={handleImportCompanies}
                title="Importar planilha Excel de empresas"
              />
            </div>
          </div>
        </div>

        {/* Barra de filtros funcionais - com filtro de Setor e Data */}
        <FilterBar
          filters={filters}
          onFilterChange={updateFilter}
          onApplyFilters={handleFilterApply}
          searchInputRef={searchInputRef}
          onClearFilters={handleClearFilters}
          employees={[]} // Não usado aqui
          departments={[]} // Não usado aqui
          sectors={sectors}
          searchPlaceholder="Filtrar por nome da empresa..."
          showResponsibleFilter={false}
          showWorkGroupFilter={false}
          showSectorFilter={true}
          showArchivedFilter={false}
        />
      </div>

      {/* Container principal com padding para o header fixo */}
      <div className="px-1 pt-[140px]">


        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'lista' && (
          <>
            {/* Companies Table */}
            {filteredCompanies && filteredCompanies.length > 0 ? (
              <CompaniesTable 
                companies={filteredCompanies} 
                onDeleteCompany={handleDeleteCompany}
                onUpdateCompany={handleUpdateCompany}
                onModalOpenChange={(isOpen) => {
                  console.log('📢 Modal state changed:', isOpen);
                  setIsEditModalOpen(isOpen);
                }}
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="text-center py-16">
                  <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {companies && companies.length > 0 
                      ? 'Nenhuma empresa encontrada com os filtros aplicados'
                      : 'Nenhuma empresa cadastrada'
                    }
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {companies && companies.length > 0
                      ? 'Tente ajustar os filtros para encontrar empresas.'
                      : 'Comece cadastrando sua primeira empresa para começar a gerenciar seus relacionamentos comerciais'
                    }
                  </p>
                  {companies && companies.length > 0 ? (
                    <Button 
                      onClick={handleClearFilters}
                      variant="outline"
                    >
                      Limpar Filtros
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="text-white hover:opacity-90"
                      style={{ backgroundColor: '#4A5477' }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Cadastrar Primeira Empresa
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}



        {/* Botão flutuante de nova empresa com posição exata da referência */}
        {console.log('🎯 Renderizando botão flutuante - isRightDrawerOpen:', isRightDrawerOpen, 'isEditModalOpen:', isEditModalOpen)}
        {!isRightDrawerOpen && !isEditModalOpen && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
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

        {/* Modal de criação de empresa */}
        <CreateCompanyModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateCompany}
        />
      </div>
    </div>
  );
};

export default Companies;
