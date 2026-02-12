import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Package, 
  Search, 
  Plus, 
  ChevronDown, 
  Filter, 
  Download, 
  Upload,
  Settings,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
  Box,
  ShoppingCart,
  BarChart3,
  MoreHorizontal,
  List,
  Grid3X3,
  Zap,
  X,
  GripVertical,
  Palette,
  AlignJustify,
  Calendar,
  Target,
  DollarSign, 
  Clock,
  Users,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle,
  XCircle,
  Star,
  Building,
  Mail,
  Phone,
  Globe,
  Award
} from 'lucide-react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  Legend,
  LabelList,
  Cell
} from 'recharts';
import { UploadButton } from '@/components/UploadButton';
import { InventoryAdjustmentModal } from '@/components/InventoryAdjustmentModal';
import { InventoryViewModal } from '@/components/InventoryViewModal';
import { InventoryEditModal } from '@/components/InventoryEditModal';
import CreateInventoryItemModal from '@/components/inventory/CreateInventoryItemModal';
import { FileUploadModal } from '@/components/FileUploadModal';
import { CustomFieldsModal } from '@/components/CustomFieldsModal';
import { toast } from 'sonner';
import { AdvancedFilters } from '@/components/ui/advanced-filters';
import { ButtonGroup } from '@/components/ui/button-group';
import InventoryFilterBar from '@/components/InventoryFilterBar';
import { useInventoryFilters } from '@/hooks/useInventoryFilters';
import { useInventory } from '@/hooks/useInventory';
import { useSuppliers } from '@/hooks/useSuppliers';


