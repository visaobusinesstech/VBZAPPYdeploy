import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import ExpandingTextBlock from '@/components/ExpandingTextBlock';
import { 
  BarChart3, 
  AlignJustify,
  TrendingUp,
  Users,
  FolderOpen,
  Package,
  Target,
  FileText,
  DollarSign,
  Activity,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  ShoppingCart,
  Briefcase,
  Filter,
  User
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
  ComposedChart,
  RadialBarChart,
  RadialBar
} from 'recharts';

// Importar componentes de dashboard específicos
const WriteoffsDashboardCharts = React.lazy(() => import('@/components/WriteoffsDashboardCharts'));
const DashboardCharts = React.lazy(() => import('@/components/DashboardCharts'));
const LeadsSalesDashboard = React.lazy(() => import('@/components/dashboard/LeadsSalesDashboard'));
const InventoryDashboardCharts = React.lazy(() => import('@/components/InventoryDashboardCharts'));

// Hooks personalizados
import { useActivities } from '@/hooks/useActivities';
import { useLeads } from '@/hooks/useLeads-fixed';
import { useFunnelStages } from '@/hooks/useFunnelStages';
import { useWriteoffs } from '@/hooks/useWriteoffs';
import { useInventory } from '@/hooks/useInventory';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';

interface DashboardOption {
  id: string;
  label: string;
  icon: any;
  description: string;
}

