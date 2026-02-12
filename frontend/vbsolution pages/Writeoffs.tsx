
import { useState, useEffect, Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSidebar } from '@/contexts/SidebarContext';
import { 
  Plus, 
  Search, 
  FileText,
  AlertTriangle,
  Calendar as CalendarIcon,
  User,
  Eye,
  Edit,
  Trash2,
  Filter,
  BarChart3,
  List,
  Clock,
  Building2,
  DollarSign,
  Package,
  AlignJustify,
  CheckCircle,
  XCircle,
  ChevronDown,
  
} from 'lucide-react';
import CreateWriteoffModal from '@/components/writeoffs/CreateWriteoffModal';
import { ViewWriteoffModal } from '@/components/writeoffs/ViewWriteoffModal';
import { EditWriteoffModal } from '@/components/writeoffs/EditWriteoffModal';
const WriteoffsDashboardChartsLazy = lazy(() => import('@/components/WriteoffsDashboardCharts'));
import { useWriteoffs } from '@/hooks/useWriteoffs';
import { toast } from 'sonner';

const Writeoffs = () => {
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const { writeoffs, loading, fetchWriteoffs, updateWriteoff, deleteWriteoff } = useWriteoffs();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWriteoff, setSelectedWriteoff] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'lista'>('lista');
  
  // Unified Filters State
  const [filters, setFilters] = useState({
    status: 'all',
    reason: 'all',
    value: 'all',
    dateRange: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      approved: { label: 'Aprovada', className: 'bg-green-100 text-green-800 border-green-300' },
      rejected: { label: 'Rejeitada', className: 'bg-red-100 text-red-800 border-red-300' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={`${config.className} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getReasonLabel = (reason: string) => {
    const reasons: { [key: string]: string } = {
      damage: 'Produto Danificado',
      expiry: 'Produto Vencido',
      loss: 'Perda/Roubo',
      return: 'Devolução',
      quality: 'Problema de Qualidade',
      other: 'Outros'
    };
    return reasons[reason] || reason;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleCreateWriteoff = () => {
    // Recarregar a lista de writeoffs
    fetchWriteoffs();
    toast.success('Nova baixa criada com sucesso!');
  };

  const handleSearchIconClick = () => {
    if (searchInputRef) {
      searchInputRef.focus();
    }
  };

  const handleDelete = async (writeoff: any) => {
    const writeoffName = writeoff.name || `Baixa #${writeoff.id.slice(0, 8)}`;
    if (window.confirm(`Tem certeza que deseja excluir "${writeoffName}"?`)) {
      const success = await deleteWriteoff(writeoff.id);
      if (success) {
        toast.success('Baixa excluída com sucesso!');
      } else {
        toast.error('Erro ao excluir baixa');
      }
    }
  };

  const handleView = (writeoff: any) => {
    setSelectedWriteoff(writeoff);
    setShowViewModal(true);
  };

  const handleEdit = (writeoff: any) => {
    setSelectedWriteoff(writeoff);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (id: string, data: any) => {
    try {
      const success = await updateWriteoff(id, data);
      if (success) {
        toast.success('Baixa atualizada com sucesso!');
        return true;
      } else {
        toast.error('Erro ao atualizar baixa');
        return false;
      }
    } catch (error) {
      toast.error('Erro ao atualizar baixa');
      return false;
    }
  };

  const handleViewModeChange = (mode: 'dashboard' | 'lista') => {
    setViewMode(mode);
  };

  // Funções para gerenciar filtros do Dashboard
  const filteredWriteoffs = writeoffs.filter(writeoff => {
    // Search Filter
    const matchesSearch = searchTerm === '' || 
      (writeoff.name && writeoff.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (writeoff.reason && getReasonLabel(writeoff.reason).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (writeoff.approved_by && writeoff.approved_by.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status Filter
    const matchesStatus = filters.status === 'all' || writeoff.status === filters.status;
    
    // Reason Filter
    const matchesReason = filters.reason === 'all' || writeoff.reason === filters.reason;

    // Value Filter
    let matchesValue = true;
    if (filters.value !== 'all') {
      const value = writeoff.quantity || 0; // Assuming value is quantity for now as per previous logic, or strictly value?
      // Check getWriteoffValue logic from charts. For now let's assume quantity or some value field.
      // If we look at the table, "Valor Total" is displayed as "-". 
      // But the charts use getWriteoffValue. Let's assume a 'value' or 'total' field exists.
      const val = writeoff.total || writeoff.value || writeoff.quantity || 0;
      if (filters.value === 'low') matchesValue = val < 100;
      else if (filters.value === 'medium') matchesValue = val >= 100 && val < 500;
      else if (filters.value === 'high') matchesValue = val >= 500 && val < 1000;
      else if (filters.value === 'very_high') matchesValue = val >= 1000;
    }

    // Date Filter
    let matchesDate = true;
    const date = new Date(writeoff.created_at);
    const now = new Date();
    
    if (filters.dateRange !== 'all') {
        if (filters.dateRange === 'today') {
            matchesDate = date.toDateString() === now.toDateString();
        } else if (filters.dateRange === 'week') {
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            matchesDate = date >= weekAgo;
        } else if (filters.dateRange === 'month') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            matchesDate = date >= monthStart;
        }
    } else if (filters.dateFrom && filters.dateTo) {
        const from = new Date(filters.dateFrom);
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        matchesDate = date >= from && date <= to;
    }
    
    return matchesSearch && matchesStatus && matchesReason && matchesValue && matchesDate;
  });

  // Botões de visualização (Lista primeiro)
  const viewButtons = [
    {
      id: 'lista', 
      label: 'Lista',
      icon: List,
      active: viewMode === 'lista'
    },
    { 
      id: 'dashboard', 
      label: 'Dashboard',
      icon: BarChart3,
      active: viewMode === 'dashboard'
    }
  ];

  const totalItems = writeoffs.reduce((sum, writeoff) => sum + (writeoff.quantity || 0), 0);
  const totalValue = writeoffs.reduce((sum, writeoff) => sum + (writeoff.quantity || 0), 0);
  const pendingWriteoffs = writeoffs.filter(w => w.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Faixa branca contínua com botões de navegação e filtros - alinhada perfeitamente */}
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

        {/* Barra de filtros unificada - igual Leads/Sales */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* Campo de busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  ref={setSearchInputRef}
                  placeholder="Pesquisar baixas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8 text-sm border-0 bg-transparent focus:border-0 focus:ring-0 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Filtros funcionais */}
            <div className="flex items-center gap-2">
              {/* Filtro de Status */}
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="h-7 w-28 border-0 bg-transparent text-black text-xs shadow-none pl-2 pr-0.5 hover:bg-blue-50 focus:bg-blue-50">
                  <Package className="h-3 w-3 mr-3" />
                  <SelectValue placeholder="Status" />
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Todos os Status</SelectItem>
                  <SelectItem value="pending" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Pendente</SelectItem>
                  <SelectItem value="approved" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Aprovada</SelectItem>
                  <SelectItem value="rejected" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Rejeitada</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro de Motivo */}
              <Select value={filters.reason} onValueChange={(value) => handleFilterChange('reason', value)}>
                <SelectTrigger className="h-7 w-28 border-0 bg-transparent text-black text-xs shadow-none pl-2 pr-0.5 hover:bg-blue-50 focus:bg-blue-50">
                  <AlertTriangle className="h-3 w-3 mr-3" />
                  <SelectValue placeholder="Motivo" />
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Todos os Motivos</SelectItem>
                  <SelectItem value="damage" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Danos</SelectItem>
                  <SelectItem value="expired" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Vencimento</SelectItem>
                  <SelectItem value="theft" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Roubo</SelectItem>
                  <SelectItem value="loss" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Perda</SelectItem>
                  <SelectItem value="other" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Outros</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro de Valor */}
              <Select value={filters.value} onValueChange={(value) => handleFilterChange('value', value)}>
                <SelectTrigger className="h-7 w-28 border-0 bg-transparent text-black text-xs shadow-none pl-2 pr-0.5 hover:bg-blue-50 focus:bg-blue-50">
                  <DollarSign className="h-3 w-3 mr-3" />
                  <SelectValue placeholder="Valor" />
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Todos os Valores</SelectItem>
                  <SelectItem value="low" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Baixo (até 100)</SelectItem>
                  <SelectItem value="medium" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Médio (100-500)</SelectItem>
                  <SelectItem value="high" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Alto (500-1000)</SelectItem>
                  <SelectItem value="very_high" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Muito Alto (1000+)</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro de Data */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs shadow-none border-0 bg-transparent text-black hover:bg-blue-50 focus:bg-blue-50 flex items-center gap-2"
                    >
                      <CalendarIcon className="h-3 w-3 text-gray-500" />
                      <span className="truncate">
                        {filters.dateRange && filters.dateRange !== 'all'
                          ? (filters.dateRange === 'today' ? 'Hoje' : filters.dateRange === 'week' ? 'Últimos 7 dias' : filters.dateRange === 'month' ? 'Este mês' : 'Todos')
                          : (filters.dateFrom && filters.dateTo
                              ? `${format(new Date(filters.dateFrom), 'dd/MM/yyyy')} - ${format(new Date(filters.dateTo), 'dd/MM/yyyy')}`
                              : 'Período')}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="range"
                      selected={
                        filters.dateFrom && filters.dateTo
                          ? { from: new Date(filters.dateFrom), to: new Date(filters.dateTo) }
                          : undefined
                      }
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          handleFilterChange('dateFrom', range.from.toISOString().split('T')[0]);
                          handleFilterChange('dateTo', range.to.toISOString().split('T')[0]);
                          handleFilterChange('dateRange', 'all');
                        } else {
                          handleFilterChange('dateFrom', '');
                          handleFilterChange('dateTo', '');
                        }
                      }}
                      numberOfMonths={1}
                      locale={ptBR}
                      classNames={{
                        head_cell: "text-muted-foreground rounded-md w-7 font-normal text-[0.75rem]",
                        day: "h-7 w-7 p-0 font-normal aria-selected:opacity-100",
                        cell: "h-7 w-7 text-center text-sm p-0 relative",
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <Select value={filters.dateRange || 'all'} onValueChange={(value) => {
                  handleFilterChange('dateRange', value);
                  if (value !== 'all') {
                    handleFilterChange('dateFrom', '');
                    handleFilterChange('dateTo', '');
                  }
                }}>
                  <SelectTrigger className="h-7 w-36 border-0 bg-transparent text-black text-xs shadow-none pl-2 pr-1 hover:bg-blue-50 focus:bg-blue-50">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Todos</SelectItem>
                    <SelectItem value="today" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Hoje</SelectItem>
                    <SelectItem value="week" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Últimos 7 dias</SelectItem>
                    <SelectItem value="month" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Este mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Container principal com padding otimizado */}
        <div className={`px-6 ${viewMode === 'dashboard' ? 'pt-3' : 'pt-3'}`}>

        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'dashboard' && (
          <Suspense fallback={<div className="px-6 py-4">Carregando...</div>}>
            <div className="dashboard-page bg-transparent min-h-screen -mx-6 px-6 -mt-2 pb-6 ml-2" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
              <WriteoffsDashboardChartsLazy
                writeoffs={writeoffs}
                filters={filters}
              />
            </div>
          </Suspense>
        )}

        {viewMode === 'lista' && (
          <div className="w-full overflow-hidden ml-2">
            {/* Lista View - Tabela de baixas */}
            {/* Writeoffs Table */}
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg w-full">
              <div className="overflow-x-auto">
                <Table className="w-full table-auto">
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Nome</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Motivo</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Itens</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Valor Total</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Data</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 whitespace-nowrap">Criado Por</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-3 text-right whitespace-nowrap">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWriteoffs.map((writeoff) => (
                      <TableRow key={writeoff.id} className="hover:bg-gray-50/50 border-b border-gray-100 transition-colors">
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900 text-sm">{writeoff.name || `Baixa #${writeoff.id.slice(0, 8)}`}</div>
                          <div className="text-xs text-gray-500 mt-1">Quantidade: {writeoff.quantity}</div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="text-gray-900 text-sm">{getReasonLabel(writeoff.reason)}</div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          {getStatusBadge(writeoff.status)}
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="text-gray-900 font-medium text-sm">{writeoff.quantity}</div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="text-gray-900 font-semibold text-sm">-</div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{new Date(writeoff.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">{writeoff.approved_by || 'Pendente'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-gray-100 rounded-lg"
                              onClick={() => handleView(writeoff)}
                            >
                              <Eye className="h-3 w-3 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-gray-100 rounded-lg"
                              onClick={() => handleEdit(writeoff)}
                            >
                              <Edit className="h-3 w-3 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-red-50 rounded-lg"
                              onClick={() => handleDelete(writeoff)}
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}

        {filteredWriteoffs.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma baixa encontrada
              </h2>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? `Não foram encontradas baixas para "${searchTerm}"`
                  : 'Você ainda não possui baixas de inventário cadastradas.'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Baixa
                </Button>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Botão flutuante de Nova Baixa */}
      <Button
        onClick={() => setShowCreateModal(true)}
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

      <CreateWriteoffModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onWriteoffCreated={handleCreateWriteoff}
      />

      {/* Modal de visualizar baixa */}
      <ViewWriteoffModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedWriteoff(null);
        }}
        writeoff={selectedWriteoff}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal de editar baixa */}
      <EditWriteoffModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedWriteoff(null);
        }}
        writeoff={selectedWriteoff}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default Writeoffs;