const Inventory = () => {
  const { topBarColor } = useTheme();
  const { showMenuButtons, sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'dashboard'>('list');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCustomFieldsModal, setShowCustomFieldsModal] = useState(false);
  const [showKanbanConfigModal, setShowKanbanConfigModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<{name: string; type: string}[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para configuração do Kanban
  const [kanbanStages, setKanbanStages] = useState([
    { id: 'in_stock', name: 'EM ESTOQUE', color: '#10B981', order: 1 },
    { id: 'low_stock', name: 'ESTOQUE BAIXO', color: '#F59E0B', order: 2 },
    { id: 'out_of_stock', name: 'SEM ESTOQUE', color: '#EF4444', order: 3 },
    { id: 'pending_restock', name: 'PENDENTE REPOSIÇÃO', color: '#8B5CF6', order: 4 }
  ]);
  
  const { 
    inventoryItems, 
    loading, 
    error, 
    createInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem 
  } = useInventory();

  const { filters, updateFilter, clearFilters, getFilterParams } = useInventoryFilters();
  const { suppliers: supplierRecords } = useSuppliers();
  
  const categories = ['Eletrônicos', 'Roupas', 'Casa e Jardim', 'Livros', 'Esportes', 'Outros'];
  const suppliers = Array.from(
    new Set(
      (supplierRecords || [])
        .map((supplier) => supplier.name)
        .filter((name): name is string => !!name)
    )
  );

  const categoryChartData = useMemo(() => {
    if (viewMode !== 'dashboard') return [];
    const totalItems = inventoryItems.length || 0;
    return categories.map((category) => {
      const count = inventoryItems.filter(item => item.category === category).length;
      const percentage = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
      return { name: category, count, percentage };
    }).filter(item => item.count > 0);
  }, [categories, inventoryItems, viewMode]);

  const statusChartData = useMemo(() => {
    if (viewMode !== 'dashboard') return [];
    const totalItems = inventoryItems.length || 0;
    const statusMap: Record<string, string> = {
      in_stock: 'Em Estoque',
      low_stock: 'Estoque Baixo',
      out_of_stock: 'Sem Estoque'
    };

    const counts: Record<string, number> = {};
    inventoryItems.forEach(item => {
      const key = item.status || 'in_stock';
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => {
      const percentage = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
      return {
        status,
        name: statusMap[status] || status,
        value: count,
        percentage
      };
    });
  }, [inventoryItems, viewMode]);



  const calculateTrend = (current: number, previous: number): { value: string, icon: React.ReactNode, color: string } => {
    if (previous === 0) return { value: '0%', icon: <Minus className="h-3 w-3" />, color: 'text-gray-400' };
    
    const change = ((current - previous) / previous) * 100;
    const absChange = Math.abs(change);
    
    if (change > 0) {
      return { 
        value: `+${absChange.toFixed(1)}%`, 
        icon: <ArrowUpRight className="h-3 w-3" />, 
        color: 'text-green-500' 
      };
    } else if (change < 0) {
      return { 
        value: `-${absChange.toFixed(1)}%`, 
        icon: <ArrowDownRight className="h-3 w-3" />, 
        color: 'text-red-500' 
      };
    } else {
      return {
        value: '0%', 
        icon: <Minus className="h-3 w-3" />, 
        color: 'text-gray-400' 
      };
    }
  };

  // Preparar dados para os cards e gráficos do novo Dashboard
  const dashboardData = useMemo(() => {
    if (viewMode !== 'dashboard') {
      return {
        totalItems: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalValue: 0,
        uniqueCategories: 0,
        itemsTrend: { value: '0%', icon: <Minus className="h-3 w-3" />, color: 'text-gray-400' },
        valueTrend: { value: '0%', icon: <Minus className="h-3 w-3" />, color: 'text-gray-400' },
        itemsSpark: [],
        valueSpark: []
      };
    }
    const totalItems = inventoryItems.length;
    const lowStockCount = inventoryItems.filter(item => item.status === 'low_stock').length;
    const outOfStockCount = inventoryItems.filter(item => item.status === 'out_of_stock').length;
    const totalValue = inventoryItems.reduce((sum, item) => sum + item.total_value, 0);
    const uniqueCategories = new Set(inventoryItems.map(item => item.category)).size;

    // Simular dados históricos baseados em created_at
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();

    // Contagens do mês anterior (simulada: itens criados antes deste mês)
    const prevItems = inventoryItems.filter(item => {
      if (!item.created_at) return false;
      const d = new Date(item.created_at);
      return d < new Date(currentYear, currentMonth, 1);
    });
    
    const prevTotalItems = prevItems.length;
    const prevTotalValue = prevItems.reduce((sum, item) => sum + item.total_value, 0);
    
    // Tendências
    const itemsTrend = calculateTrend(totalItems, prevTotalItems || totalItems * 0.9); // Fallback para não dar 0
    const valueTrend = calculateTrend(totalValue, prevTotalValue || totalValue * 0.9);
    
    // Sparklines (últimos 30 dias)
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });

    const itemsSpark = days.map(day => {
      // Acumulado até o dia
      const count = inventoryItems.filter(item => {
        if (!item.created_at) return false;
        const d = new Date(item.created_at);
        const dayDate = new Date(now.getFullYear(), parseInt(day.split('/')[1]) - 1, parseInt(day.split('/')[0]));
        return d <= dayDate; // Acumulado
      }).length;
      return { label: day, value: count };
    });

    const valueSpark = days.map(day => {
      const val = inventoryItems.filter(item => {
        if (!item.created_at) return false;
        const d = new Date(item.created_at);
        const dayDate = new Date(now.getFullYear(), parseInt(day.split('/')[1]) - 1, parseInt(day.split('/')[0]));
        return d <= dayDate;
      }).reduce((sum, item) => sum + item.total_value, 0);
      return { label: day, value: val };
    });

    return {
      totalItems,
      lowStockCount,
      outOfStockCount,
      totalValue,
      uniqueCategories,
      itemsTrend,
      valueTrend,
      itemsSpark,
      valueSpark
    };
  }, [inventoryItems, viewMode]);

  const productQuantityData = useMemo(() => {
    if (viewMode !== 'dashboard') return [];
    return [...inventoryItems]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(item => ({
        name: item.name,
        quantity: item.quantity
      }));
  }, [inventoryItems, viewMode]);

  const chartBlue = '#1d4ed8';

  const filteredItems = useMemo(() => inventoryItems.filter(item => {
    const matchesSearch = !filters.search || 
      item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.category.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = filters.category === 'all' || item.category === filters.category;
    let matchesStatus = true;
    if (filters.status !== 'all') {
      if (filters.status === 'in_stock') {
        matchesStatus = item.status === 'in_stock';
      } else if (filters.status === 'low_stock') {
        matchesStatus = item.status === 'low_stock';
      } else if (filters.status === 'out_of_stock') {
        matchesStatus = item.status === 'out_of_stock';
      }
    }
    const matchesSupplier = filters.supplier === 'all' || item.supplier === filters.supplier;
    let matchesDate = true;
    if (filters.dateRange !== 'all' && item.created_at) {
      const itemDate = new Date(item.created_at);
      const now = new Date();
      switch (filters.dateRange) {
        case 'today':
          matchesDate = itemDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          const weekEnd = new Date(now.setDate(now.getDate() + 6));
          matchesDate = itemDate >= weekStart && itemDate <= weekEnd;
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          matchesDate = itemDate >= monthStart && itemDate <= monthEnd;
          break;
        case 'overdue':
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = itemDate < sevenDaysAgo && item.quantity <= item.min_stock;
          break;
      }
    }
    return matchesSearch && matchesCategory && matchesStatus && matchesSupplier && matchesDate;
  }), [inventoryItems, filters]);

  const itemsByStatus = useMemo(() => {
    const inStock: any[] = [];
    const lowStock: any[] = [];
    const outOfStock: any[] = [];
    filteredItems.forEach(item => {
      if (item.status === 'in_stock') inStock.push(item);
      else if (item.status === 'low_stock') lowStock.push(item);
      else if (item.status === 'out_of_stock') outOfStock.push(item);
    });
    const pendingRestock = [...lowStock, ...outOfStock];
    return {
      in_stock: inStock,
      low_stock: lowStock,
      out_of_stock: outOfStock,
      pending_restock: pendingRestock,
    } as Record<string, any[]>;
  }, [filteredItems]);

  const allSelected = useMemo(() => {
    if (!filteredItems.length) return false;
    const ids = new Set(selectedIds);
    return filteredItems.every(i => ids.has(i.id));
  }, [filteredItems, selectedIds]);

  const hasSelection = selectedIds.length > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleBulkDelete = async () => {
    if (!hasSelection) return;
    const count = selectedIds.length;
    try {
      for (const id of selectedIds) {
        await deleteInventoryItem(id);
      }
      setSelectedIds([]);
      toast.success(`${count} itens excluídos com sucesso!`);
    } catch (error) {
      console.error('Erro ao excluir em massa:', error);
      toast.error('Erro ao excluir itens selecionados.');
    }
  };

  // Função para aplicar filtros
  const applyFilters = async () => {
    const filterParams = getFilterParams();
    // Os filtros são aplicados automaticamente via useMemo
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

  const navigate = useNavigate();

  const getStatusBadge = (status: string, quantity: number, minStock: number) => {
    switch (status) {
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800 border-red-300 text-xs">Sem estoque</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">Estoque baixo</Badge>;
      case 'in_stock':
        return <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">Em estoque</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300 text-xs">Desconhecido</Badge>;
    }
  };

  const handleView = (item: any) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = async (item: any) => {
    if (window.confirm(`Tem certeza que deseja excluir o item "${item.name}"?`)) {
      try {
        await deleteInventoryItem(item.id);
      toast.success(`Item "${item.name}" excluído com sucesso!`);
      } catch (error) {
        console.error('Erro ao excluir item:', error);
        toast.error('Erro ao excluir item. Tente novamente.');
      }
    }
  };

  const handleSaveEdit = async (updatedItem: any) => {
    try {
      await updateInventoryItem(updatedItem.id, {
        name: updatedItem.name,
        category: updatedItem.category,
        price: updatedItem.price,
        quantity: updatedItem.quantity,
        min_stock: updatedItem.minStock,
        supplier: updatedItem.supplier,
        description: updatedItem.description,
        image_url: updatedItem.image_url
      });
      toast.success(`Item "${updatedItem.name}" atualizado com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast.error('Erro ao atualizar item. Tente novamente.');
    }
  };

  const handleCreateItem = async (newItemData: any) => {
    try {
      await createInventoryItem({
      name: newItemData.name,
      category: newItemData.category || 'Outros',
        price: newItemData.price || 0,
      quantity: newItemData.stock || 0,
        min_stock: newItemData.minStock || 0,
      supplier: newItemData.supplier || '',
        description: newItemData.description || '',
      image_url: newItemData.image_url || null
      });
      
      toast.success(`Item "${newItemData.name}" criado com sucesso!`);
    } catch (error) {
      console.error('Erro ao criar item:', error);
      toast.error('Erro ao criar item. Tente novamente.');
    }
  };

  // Função para importação em massa de itens de estoque via Excel
  const handleImportInventory = async (data: any[]) => {
    try {
      console.log('📊 [IMPORT] Iniciando importação de', data.length, 'itens de estoque');

      // Filtrar apenas linhas com dados válidos
      const validData = data.filter(row => {
        return row.name && row.name.trim() !== '' && row.name.trim() !== 'Exemplo';
      });

      console.log(`📊 [IMPORT] Dados válidos: ${validData.length} de ${data.length} total`);

      if (validData.length === 0) {
        throw new Error('Nenhum dado válido encontrado para importar');
      }

      // Processar dados importados
      const inventoryData = await Promise.all(validData.map(async (row) => {
        // Buscar fornecedor pelo nome, se fornecido
        let supplier_id = undefined;
        if (row.supplier_name) {
          const { data: supplierData } = await supabase
            .from('suppliers')
            .select('id')
            .ilike('fantasy_name', `%${row.supplier_name}%`)
            .limit(1)
            .single();
          
          if (supplierData) {
            supplier_id = supplierData.id;
          }
        }

        // Processar status - sempre usar 'active' para itens sem status definido
        let processedStatus = 'active'; // Status padrão
        if (row.status && row.status !== 'Exemplo' && row.status.trim() !== '') {
          const statusMap: { [key: string]: string } = {
            'ativo': 'active',
            'inativo': 'inactive',
            'descontinuado': 'discontinued'
          };
          processedStatus = statusMap[row.status.toLowerCase()] || 'active';
        }

        const inventoryItemData = {
          name: row.name,
          sku: row.sku || null,
          description: row.description || '',
          category: row.category || 'Outros',
          quantity: row.quantity || 0,
          unit: row.unit || 'un',
          cost_price: row.cost_price || 0,
          sale_price: row.sale_price || 0,
          min_stock: row.min_stock || 0,
          max_stock: row.max_stock || null,
          location: row.location || null,
          supplier_id,
          status: processedStatus as 'active' | 'inactive' | 'discontinued',
          barcode: row.barcode || null,
          notes: row.notes || null
        };
        
        console.log('🔍 [IMPORT] Dados do item individual:', inventoryItemData);
        return inventoryItemData;
      }));

      console.log('📤 [IMPORT] Dados preparados para inserção:', inventoryData);

      // Inserir todos os itens no Supabase
      const { data: insertedItems, error } = await supabase
        .from('inventory')
        .insert(inventoryData)
        .select();

      if (error) {
        console.error('❌ [IMPORT] Erro no Supabase:', error);
        throw error;
      }

      console.log('✅ [IMPORT] Itens importados com sucesso:', insertedItems);

      // Recarregar inventário para atualizar todas as visualizações
      console.log('🔄 [IMPORT] Recarregando inventário...');
      refetch();
      console.log('✅ [IMPORT] Inventário recarregado');

      toast.success(`${insertedItems?.length || 0} itens foram importados com sucesso!`);

    } catch (error) {
      console.error('❌ [IMPORT] Erro ao importar itens:', error);
      throw error;
    }
  };

  const handleAddCustomField = (field: {name: string; type: string}) => {
    setCustomFields(prev => [...prev, field]);
    toast.success(`Campo personalizado "${field.name}" adicionado com sucesso!`);
  };

  // Funções para gerenciar etapas do Kanban
  const handleAddKanbanStage = () => {
    const newStage = {
      id: `stage_${Date.now()}`,
      name: 'Nova Etapa',
      color: '#6B7280',
      order: kanbanStages.length + 1
    };
    setKanbanStages(prev => [...prev, newStage]);
    toast.success('Nova etapa adicionada!');
  };

  const handleUpdateKanbanStage = (id: string, updates: { name?: string; color?: string }) => {
    setKanbanStages(prev => 
      prev.map(stage => 
        stage.id === id ? { ...stage, ...updates } : stage
      )
    );
    toast.success('Etapa atualizada!');
  };

  const handleDeleteKanbanStage = (id: string) => {
    if (kanbanStages.length <= 1) {
      toast.error('Deve haver pelo menos uma etapa no Kanban');
      return;
    }
    
    setKanbanStages(prev => prev.filter(stage => stage.id !== id));
    toast.success('Etapa removida!');
  };

  const handleReorderKanbanStages = (newStages: typeof kanbanStages) => {
    setKanbanStages(newStages);
    toast.success('Ordem das etapas atualizada!');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  

  // Botões de visualização igual à página Activities
  const viewButtons = [
    { 
      id: 'list', 
      label: 'Lista',
      icon: List,
      active: viewMode === 'list'
    },
    {
      id: 'kanban', 
      label: 'Quadro',
      icon: BarChart3,
      active: viewMode === 'kanban'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      active: viewMode === 'dashboard'
    }
  ];

  const handleViewModeChange = (mode: 'list' | 'kanban' | 'dashboard') => {
    setViewMode(mode);
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Faixa branca contínua com botões de navegação e filtros - alinhada perfeitamente */}
      <div className="bg-white -mt-6 -mx-6">
        {/* Botões de visualização */}
        <div className="px-3 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Botão das 3 setinhas para exibir BitrixSidebar */}
              {showMenuButtons && !sidebarExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                  onClick={expandSidebarFromMenu}
                  title="Expandir barra lateral"
                >
                  <AlignJustify size={16} />
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
              {/* Botão de Upload */}
              <UploadButton
                entityType="inventory"
                onImportComplete={handleImportInventory}
                title="Importar planilha Excel de estoque"
              />
              
              {/* Botão de configuração do Kanban */}
              {viewMode === 'kanban' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={() => setShowKanbanConfigModal(true)}
                  title="Configurar Kanban"
                >
                  <Settings className="h-4 w-4 text-gray-700" />
                </Button>
              )}
              
              
            </div>
          </div>
        </div>

        {/* Barra de filtros funcionais */}
        <InventoryFilterBar
          filters={filters}
          onFilterChange={updateFilter}
          onApplyFilters={handleFilterApply}
          searchInputRef={searchInputRef}
          onClearFilters={clearFilters}
          categories={categories}
          suppliers={suppliers}
          searchPlaceholder="Filtrar por nome do item, SKU ou categoria..."
        />
      </div>

      {/* Container principal com padding otimizado */}
      <div className="px-2 pt-3">

        {/* Conteúdo baseado na visualização selecionada */}
        <>
            {/* Cards de estatísticas - só mostrar na visualização de lista e kanban */}
            {(viewMode === 'list' || viewMode === 'kanban') && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    Total de Itens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{inventoryItems.length}</div>
                  <p className="text-xs text-gray-500">produtos cadastrados</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Estoque Baixo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {inventoryItems.filter(item => item.status === 'low_stock').length}
                  </div>
                  <p className="text-xs text-gray-500">Requer atenção</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Valor Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(inventoryItems.reduce((sum, item) => sum + item.total_value, 0))}
                  </div>
                  <p className="text-xs text-gray-500">valor do estoque</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Itens em Falta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {inventoryItems.filter(item => item.status === 'out_of_stock').length}
                  </div>
                  <p className="text-xs text-gray-500">Necessita reposição</p>
                </CardContent>
              </Card>
            </div>
            )}

            {viewMode === 'kanban' && (
              /* Kanban Board - Layout responsivo com CSS Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full auto-rows-min -ml-2">
                {kanbanStages.map((stage) => {
                  // Filtrar itens baseado no status da etapa
                  const stageItems = itemsByStatus[stage.id] || [];

                  return (
                    <div key={stage.id} className="bg-white border border-[#E5E7EB] rounded-lg min-h-fit flex flex-col">
                      <div 
                        className="p-4 border-b border-[#E5E7EB] border-t-2 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                        style={{ borderTopColor: stage.color }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-inter text-[12px] text-[#374151]">{stage.name}</h3>
                          <span className="font-inter text-[11px] text-[#6B7280]">
                            {stageItems.length}
                          </span>
                        </div>
                      </div>
                  
                      <div className="flex-1 p-3 space-y-3">
                        {stageItems.map(item => (
                        <div 
                          key={item.id}
                          className="group relative bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        >
                          <h4 className="font-inter text-[14px] text-[#111827] mb-2 pr-8">{item.name}</h4>
                          <p className="font-inter text-[12px] text-[#6B7280] mb-3">
                            {item.sku} • {item.category}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] px-1.5 py-1 rounded bg-[#D1FAE5] text-[#059669]">
                              {item.quantity} unidades
                            </span>
                            <div className="flex items-center text-[12px] text-[#6B7280]">
                              <span className="font-inter">
                                {formatCurrency(item.total_value)}
                              </span>
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleView(item)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                      </div>
                      </div>
                        </div>
                      ))}
                    
                        {stageItems.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <Package className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Nenhum item nesta etapa</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {viewMode === 'list' && (
              <Card className="bg-white border border-gray-200">
                {hasSelection && (
                  <div className="flex justify-end px-3 py-2 border-b border-gray-100">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="h-8"
                    >
                      Excluir selecionados
                    </Button>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-6 py-2">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          aria-label="Selecionar todos"
                        />
                      </TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Nome</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">SKU</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Categoria</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Quantidade</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Status</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Preço</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Fornecedor</TableHead>
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Total</TableHead>
                      {customFields.map((field) => (
                        <TableHead key={field.name} className="font-medium text-gray-900 py-2 text-xs">
                          {field.name}
                        </TableHead>
                      ))}
                      <TableHead className="font-medium text-gray-900 py-2 text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell className="py-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelectOne(item.id)}
                            aria-label={`Selecionar ${item.name}`}
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="font-mono text-xs text-gray-600">{item.sku}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800 border-gray-300">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-gray-900 text-sm">{item.quantity}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          {getStatusBadge(item.status, item.quantity, item.min_stock)}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-gray-600 text-sm">{formatCurrency(item.price)}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-gray-600 text-sm">{item.supplier}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-gray-600 text-sm">{formatCurrency(item.total_value)}</div>
                        </TableCell>
                        {customFields.map((field) => (
                          <TableCell key={field.name} className="py-2">
                            <div className="text-gray-600 text-sm">-</div>
                          </TableCell>
                        ))}
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleView(item)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {viewMode === 'dashboard' && (
              <div className="space-y-6">
                {/* Cards de Métricas - Layout Leads/Sales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                  {/* Card 1: Total Items */}
                  <Card className="bg-gradient-to-br from-white to-blue-50 border shadow-md hover:shadow-lg transition-shadow duration-300 h-[140px] overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                    <CardHeader className="pb-2 px-4">
                      <CardTitle className="text-sm font-normal flex items-center justify-between gap-2">
                        <span>Total de Itens</span>
                        <div className="p-2 rounded-full bg-blue-100">
                          <Box className="w-4 h-4 text-blue-600" />
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2 px-3">
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.totalItems}</p>
                        <span className={`text-xs font-medium rounded px-2 py-0.5 flex items-center gap-1 ${dashboardData.itemsTrend.color.includes('green') ? 'bg-green-100 text-green-700' : dashboardData.itemsTrend.color.includes('red') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          {dashboardData.itemsTrend.icon}
                          {dashboardData.itemsTrend.value}
                        </span>
                      </div>
                      <div className="mt-2 h-[48px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dashboardData.itemsSpark} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gradItems" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={chartBlue} stopOpacity={0.35} />
                                <stop offset="100%" stopColor={chartBlue} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', color: '#111827', fontSize: 12, padding: '6px 8px' }} />
                            <Area type="monotone" dataKey="value" stroke={chartBlue} strokeWidth={2} fill="url(#gradItems)" isAnimationActive={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 2: Valor Total */}
                  <Card className="bg-gradient-to-br from-white to-blue-50 border shadow-md hover:shadow-lg transition-shadow duration-300 h-[140px] overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                    <CardHeader className="pb-2 px-4">
                      <CardTitle className="text-sm font-normal flex items-center justify-between gap-2">
                        <span>Valor Total</span>
                        <div className="p-2 rounded-full bg-green-100">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2 px-3">
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.totalValue)}</p>
                        <span className={`text-xs font-medium rounded px-2 py-0.5 flex items-center gap-1 ${dashboardData.valueTrend.color.includes('green') ? 'bg-green-100 text-green-700' : dashboardData.valueTrend.color.includes('red') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          {dashboardData.valueTrend.icon}
                          {dashboardData.valueTrend.value}
                        </span>
                      </div>
                      <div className="mt-2 h-[48px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dashboardData.valueSpark} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', color: '#111827', fontSize: 12, padding: '6px 8px' }} />
                            <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fill="url(#gradValue)" isAnimationActive={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 3: Estoque Baixo */}
                  <Card className="bg-gradient-to-br from-white to-blue-50 border shadow-md hover:shadow-lg transition-shadow duration-300 h-[140px] overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                    <CardHeader className="pb-2 px-4">
                      <CardTitle className="text-sm font-normal flex items-center justify-between gap-2">
                        <span>Estoque Baixo</span>
                        <div className="p-2 rounded-full bg-yellow-100">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-3">
                      <div className="flex items-end gap-2 justify-between">
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.lowStockCount}</p>
                        <span className="text-xs font-medium rounded px-2 py-0.5 flex items-center gap-1 bg-yellow-50 text-yellow-700">
                          <Activity className="h-3 w-3" />
                          Atenção
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-2">Itens próximos do mínimo</p>
                      <div className="w-full bg-yellow-100 rounded-full h-1.5 mt-4">
                        <div 
                          className="bg-yellow-500 h-1.5 rounded-full" 
                          style={{ width: `${Math.min((dashboardData.lowStockCount / Math.max(dashboardData.totalItems, 1)) * 100, 100)}%` }} 
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 4: Sem Estoque */}
                  <Card className="bg-gradient-to-br from-white to-blue-50 border shadow-md hover:shadow-lg transition-shadow duration-300 h-[140px] overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                    <CardHeader className="pb-2 px-4">
                      <CardTitle className="text-sm font-normal flex items-center justify-between gap-2">
                        <span>Sem Estoque</span>
                        <div className="p-2 rounded-full bg-red-100">
                          <ShoppingCart className="w-4 h-4 text-red-600" />
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-3">
                      <div className="flex items-end gap-2 justify-between">
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.outOfStockCount}</p>
                        <span className="text-xs font-medium rounded px-2 py-0.5 flex items-center gap-1 bg-red-50 text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          Crítico
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-2">Itens indisponíveis</p>
                      <div className="w-full bg-red-100 rounded-full h-1.5 mt-4">
                        <div 
                          className="bg-red-500 h-1.5 rounded-full" 
                          style={{ width: `${Math.min((dashboardData.outOfStockCount / Math.max(dashboardData.totalItems, 1)) * 100, 100)}%` }} 
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 5: Categorias */}
                  <Card className="bg-gradient-to-br from-white to-blue-50 border shadow-md hover:shadow-lg transition-shadow duration-300 h-[140px] overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                    <CardHeader className="pb-2 px-4">
                      <CardTitle className="text-sm font-normal flex items-center justify-between gap-2">
                        <span>Categorias</span>
                        <div className="p-2 rounded-full bg-purple-100">
                          <Grid3X3 className="w-4 h-4 text-purple-600" />
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-3">
                      <div className="flex items-end gap-2 justify-between">
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.uniqueCategories}</p>
                        <span className="text-xs font-medium rounded px-2 py-0.5 flex items-center gap-1 bg-purple-50 text-purple-700">
                          <List className="h-3 w-3" />
                          Ativas
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-2">Segmentos de produtos</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráficos e análises - Layout Leads/Sales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-normal flex items-center gap-2">
                        Itens por Categoria
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={categoryChartData} layout="vertical" margin={{ top: 4, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" stroke="#6b7280" tickLine={false} style={{ fontSize: '11px' }} />
                          <YAxis type="category" dataKey="name" stroke="#6b7280" tickLine={false} width={100} style={{ fontSize: '11px' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', color: '#111827', fontSize: 12, padding: '8px 12px' }} />
                          <Bar dataKey="count" name="Qtd" fill={chartBlue} barSize={18} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                            <LabelList dataKey="count" position="right" fill="#374151" style={{ fontSize: '11px' }} />
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-normal flex items-center gap-2">
                        Status do Estoque
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={statusChartData} barCategoryGap="20%" margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" stroke="#6b7280" tickLine={false} style={{ fontSize: '11px' }} />
                          <YAxis stroke="#6b7280" tickLine={false} style={{ fontSize: '11px' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', color: '#111827', fontSize: 12, padding: '8px 12px' }} />
                          <Bar dataKey="value" name="Quantidade" fill="#10B981" barSize={32} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                             <Cell fill="#10B981" />
                             <Cell fill="#F59E0B" />
                             <Cell fill="#EF4444" />
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráfico de Quantidade por Produto (Top 10) */}
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-normal flex items-center gap-2">
                      Top 10 Produtos por Quantidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={productQuantityData} layout="vertical" margin={{ top: 4, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#6b7280" tickLine={false} style={{ fontSize: '11px' }} />
                        <YAxis type="category" dataKey="name" stroke="#6b7280" tickLine={false} width={150} style={{ fontSize: '11px' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', color: '#111827', fontSize: 12, padding: '8px 12px' }} />
                        <Bar dataKey="quantity" name="Quantidade" fill={chartBlue} barSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                          <LabelList dataKey="quantity" position="right" fill="#374151" style={{ fontSize: '11px' }} />
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
        </>
      </div>

      {/* Botão flutuante de novo item com posição exata da referência */}
      <Button
        onClick={handleOpenCreateModal}
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

      <InventoryAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
      />

      <CreateInventoryItemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateItem}
      />
      
      <InventoryViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        item={selectedItem}
      />

      <InventoryEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        item={selectedItem}
        onSave={handleSaveEdit}
      />
      
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

      <CustomFieldsModal
        isOpen={showCustomFieldsModal}
        onClose={() => setShowCustomFieldsModal(false)}
        onAddField={handleAddCustomField}
      />

      {/* Modal de configuração do Kanban */}
      {showKanbanConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowKanbanConfigModal(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Configurar Kanban</h2>
                <button
                  onClick={() => setShowKanbanConfigModal(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Personalize as etapas do seu quadro Kanban
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {kanbanStages.map((stage, index) => {
                  const colors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899', '#6B7280'];
                  return (
                    <div
                      key={stage.id}
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      {/* Drag handle */}
                      <div className="cursor-move text-gray-400 hover:text-gray-600">
                        <GripVertical className="h-5 w-5" />
                      </div>

                      {/* Color picker */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-300 cursor-pointer"
                          style={{ backgroundColor: stage.color }}
                          onClick={() => {
                            const currentIndex = colors.indexOf(stage.color);
                            const nextColor = colors[(currentIndex + 1) % colors.length];
                            handleUpdateKanbanStage(stage.id, { color: nextColor });
                          }}
                        />
                        <Palette className="h-4 w-4 text-gray-500" />
                      </div>

                      {/* Stage name input */}
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => handleUpdateKanbanStage(stage.id, { name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nome da etapa"
                      />

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteKanbanStage(stage.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Remover etapa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add new stage button */}
              <button
                onClick={handleAddKanbanStage}
                className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Adicionar Nova Etapa
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {kanbanStages.length} etapa{kanbanStages.length !== 1 ? 's' : ''} configurada{kanbanStages.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowKanbanConfigModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => setShowKanbanConfigModal(false)}
                    className="text-white hover:opacity-90"
                    style={{ backgroundColor: '#4A5477', borderColor: '#4A5477' }}
                  >
                    Salvar Configurações
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