const Reports = () => {
  const { t } = useTranslation();
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const { topBarColor } = useTheme();
  const { user } = useAuth();
  const [selectedDashboard, setSelectedDashboard] = useState<string>('overview');

  // Filter States
  const [dateRange, setDateRange] = useState<string>('month');
  const [responsibleId, setResponsibleId] = useState<string>('all');

  // Hooks de dados
  const { activities = [], loading: activitiesLoading, refetch: refetchActivities } = useActivities();
  const { leads = [], loading: leadsLoading } = useLeads();
  const { stages = [] } = useFunnelStages();
  const { writeoffs = [], loading: writeoffsLoading } = useWriteoffs();
  const { inventoryItems = [], loading: inventoryLoading } = useInventory();
  const { users: companyUsers, loading: usersLoading } = useCompanyUsers(user?.id);

  // Opções de dashboards disponíveis
  const dashboardOptions: DashboardOption[] = [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: BarChart3,
      description: 'Resumo de todos os dashboards do sistema'
    },
    {
      id: 'activities',
      label: 'Atividades',
      icon: Activity,
      description: 'Dashboard de atividades e tarefas'
    },
    {
      id: 'leads-sales',
      label: 'Leads e Vendas',
      icon: Target,
      description: 'Dashboard de leads e funil de vendas'
    },
    {
      id: 'writeoffs',
      label: 'Baixas',
      icon: Package,
      description: 'Dashboard de baixas de inventário'
    },
    {
      id: 'inventory',
      label: 'Inventário',
      icon: FolderOpen,
      description: 'Dashboard de itens e estoque'
    }
  ];

  // Filtros padrão para cada dashboard
  const defaultFilters = {
    activities: {
      dateRange: 'all',
      status: 'all',
      priority: 'all',
      responsible: 'all',
      type: 'all'
    },
    leadsSales: {
      dateRange: 'month',
      stage: 'all',
      responsible: 'all',
      value: 'all'
    },
    writeoffs: {
      status: 'all',
      reason: 'all',
      value: 'all',
      dateRange: 'all',
      dateFrom: '',
      dateTo: ''
    }
  };

  // Helper function for date filtering
  const isWithinDateRange = (dateString: string | undefined, range: string) => {
    if (!dateString || range === 'all') return true;
    const date = new Date(dateString);
    const now = new Date();
    
    // Normalize to start of day for accurate comparison
    const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
      case 'today':
        return dateDay.getTime() === nowDay.getTime();
      case 'week':
        const oneWeekAgo = new Date(nowDay);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return dateDay >= oneWeekAgo;
      case 'month':
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  };

  // Filtered Inventory Items
  const filteredInventoryItems = useMemo(() => {
    return inventoryItems.filter(item => {
      // Date Filter
      if (!isWithinDateRange(item.created_at, dateRange)) return false;
      
      // Responsible Filter
      if (responsibleId !== 'all') {
         const resp = item.responsible_id || item.user_id;
         if (resp && resp !== responsibleId) return false;
      }
      return true;
    });
  }, [inventoryItems, dateRange, responsibleId]);

  // Dados resumidos para a visão geral
  const overviewData = useMemo(() => {
    // Apply filters to all lists for Overview
    const filteredActivities = activities.filter(a => {
      if (!isWithinDateRange(a.due_date || a.created_at, dateRange)) return false;
      if (responsibleId !== 'all' && (a.responsible_id || a.user_id) !== responsibleId) return false;
      return true;
    });

    const filteredLeads = leads.filter(l => {
      if (!isWithinDateRange(l.created_at, dateRange)) return false;
      if (responsibleId !== 'all' && (l.responsible_id || l.user_id) !== responsibleId) return false;
      return true;
    });

    const filteredWriteoffs = writeoffs.filter(w => {
      if (!isWithinDateRange(w.created_at || w.date, dateRange)) return false;
      if (responsibleId !== 'all' && (w.responsible_id || w.user_id) !== responsibleId) return false;
      return true;
    });

    // Atividades
    const totalActivities = filteredActivities.length;
    const completedActivities = filteredActivities.filter(a => a.status === 'completed').length;
    const inProgressActivities = filteredActivities.filter(a => a.status === 'in_progress').length;

    // Leads e Vendas
    const totalLeads = filteredLeads.length;
    const wonLeads = filteredLeads.filter(l => l.status === 'won').length;
    const activeLeads = filteredLeads.filter(l => !['won', 'lost'].includes(l.status || '')).length;
    const totalRevenue = filteredLeads
      .filter(l => l.status === 'won')
      .reduce((sum, l) => sum + (l.value || 0), 0);

    // Inventário
    const totalInventoryValue = filteredInventoryItems.reduce((sum, item) => sum + (item.total_value || 0), 0);
    const lowStockItems = filteredInventoryItems.filter(item => item.status === 'low_stock').length;
    const outOfStockItems = filteredInventoryItems.filter(item => item.status === 'out_of_stock').length;

    // Baixas
    const totalWriteoffs = filteredWriteoffs.length;
    const totalWriteoffsValue = filteredWriteoffs.reduce((sum, w) => sum + (w.total_value || 0), 0);

    return {
      activities: {
        total: totalActivities,
        completed: completedActivities,
        inProgress: inProgressActivities,
        completionRate: totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0
      },
      leads: {
        total: totalLeads,
        won: wonLeads,
        active: activeLeads,
        conversionRate: totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0
      },
      revenue: totalRevenue,
      inventory: {
        totalValue: totalInventoryValue,
        lowStock: lowStockItems,
        outOfStock: outOfStockItems
      },
      writeoffs: {
        total: totalWriteoffs,
        totalValue: totalWriteoffsValue
      }
    };
  }, [activities, leads, filteredInventoryItems, writeoffs, dateRange, responsibleId]);

  // Dados para gráficos da visão geral
  const overviewChartData = useMemo(() => {
    // Gráfico de atividades por status
    const activityStatusData = [
      { name: 'Em Progresso', value: overviewData.activities.inProgress, color: '#3B82F6' },
      { name: 'Concluídas', value: overviewData.activities.completed, color: '#10B981' },
      { name: 'Pendentes', value: activities.filter(a => a.status === 'pending').length, color: '#F59E0B' }
    ].filter(item => item.value > 0);

    // Gráfico de leads por estágio (últimos 7 dias)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const leadsTimelineData = last7Days.map(date => {
      const dayLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate.toDateString() === date.toDateString();
      });

      return {
        date: date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
        criados: dayLeads.length,
        convertidos: dayLeads.filter(l => l.status === 'won').length
      };
    });

    // Gráfico Financeiro Comparativo
    const financialData = [
      {
        name: 'Receita (Vendas)',
        valor: overviewData.revenue,
        fill: '#10B981' // Verde
      },
      {
        name: 'Ativo (Estoque)',
        valor: overviewData.inventory.totalValue,
        fill: '#3B82F6' // Azul
      },
      {
        name: 'Perda (Baixas)',
        valor: overviewData.writeoffs.totalValue,
        fill: '#EF4444' // Vermelho
      }
    ];

    // Gráfico de Distribuição de Estoque (Simples)
    const stockStatusData = [
      { name: 'Em Estoque', value: inventoryItems.filter(i => i.status === 'in_stock').length, color: '#10B981' },
      { name: 'Baixo Estoque', value: overviewData.inventory.lowStock, color: '#F59E0B' },
      { name: 'Sem Estoque', value: overviewData.inventory.outOfStock, color: '#EF4444' }
    ].filter(i => i.value > 0);

    return {
      activityStatus: activityStatusData,
      leadsTimeline: leadsTimelineData,
      financial: financialData,
      stockStatus: stockStatusData
    };
  }, [overviewData, activities, leads, inventoryItems]);

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    const handleActivityUpdate = () => {
      try { refetchActivities?.(); } catch {}
    };
    window.addEventListener('activity-created' as any, handleActivityUpdate);
    window.addEventListener('activity-updated' as any, handleActivityUpdate);
    window.addEventListener('activity-deleted' as any, handleActivityUpdate);
    return () => {
      window.removeEventListener('activity-created' as any, handleActivityUpdate);
      window.removeEventListener('activity-updated' as any, handleActivityUpdate);
      window.removeEventListener('activity-deleted' as any, handleActivityUpdate);
    };
  }, [refetchActivities]);

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
              
              {/* Botão de navegação - Relatórios */}
            <Button 
                    variant="ghost"
              size="sm" 
                className="h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg bg-gray-50 text-slate-900 shadow-inner"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Relatórios
              </Button>
            </div>
            
            {/* Badge de status na direita */}
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
              <Activity className="h-3 w-3 mr-1" />
              Dados atualizados
            </Badge>
          </div>
        </div>

        {/* Filtro de seleção de dashboard */}
        <div className="px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Dashboard:
            </label>
            <Select value={selectedDashboard} onValueChange={setSelectedDashboard}>
              <SelectTrigger className="w-full sm:w-[280px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 h-10 text-sm font-medium shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                <SelectValue placeholder="Escolha um dashboard" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900">
                {dashboardOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem 
                      key={option.id} 
                      value={option.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg">
                          <Icon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{option.label}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <ExpandingTextBlock title="Escrever Notas" storageKey="reports-notes" />
            <ExpandingTextBlock title="Escrever Planejamento" storageKey="reports-plan" />
          </div>
        </div>

        {/* Faixa de Filtros Globais */}
        <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtros:</span>
            </div>

            {/* Filtro de Período */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Período:</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <SelectValue placeholder="Selecione o período" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Responsável */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Responsável:</label>
              <Select value={responsibleId} onValueChange={setResponsibleId}>
                <SelectTrigger className="w-[200px] h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs">
                   <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                    <SelectValue placeholder="Selecione o responsável" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os responsáveis</SelectItem>
                  {companyUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Container principal com padding para o header fixo e filtros extras */}
      <div className="pt-[220px] px-6 py-6">
        {/* Visão Geral - Padrão quando nenhum dashboard específico é selecionado */}
        {selectedDashboard === 'overview' && (
          <div className="space-y-4">
            {/* Cards de métricas principais - 4 Colunas para incluir Inventário e Baixas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Vendas (Receita) */}
              <motion.div
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <Card className="bg-gradient-to-br from-white to-green-50 border shadow-md hover:shadow-lg transition-shadow duration-300 h-[140px] overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                  <CardHeader className="pb-2 px-4">
                    <CardTitle className="text-sm font-normal flex items-center justify-between gap-2">
                      <span>Receita Total (Vendas)</span>
                      <div className="p-2 rounded-full bg-green-100">
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-2 px-3">
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-gray-900">
                        R$ {(overviewData.revenue / 1000).toFixed(0)}k
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-xs">
                      <span className="bg-green-100 text-green-700 text-xs font-medium rounded px-2 py-0.5 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Crescimento
                      </span>
                      <span className="text-gray-500 ml-2">
                        {overviewData.leads.won} vendas ganhas
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card 2: Inventário (Ativo) */}
              <motion.div
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.1 }}
                whileHover="hover"
              >
                <Card className="bg-gradient-to-br from-white to-blue-50 border shadow-md hover:shadow-lg transition-shadow duration-300 h-[140px] overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                  <CardHeader className="pb-2 px-4">
                    <CardTitle className="text-sm font-normal flex items-center justify-between gap-2">
                      <span>Valor em Estoque</span>
                      <div className="p-2 rounded-full bg-blue-100">
                        <FolderOpen className="w-4 h-4 text-blue-600" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-2 px-3">
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-gray-900">
                         R$ {(overviewData.inventory.totalValue / 1000).toFixed(0)}k
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-xs">
                      <span className="bg-blue-100 text-blue-700 text-xs font-medium rounded px-2 py-0.5 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Ativo Circulante
                      </span>
                      <span className="text-gray-500 ml-2">
                        {overviewData.inventory.lowStock} itens baixo estoque
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card 3: Baixas (Perdas) */}
              <motion.div
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2 }}
                whileHover="hover"
              >
                <Card className="bg-gradient-to-br from-white to-red-50 border shadow-md hover:shadow-lg transition-shadow duration-300 h-[140px] overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                  <CardHeader className="pb-2 px-4">
                    <CardTitle className="text-sm font-normal flex items-center justify-between gap-2">
                      <span>Total de Baixas</span>
                      <div className="p-2 rounded-full bg-red-100">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-2 px-3">
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-gray-900">
                         R$ {(overviewData.writeoffs.totalValue / 1000).toFixed(0)}k
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-xs">
                      <span className="bg-red-100 text-red-700 text-xs font-medium rounded px-2 py-0.5 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 rotate-180" />
                        Perdas/Saídas
                      </span>
                      <span className="text-gray-500 ml-2">
                        {overviewData.writeoffs.total} baixas
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card 4: Atividades (Eficiência) */}
              <motion.div
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.3 }}
                whileHover="hover"
              >
                <Card className="bg-gradient-to-br from-white to-indigo-50 border shadow-md hover:shadow-lg transition-shadow duration-300 h-[140px] overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                  <CardHeader className="pb-2 px-4">
                    <CardTitle className="text-sm font-normal flex items-center justify-between gap-2">
                      <span>Eficiência (Atividades)</span>
                      <div className="p-2 rounded-full bg-indigo-100">
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-2 px-3">
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-gray-900">
                        {overviewData.activities.completionRate.toFixed(0)}%
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-xs">
                      <span className="bg-indigo-100 text-indigo-700 text-xs font-medium rounded px-2 py-0.5 flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Produtividade
                      </span>
                      <span className="text-gray-500 ml-2">
                        {overviewData.activities.completed}/{overviewData.activities.total} concluídas
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Gráficos Estratégicos - 2 por linha */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gráfico 1 - Visão Financeira Macro */}
              <motion.div
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.5 }}
                whileHover="hover"
              >
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-normal flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Visão Financeira Macro
                      <Badge variant="outline" className="ml-auto text-xs font-normal">Vendas vs Estoque vs Perdas</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overviewChartData.financial} layout="vertical" margin={{ top: 4, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                        <XAxis type="number" tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`} stroke="#6b7280" tickLine={false} style={{ fontSize: '11px' }} />
                        <YAxis type="category" dataKey="name" width={100} stroke="#6b7280" tickLine={false} style={{ fontSize: '11px' }} />
                        <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', color: '#111827', fontSize: 12, padding: '8px 12px' }} formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                        <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={24}>
                          {overviewChartData.financial.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Gráfico 2 - Funil de Vendas Recente */}
              <motion.div
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.6 }}
                whileHover="hover"
              >
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-normal flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      Funil de Novos Leads (7 Dias)
                      <Badge variant="outline" className="ml-auto text-xs font-normal">Comercial</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overviewChartData.leadsTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCriados" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorConvertidos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" tickLine={false} style={{ fontSize: '11px' }} />
                        <YAxis stroke="#6b7280" tickLine={false} style={{ fontSize: '11px' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', color: '#111827', fontSize: 12, padding: '8px 12px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Area 
                          type="monotone" 
                          dataKey="criados" 
                          stroke="#8B5CF6" 
                          fillOpacity={1} 
                          fill="url(#colorCriados)" 
                          name="Novos Leads"
                          strokeWidth={2}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="convertidos" 
                          stroke="#10B981" 
                          fillOpacity={1} 
                          fill="url(#colorConvertidos)" 
                          name="Vendas Realizadas"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Gráfico 3 - Composição de Estoque */}
              <motion.div
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.7 }}
                whileHover="hover"
              >
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-normal flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      Saúde do Estoque
                      <Badge variant="outline" className="ml-auto text-xs font-normal">Inventário</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 h-64">
                    <div className="h-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={overviewChartData.stockStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {overviewChartData.stockStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', color: '#111827', fontSize: 12, padding: '8px 12px' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Gráfico 4 - Status de Atividades */}
              <motion.div
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.8 }}
                whileHover="hover"
              >
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border overflow-hidden" style={{ borderColor: `${topBarColor}33` }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-normal flex items-center gap-2">
                      <Activity className="h-4 w-4 text-indigo-600" />
                      Fluxo de Trabalho
                      <Badge variant="outline" className="ml-auto text-xs font-normal">Atividades</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overviewChartData.activityStatus} layout="horizontal" margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" tickLine={false} style={{ fontSize: '11px' }} />
                        <YAxis stroke="#6b7280" tickLine={false} style={{ fontSize: '11px' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', color: '#111827', fontSize: 12, padding: '8px 12px' }} cursor={{ fill: '#f3f4f6' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                          {overviewChartData.activityStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}

        {/* Dashboard de Atividades */}
        {selectedDashboard === 'activities' && (
          <div className="space-y-4">
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Carregando dados...</p>
                </div>
              </div>
            ) : (
              <React.Suspense fallback={<div style={{ padding: 12 }}>Carregando dashboard...</div>}>
              <DashboardCharts 
                activities={activities} 
                filters={{
                  ...defaultFilters.activities,
                  dateRange,
                  responsible: responsibleId
                }}
              />
              </React.Suspense>
            )}
            </div>
        )}

        {/* Dashboard de Leads e Vendas */}
        {selectedDashboard === 'leads-sales' && (
          <div className="space-y-4">
            {leadsLoading ? (
              <div className="flex items-center justify-center py-12">
            <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Carregando dados...</p>
                </div>
            </div>
            ) : (
              <React.Suspense fallback={<div style={{ padding: 12 }}>Carregando dashboard...</div>}>
              <LeadsSalesDashboard 
                leads={leads} 
                stages={stages}
                filters={{
                  ...defaultFilters.leadsSales,
                  dateRange,
                  responsible: responsibleId, // For consistency if used elsewhere
                  responsibleId: responsibleId // For LeadsSalesDashboard specific check
                }}
                activities={activities}
              />
              </React.Suspense>
            )}
            </div>
        )}

        {/* Dashboard de Baixas */}
        {selectedDashboard === 'writeoffs' && (
          <div className="space-y-4">
            {writeoffsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Carregando dados...</p>
                </div>
              </div>
            ) : (
              <React.Suspense fallback={<div style={{ padding: 12 }}>Carregando dashboard...</div>}>
              <WriteoffsDashboardCharts 
                writeoffs={writeoffs} 
                filters={{
                  ...defaultFilters.writeoffs,
                  dateRange,
                  responsible: responsibleId
                }}
              />
              </React.Suspense>
            )}
          </div>
        )}

        {/* Dashboard de Inventário */}
        {selectedDashboard === 'inventory' && (
          <div className="space-y-4">
            {inventoryLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Carregando dados...</p>
                </div>
              </div>
            ) : (
              <React.Suspense fallback={<div style={{ padding: 12 }}>Carregando dashboard...</div>}>
              <InventoryDashboardCharts 
                inventoryItems={filteredInventoryItems}
              />
              </React.Suspense>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
