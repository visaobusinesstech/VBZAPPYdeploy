import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVB } from '@/contexts/VBContext';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { supabase } from '@/integrations/supabase/client';
import { useCompanies } from '@/hooks/useCompanies';
import { useCompaniesQuery } from '@/hooks/useCompaniesQuery';
import { useOrganizationQuery } from '@/hooks/useOrganizationQuery';
import { DropResult } from 'react-beautiful-dnd';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useRightDrawer } from '@/contexts/RightDrawerContext';
import { toast } from '@/hooks/use-toast';
import { useFilters } from '@/hooks/useFilters';
import { useWorkGroup } from '@/contexts/WorkGroupContext';
import KanbanBoard from '@/components/KanbanBoard';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import BitrixActivityForm from '@/components/BitrixActivityForm';
import { CreateActivityModal } from '@/components/CreateActivityModal';
import FilterBar from '@/components/FilterBar';
import { ActivityViewModal } from '@/components/ActivityViewModal';
import { RightDrawerModal, ModalSection } from '@/components/ui/right-drawer-modal';
import { ActivitiesCalendarView } from '@/components/ActivitiesCalendarView';
import { 
  Search,
  Plus,
  Eye,
  User,
  Share,
  ChevronDown,
  MoreHorizontal,
  Kanban,
  List,
  Clock,
  Calendar,
  BarChart3,
  X,
  ArrowUpDown,
  Building2,
  Edit,
  Trash2,
  AlignJustify,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
const DashboardCharts = React.lazy(() => import('@/components/DashboardCharts'));
import VirtualList from '@/components/VirtualList';
import { Badge } from '@/components/ui/badge';

const Activities = () => {
  const { t } = useTranslation();
  const { state } = useVB();
  const { companies } = state;
  const { companies: companiesHook } = useCompanies();
  const { data: cachedCompanies } = useCompaniesQuery();
  const { data: organization } = useOrganizationQuery();
  const { activities, loading, error, createActivity, updateActivity, deleteActivity, moveActivity, refetch, fetchActivities } = useActivities();
  const { user } = useAuth();
  const { users: companyUsers } = useCompanyUsers(user?.id);
  const { workGroups } = useWorkGroup();
  const employees = React.useMemo<any[]>(
    () => (companyUsers || []).map(user => ({ id: user.id, name: user.nome })),
    [companyUsers]
  );
  
  // Mapear grupos de trabalho para o formato esperado pelo FilterBar
  const workGroupNames = React.useMemo<string[]>(
    () => (workGroups || []).map(group => group.name),
    [workGroups]
  );
  const { topBarColor } = useTheme();
  const { isRightDrawerOpen } = useRightDrawer();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'board' | 'lista' | 'prazo' | 'calendario' | 'dashboard'>('board');
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [isKanbanConfigModalOpen, setIsKanbanConfigModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingActivity, setViewingActivity] = useState<any>(null);
  
  // Estados para fullscreen
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenLayout, setFullscreenLayout] = useState<'fit' | 'scroll'>('fit');

  
  // Estados para filtros do Dashboard
  const [dashboardFilters, setDashboardFilters] = useState({
    dateRange: 'all',
    status: 'all',
    priority: 'all',
    responsible: 'all',
    type: 'all'
  });
  
  const [prazoViewMode, setPrazoViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [expandedSprint, setExpandedSprint] = useState<number | null>(null);
  const [sprintsViewMode, setSprintsViewMode] = useState<'compact' | 'expanded'>('compact');
  const [sprintsMinimized, setSprintsMinimized] = useState(false);
  const [isKanbanEditModalOpen, setIsKanbanEditModalOpen] = useState(false);
  // Estado inicial vazio - será preenchido pelo useEffect
  const [kanbanColumns, setKanbanColumns] = useState<any[]>([]);
  const [kanbanLoaded, setKanbanLoaded] = useState(false);
  const [profiles, setProfiles] = useState<{[key: string]: string}>({});
  
  // Estados para controle
  const [forceLoading, setForceLoading] = useState(false);
  
  // Usar contexto do sidebar
  const { sidebarExpanded, setSidebarExpanded, showMenuButtons, expandSidebarFromMenu } = useSidebar();

  
  // Debug do estado do sidebar - removido para evitar re-renders
  // console.log('🔧 [ACTIVITIES] Estado do sidebar:', { sidebarExpanded, showMenuButtons });

  // Funções para fullscreen customizado (não usa API nativa do browser)
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
  };

  const toggleFullscreenLayout = () => {
    setFullscreenLayout(prev => (prev === 'fit' ? 'scroll' : 'fit'));
  };

  // Carregar configurações do Kanban salvas
  useEffect(() => {
    // Tentar carregar configuração salva primeiro
    const savedKanbanConfig = localStorage.getItem('kanbanColumns');
    if (savedKanbanConfig) {
      try {
        const parsedConfig = JSON.parse(savedKanbanConfig);
        console.log('📋 [KANBAN] Carregando configuração salva:', parsedConfig);

        let normalizedConfig = Array.isArray(parsedConfig) ? parsedConfig : [];

        // Garantir que existe a coluna de BACKLOG (status "open") sempre na primeira posição
        const hasBacklogColumn = normalizedConfig.some(
          (col: any) =>
            col.id === 'backlog' ||
            col.status === 'open' ||
            (typeof col.name === 'string' && col.name.toLowerCase().includes('backlog'))
        );

        if (!hasBacklogColumn) {
          const backlogColumn = {
            id: 'backlog',
            name: 'BACKLOG',
            color: 'gray',
            status: 'open'
          };
          // Inserir no início sem perder configuração existente do usuário
          normalizedConfig = [backlogColumn, ...normalizedConfig];
        }

        // Normalizar colunas padrão para usarem os status consistentes
        normalizedConfig = normalizedConfig.map((col: any) => {
          if (col.id === 'todo' || col.status === 'todo') {
            return { ...col, id: 'todo', status: col.status || 'pending' };
          }
          if (col.id === 'doing' || col.status === 'doing') {
            return { ...col, id: 'doing', status: col.status || 'in_progress' };
          }
          if (col.id === 'done' || col.status === 'done') {
            return { ...col, id: 'done', status: col.status || 'completed' };
          }
          return col;
        });

        setKanbanColumns(normalizedConfig);
        setKanbanLoaded(true);
      } catch (error) {
        console.error('❌ [KANBAN] Erro ao carregar configuração salva:', error);
        // Se houver erro, usar configuração padrão
        setKanbanColumns([
          { id: 'backlog', name: 'BACKLOG', color: 'gray', status: 'open' },
          { id: 'todo', name: 'PENDENTE', color: 'gray', status: 'pending' },
          { id: 'doing', name: 'EM PROGRESSO', color: 'orange', status: 'in_progress' },
          { id: 'done', name: 'CONCLUÍDA', color: 'green', status: 'completed' }
        ]);
        setKanbanLoaded(true);
      }
    } else {
      // Se não houver configuração salva, usar padrão
      console.log('📋 [KANBAN] Usando configuração padrão');
      setKanbanColumns([
        { id: 'backlog', name: 'BACKLOG', color: 'gray', status: 'open' },
        { id: 'todo', name: 'PENDENTE', color: 'gray', status: 'pending' },
        { id: 'doing', name: 'EM PROGRESSO', color: 'orange', status: 'in_progress' },
        { id: 'done', name: 'CONCLUÍDA', color: 'green', status: 'completed' }
      ]);
      setKanbanLoaded(true);
    }
    
    // Carregar perfis
    loadProfiles();
  }, []);

  // Salvar configurações do Kanban sempre que houver mudanças (apenas após carregar)
  useEffect(() => {
    if (kanbanLoaded && kanbanColumns.length > 0) {
      localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    }
  }, [kanbanColumns, kanbanLoaded]);

  // Carregar atividades quando a página é montada
  // O carregamento é controlado pelo useEffect de filtros (L324) que roda na montagem
  // O hook useActivities NÃO carrega automaticamente para evitar loops e race conditions

  // Debug simplificado apenas quando necessário - otimizado
  useEffect(() => {
  }, [activities, loading, error]);


  // Timeout para evitar loading infinito
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setForceLoading(true);
      }, 10000); // 10 segundos

      return () => clearTimeout(timeout);
    } else {
      setForceLoading(false);
    }
  }, [loading]);

  // Handlers - definidos após os useEffects
  const handleViewModalEdit = (activity: any) => {
    setEditingActivity(activity);
    setIsEditModalOpen(true);
  };

  // Calcular largura dos blocos para ocupar toda a tela sem scroll horizontal
  const getBlockWidth = () => {
    const sidebarWidth = sidebarExpanded ? 240 : 64;
    const containerPadding = 24; // Padding do container principal
    const screenWidth = window.innerWidth;
    const availableWidth = screenWidth - sidebarWidth - containerPadding;
    
    // Usar o número real de colunas configuradas
    const numberOfColumns = kanbanColumns.length || 5;
    const gapSize = 8; // Gap entre colunas
    const totalGaps = Math.max(numberOfColumns - 1, 0) * gapSize;
    const blockWidth = (availableWidth - totalGaps) / numberOfColumns;
    
    // Garantir largura mínima para usabilidade
    const minWidth = 200;
    const calculatedWidth = Math.max(Math.floor(blockWidth), minWidth);
    
    return `${calculatedWidth}px`;
  };

  // Container deve ocupar toda a largura disponível sem scroll horizontal
  const getContainerWidth = () => {
    const sidebarWidth = sidebarExpanded ? 240 : 64;
    return `calc(100vw - ${sidebarWidth}px - 24px)`; // Largura total menos sidebar e padding
  };
  
  // Estilo do container Kanban para eliminar scroll horizontal
  const getKanbanContainerStyle = () => {
    const numberOfColumns = kanbanColumns.length || 5;
    return {
      display: 'flex',
      gap: '8px',
      width: '100%',
      maxWidth: getContainerWidth(),
      overflow: 'hidden', // Eliminar scroll horizontal
      justifyContent: 'space-between'
    };
  };
  
  // Hook para gerenciar filtros
  const { filters, updateFilter, clearFilters, getFilterParams } = useFilters();
  
  // Estado adicional para filtro de data de criação
  const [dateFilter, setDateFilter] = useState<string>('');

  // Função para carregar perfis
  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nome');
      
      if (error) throw error;
      
      const profilesMap: {[key: string]: string} = {};
      data?.forEach(profile => {
        profilesMap[profile.id] = profile.nome;
      });
      setProfiles(profilesMap);
    } catch (error) {
      // Erro ao carregar perfis - silencioso
    }
  };

  // Função para obter nome do perfil
  const getProfileName = (profileId: string) => {
    return profiles[profileId] || profileId;
  };
  
  const navigate = useNavigate();
  const location = useLocation();

  // Função para aplicar filtros com debounce
  const applyFilters = async () => {
    const filterParams = getFilterParams();
    if (dateFilter) {
      filterParams.created_date = dateFilter;
    }
    (filterParams as any).view = viewMode;
    await fetchActivities(filterParams);
  };
  const filtersDebounceRef = React.useRef<number | null>(null);
  const isFirstRun = React.useRef(true);

  useEffect(() => {
    // Na primeira execução (montagem), carregar imediatamente sem debounce
    // Isso evita o "piscar" de lista vazia ao navegar entre páginas
    // Mas aguardar usuário estar carregado
    
    if (isFirstRun.current) {
      if (user) {
        isFirstRun.current = false;
        applyFilters();
      }
      return;
    }

    if (filtersDebounceRef.current) {
      window.clearTimeout(filtersDebounceRef.current);
    }
    filtersDebounceRef.current = window.setTimeout(() => {
      if (user) applyFilters();
    }, 250);
    return () => {
      if (filtersDebounceRef.current) {
        window.clearTimeout(filtersDebounceRef.current);
        filtersDebounceRef.current = null;
      }
    };
  }, [filters, dateFilter, user]);

  // Aplicar filtros automaticamente
  const handleFilterApply = () => {
    applyFilters();
  };

  // Mapeamento de cores para as bordas superiores das colunas
  const getColumnBorderColor = (status: string) => {
    const colorMap = {
      'open': '#D1D5DB',      // Cinza
      'pending': '#FACC15',   // Amarelo
      'in_progress': '#3B82F6', // Azul
      'review': '#EC4899',    // Rosa
      'completed': '#10B981'  // Verde
    };
    return colorMap[status as keyof typeof colorMap] || '#D1D5DB';
  };

  // Função para obter o nome de exibição do status
  const getStatusDisplayName = (status: string) => {
    const nameMap = {
      'open': 'ABERTO',
      'pending': 'PENDENTE', 
      'in_progress': 'EM PROGRESSO',
      'review': 'REVISÃO',
      'completed': 'CONCLUÍDO'
    };
    return nameMap[status as keyof typeof nameMap] || status.toUpperCase();
  };

  // Funções para gerenciar sprints
  const sprintData = React.useMemo(() => {
    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.status === 'completed').length;
    const inProgressActivities = activities.filter(a => a.status === 'in_progress').length;
    const pendingActivities = activities.filter(a => a.status === 'pending' || a.status === 'open').length;
    return [
      {
        id: 1,
        name: 'Sprint 1',
        completed: Math.min(completedActivities, Math.floor(totalActivities * 0.3)),
        total: Math.floor(totalActivities * 0.3),
        startDate: '01/01',
        endDate: '15/01',
        status: 'completed',
        progress: Math.min(completedActivities, Math.floor(totalActivities * 0.3)) / Math.floor(totalActivities * 0.3) * 100
      },
      {
        id: 2,
        name: 'Sprint 2',
        completed: Math.min(completedActivities - Math.floor(totalActivities * 0.3), Math.floor(totalActivities * 0.4)),
        total: Math.floor(totalActivities * 0.4),
        startDate: '16/01',
        endDate: '31/01',
        status: 'completed',
        progress: Math.min(completedActivities - Math.floor(totalActivities * 0.3), Math.floor(totalActivities * 0.4)) / Math.floor(totalActivities * 0.4) * 100
      },
      {
        id: 3,
        name: 'Sprint 3',
        completed: inProgressActivities,
        total: inProgressActivities + Math.floor(pendingActivities * 0.5),
        startDate: '01/02',
        endDate: '15/02',
        status: 'in_progress',
        progress: inProgressActivities / (inProgressActivities + Math.floor(pendingActivities * 0.5)) * 100
      },
      {
        id: 4,
        name: 'Sprint 4',
        completed: 0,
        total: Math.max(pendingActivities - Math.floor(pendingActivities * 0.5), 1),
        startDate: '16/02',
        endDate: '28/02',
        status: 'planned',
        progress: 0
      }
    ];
  }, [activities]);

  const handleToggleSprintExpansion = (sprintId: number) => {
    setExpandedSprint(expandedSprint === sprintId ? null : sprintId);
  };

  const handleToggleSprintsView = () => {
    setSprintsViewMode(sprintsViewMode === 'compact' ? 'expanded' : 'compact');
  };

  const handleToggleSprintsMinimized = () => {
    setSprintsMinimized(prev => !prev);
  };

  const handleOpenKanbanEditModal = () => {
    setIsKanbanEditModalOpen(true);
  };

  const handleCloseKanbanEditModal = () => {
    setIsKanbanEditModalOpen(false);
  };

  // Funções para gerenciar filtros do Dashboard
  const handleDashboardFilterChange = (key: string, value: string) => {
    setDashboardFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearDashboardFilters = () => {
    setDashboardFilters({
      dateRange: 'all',
      status: 'all',
      priority: 'all',
      responsible: 'all',
      type: 'all'
    });
  };

  const handleRefreshDashboard = () => {
    refetch();
  };

  // Wrapper para o moveActivity do KanbanBoard
  const handleMoveActivity = async (activityId: string, newColumn: string, newPosition: number) => {
    try {
      // Mapear coluna para status - usar o status da coluna configurada
      const column = kanbanColumns.find(col => col.id === newColumn);
      let newStatus = newColumn; // Usar o ID da coluna como status por padrão
      
      // Mapear para status padrão do Supabase
      if (newColumn === 'backlog' || newColumn === 'open') {
        // Coluna de BACKLOG mantém as tarefas em "open"
        newStatus = 'open';
      } else if (newColumn === 'todo' || newColumn === 'pending') {
        newStatus = 'pending';
      } else if (newColumn === 'doing' || newColumn === 'in_progress') {
        newStatus = 'in_progress';
      } else if (newColumn === 'done' || newColumn === 'completed') {
        newStatus = 'completed';
      } else if (column?.status) {
        // Usar o status configurado da coluna
        newStatus = column.status;
      }
      
      console.log('🔄 Movendo atividade:', { activityId, newColumn, newStatus, column });
      
      const result = await moveActivity(activityId, newStatus);
      
      if (result.error) {
        console.error('❌ Erro ao mover atividade:', result.error);
        // Mostrar toast de erro
        toast({
          title: "Erro ao mover atividade",
          description: result.error,
          variant: "destructive"
        });
        return { data: null, error: result.error };
      }
      
      console.log('✅ Atividade movida com sucesso');
      
      // Mostrar toast de sucesso
      toast({
        title: "Atividade movida",
        description: `Atividade movida para ${newColumn}`,
      });
      
      return result;
    } catch (error) {
      console.error('❌ Erro no handleMoveActivity:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Mostrar toast de erro
      toast({
        title: "Erro ao mover atividade",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { data: null, error: errorMessage };
    }
  };

  const handleUpdateKanbanColumn = (columnId: string, updates: any) => {
    setKanbanColumns(prev => 
      prev.map(col => 
        col.id === columnId ? { ...col, ...updates } : col
      )
    );
    
    // Feedback visual para mudanças
    if (updates.name) {
      toast({
        title: "Nome atualizado",
        description: `Etapa renomeada para "${updates.name}"`,
        duration: 2000,
      });
    }
  };

  const handleAddKanbanColumn = () => {
    const newId = `column_${Date.now()}`;
    const defaultName = 'NOVA ETAPA';
    const defaultStatus = 'pending';
    const newColumn = {
      id: newId,
      name: defaultName,
      color: 'blue',
      status: defaultStatus
    };
    setKanbanColumns(prev => [...prev, newColumn]);
    
    toast({
      title: "Nova etapa adicionada",
      description: "Você pode personalizar o nome e cor da nova etapa",
      duration: 3000,
    });
  };

  const handleRemoveKanbanColumn = async (columnId: string) => {
    if (kanbanColumns.length > 1) {
      const columnToRemove = kanbanColumns.find(col => col.id === columnId);
      
      // Encontrar a coluna "Pendente" para mover as atividades
      const pendenteColumn = kanbanColumns.find(col => 
        col.status === 'pending' || 
        col.status === 'todo' || 
        col.name?.toLowerCase().includes('pendente') ||
        col.name?.toLowerCase().includes('pending')
      );
      
      const pendenteStatus = pendenteColumn?.status || 'pending';
      
      // Buscar atividades que estão na coluna que será removida
      const activitiesToMove = activities.filter(activity => 
        activity.status === columnToRemove?.status
      );
      
      if (activitiesToMove.length > 0) {
        // Mover todas as atividades para "Pendente"
        try {
          const updatePromises = activitiesToMove.map(activity =>
            updateActivity(activity.id, { status: pendenteStatus })
          );
          
          await Promise.all(updatePromises);
          
          toast({
            title: "Atividades movidas",
            description: `${activitiesToMove.length} atividade(s) foram movidas para "${pendenteColumn?.name || 'Pendente'}"`,
            duration: 3000,
          });
        } catch (error) {
          console.error('Erro ao mover atividades:', error);
          toast({
            title: "Erro ao mover atividades",
            description: "Algumas atividades podem não ter sido movidas corretamente",
            variant: "destructive",
            duration: 3000,
          });
        }
      }
      
      // Remover a coluna
      setKanbanColumns(prev => prev.filter(col => col.id !== columnId));
      
      toast({
        title: "Etapa removida",
        description: `"${columnToRemove?.name}" foi removida do seu Kanban`,
        duration: 3000,
      });
    }
  };

  const handleReorderKanbanColumns = (startIndex: number, endIndex: number) => {
    const result = Array.from(kanbanColumns);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setKanbanColumns(result);
  };

  const handleStartSprint = (sprintId: number) => {
    toast({
      title: "Sprint iniciada",
      description: `Sprint ${sprintId} foi iniciada com sucesso`
    });
  };

  const handleFinishSprint = (sprintId: number) => {
    toast({
      title: "Sprint finalizada",
      description: `Sprint ${sprintId} foi finalizada com sucesso`
    });
  };

  const handleCreateActivity = async (formData: any) => {
    try {
      // Converter arrays vazios para null ou pegar o primeiro elemento se tiver
      const getFirstOrNull = (value: any) => {
        if (!value) return null;
        if (Array.isArray(value)) {
          return value.length > 0 ? value[0] : null;
        }
        return value === '' ? null : value;
      };

      const normalizeId = (val: any) => {
        if (!val) return null;
        if (typeof val === 'object') {
          if ('value' in val) return String(val.value);
          if ('id' in val) return String(val.id);
        }
        return String(val);
      };
      const normalizeIds = (value: any) => {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(Boolean).map((v) => normalizeId(v)).filter(Boolean);
        return [normalizeId(value)].filter(Boolean);
      };

      // Processar due_date combinando data+hora informadas
      let dueDateIso: string | undefined = undefined;
      if (formData.date) {
        try {
          const [y, m, d] = String(formData.date).split('-').map((v: string) => Number(v));
          let hh = 23, mm = 59;
          if (formData.time && typeof formData.time === 'string' && formData.time.includes(':')) {
            const [th, tm] = formData.time.split(':').map((v: string) => Number(v));
            if (!Number.isNaN(th)) hh = th;
            if (!Number.isNaN(tm)) mm = tm;
          }
          const dt = new Date(y, (m || 1) - 1, d || 1, hh, mm, 0, 0);
          dueDateIso = dt.toISOString();
        } catch {
          dueDateIso = undefined;
        }
      }

      const selectedCompanyIds = normalizeIds(formData.companyId);
      let selectedCompanyNames = selectedCompanyIds.map((id: string) => {
        const c = companies.find(cmp => cmp && (cmp.id === id || (cmp as any).id_empresa === id));
        return c?.fantasyName || (c as any)?.fantasy_name || (c as any)?.company_name || (c as any)?.name || '';
      });
      if (selectedCompanyIds.length > 0 && selectedCompanyNames.some(n => !n)) {
        try {
          const [byId, byIdEmpresa] = await Promise.all([
            supabase
              .from('companies')
              .select('id, id_empresa, fantasy_name, company_name, name')
              .in('id', selectedCompanyIds),
            supabase
              .from('companies')
              .select('id, id_empresa, fantasy_name, company_name, name')
              .in('id_empresa', selectedCompanyIds)
          ]);
          const map = new Map<string, string>();
          ([...(byId?.data || []), ...(byIdEmpresa?.data || [])] || []).forEach((c: any) => {
            const idKey = String(c.id);
            const nm = c.fantasy_name || c.company_name || c.name || '';
            if (nm) map.set(idKey, nm);
            if (c.id_empresa) map.set(String(c.id_empresa), nm);
          });
          selectedCompanyNames = selectedCompanyIds.map((id: string) => map.get(String(id)) || selectedCompanyNames[selectedCompanyIds.indexOf(id)] || id);
        } catch {}
      }

      const activityData = {
        title: formData.title,
        description: formData.description,
        type: formData.type as 'task' | 'meeting' | 'call' | 'email' | 'other',
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: formData.status || 'todo',
        due_date: dueDateIso,
        responsible_id: getFirstOrNull(normalizeIds(formData.responsibleId)),
        responsible_ids: normalizeIds(formData.responsibleId),
        project_id: getFirstOrNull(normalizeIds(formData.projectId)),
        project_ids: normalizeIds(formData.projectId),
        company_ids: selectedCompanyIds,
        comments: selectedCompanyNames.filter(Boolean).length > 0 ? { company_names: selectedCompanyNames } : undefined,
        work_group: getFirstOrNull(formData.workGroup),
        department: getFirstOrNull(formData.department),
        // id_empresa não deve usar o ID da empresa selecionada; será definido pelo hook conforme o perfil do usuário
      };

      console.log('🔄 [CREATE] Criando atividade:', activityData);

      const result = await createActivity(activityData);
      
      if (result && !result.error) {
        console.log('✅ [CREATE] Atividade criada com sucesso:', result.data);
        
        toast({
          title: "Atividade criada",
          description: "Nova atividade foi criada com sucesso"
        });
        
        setIsCreateModalOpen(false);
        
        // Não precisa recarregar - o estado local já foi atualizado automaticamente
        console.log('✅ [CREATE] Atividade adicionada ao estado local');
        
      } else if (result && result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ [CREATE] Erro ao criar atividade:', error);
      toast({
        title: "Erro ao criar atividade",
        description: error instanceof Error ? error.message : "Erro inesperado ao criar atividade",
        variant: "destructive"
      });
    }
  };

  // Função para importação em massa de atividades via Excel
  const handleImportActivities = async (data: any[]) => {
    try {
      console.log('📊 [IMPORT] Iniciando importação de', data.length, 'atividades');
      console.log('🔍 [IMPORT] Usuário atual:', user?.id, 'Email:', user?.email);

      // Filtrar apenas linhas com dados válidos
      const validData = data.filter(row => {
        return row.title && row.title.trim() !== '' && row.title.trim() !== 'Exemplo';
      });

      console.log(`📊 [IMPORT] Dados válidos: ${validData.length} de ${data.length} total`);

      if (validData.length === 0) {
        throw new Error('Nenhum dado válido encontrado para importar');
      }

      // Processar dados importados
      const activitiesData = await Promise.all(validData.map(async (row) => {
        // Buscar responsável pelo nome, se fornecido
        let responsible_id = undefined;
        if (row.responsible_name) {
          const employee = employees.find(e => 
            e.name?.toLowerCase().includes(row.responsible_name.toLowerCase())
          );
          if (employee) {
            responsible_id = employee.id;
          }
        }

        // Buscar empresa pelo nome, se fornecido
        let id_empresa = undefined;
        if (row.company_name) {
          const company = companies.find(c => 
            c.fantasyName?.toLowerCase().includes(row.company_name.toLowerCase()) ||
            c.legalName?.toLowerCase().includes(row.company_name.toLowerCase())
          );
          if (company) {
            id_empresa = company.id;
          }
        }

        // Processar tipo
        let processedType = 'task';
        if (row.type && row.type !== 'Exemplo') {
          const typeMap: { [key: string]: string } = {
            'tarefa': 'task',
            'reunião': 'meeting', 
            'chamada': 'call',
            'email': 'email',
            'outro': 'other'
          };
          processedType = typeMap[row.type.toLowerCase()] || 'task';
        }

        // Processar prioridade
        let processedPriority = 'medium';
        if (row.priority && row.priority !== 'Exemplo') {
          const priorityMap: { [key: string]: string } = {
            'baixa': 'low',
            'média': 'medium', 
            'alta': 'high',
            'urgente': 'urgent'
          };
          processedPriority = priorityMap[row.priority.toLowerCase()] || 'medium';
        }

        // Processar status - sempre usar 'pending' para atividades sem status definido
        let processedStatus = 'pending'; // Status padrão que corresponde a "PENDENTE" no Kanban
        if (row.status && row.status !== 'Exemplo' && row.status.trim() !== '') {
          const statusMap: { [key: string]: string } = {
            'pendente': 'pending',
            'em progresso': 'in_progress',
            'concluída': 'completed',
            'cancelada': 'cancelled'
          };
          processedStatus = statusMap[row.status.toLowerCase()] || 'pending';
        }
        // Se não tem status ou é "Exemplo", usar 'pending' (PENDENTE)

        const activityData = {
          title: row.title,
          description: row.description || '',
          type: processedType as 'task' | 'meeting' | 'call' | 'email' | 'other',
          priority: processedPriority as 'low' | 'medium' | 'high' | 'urgent',
          status: processedStatus,
          due_date: row.due_date || null,
          responsible_id: responsible_id || null,
          id_empresa: id_empresa || null,
          notes: row.notes || '',
          estimated_hours: row.estimated_hours || null,
          created_by: user?.id || '905b926a-785a-4f6d-9c3a-9455729500b3', // ID do usuário atual ou fallback
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('🔍 [IMPORT] Dados da atividade individual:', activityData);
        console.log('🔍 [IMPORT] Status final:', activityData.status, 'Tipo:', activityData.type, 'Prioridade:', activityData.priority);
        console.log('🔍 [IMPORT] Created By:', activityData.created_by, 'User ID:', user?.id);
        return activityData;
      }));

      console.log('📤 [IMPORT] Dados preparados para inserção:', activitiesData);

      // Inserir todas as atividades no Supabase
      console.log('🔍 [IMPORT] Inserindo dados no Supabase:', activitiesData);
      
      const { data: insertedActivities, error } = await supabase
        .from('activities')
        .insert(activitiesData)
        .select();

      if (error) {
        console.error('❌ [IMPORT] Erro no Supabase:', error);
        console.error('❌ [IMPORT] Dados que causaram erro:', activitiesData);
        throw error;
      }

      console.log('✅ [IMPORT] Atividades importadas com sucesso:', insertedActivities);

      // Recarregar atividades para atualizar todas as visualizações
      console.log('🔄 [IMPORT] Recarregando atividades...');
      
      // Aguardar um pouco para garantir que o Supabase processou a inserção
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: refreshedActivities, error: refreshError } = await fetchActivities();
      
      // Forçar atualização do estado local se necessário
      if (refreshedActivities && refreshedActivities.length > activities.length) {
        console.log('🔄 [IMPORT] Forçando atualização do estado local...');
        // O fetchActivities já deve atualizar o estado, mas vamos garantir
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (refreshError) {
        console.error('❌ [IMPORT] Erro ao recarregar atividades:', refreshError);
      } else {
        console.log('✅ [IMPORT] Atividades recarregadas:', refreshedActivities?.length || 0, 'atividades');
        console.log('🔍 [IMPORT] Atividades encontradas:', refreshedActivities);
        console.log('🔍 [IMPORT] Atividades no estado local:', activities.length, 'atividades');
        console.log('🔍 [IMPORT] Atividades no estado local:', activities.map(a => ({ title: a.title, status: a.status, created_by: a.created_by })));
        
        // Verificar se a atividade importada está na lista
        const importedActivity = refreshedActivities?.find(a => a.title === 'Página Agente');
        if (importedActivity) {
          console.log('✅ [IMPORT] Atividade "Página Agente" encontrada:', importedActivity);
          console.log('🔍 [IMPORT] Status da atividade:', importedActivity.status);
          console.log('🔍 [IMPORT] Owner ID da atividade:', importedActivity.owner_id);
          console.log('🔍 [IMPORT] Created By da atividade:', importedActivity.created_by);
        } else {
          console.log('❌ [IMPORT] Atividade "Página Agente" NÃO encontrada na lista recarregada');
          console.log('🔍 [IMPORT] Atividades disponíveis:', refreshedActivities?.map(a => ({ title: a.title, status: a.status, created_by: a.created_by })));
        }
      }

      toast({
        title: "Importação concluída",
        description: `${insertedActivities?.length || 0} atividades foram importadas com sucesso`
      });

    } catch (error) {
      console.error('❌ [IMPORT] Erro ao importar atividades:', error);
      throw error;
    }
  };

  const handleEditActivity = (activity: any) => {
    setEditingActivity(activity);
    setIsEditModalOpen(true);
  };

  const handleUpdateActivity = async (formData: any) => {
    try {
      if (!editingActivity) return;

      console.log('🔄 [UPDATE] Dados recebidos do formulário:', formData);
      console.log('🔄 [UPDATE] Atividade sendo editada:', editingActivity);

      // Mapear status do formulário para status do banco de dados
      const statusMapping: { [key: string]: string } = {
        'todo': 'todo',
        'doing': 'doing', 
        'done': 'done',
        'pending': 'pending',
        'in_progress': 'in_progress',
        'completed': 'completed',
        'open': 'open',
        'review': 'review',
        'cancelled': 'cancelled'
      };

      const mappedStatus = statusMapping[formData.status] || formData.status;

      // Preparar dados de atualização com validação rigorosa
      const updateData: any = {
        title: formData.title?.trim() || editingActivity.title,
        description: formData.description?.trim() || null,
        type: formData.type || editingActivity.type,
        priority: formData.priority || editingActivity.priority,
        status: mappedStatus || editingActivity.status,
        updated_at: new Date().toISOString()
      };

        // NÃO incluir owner_id na atualização - isso pode causar erro
        // O owner_id não deve ser alterado após a criação

      // Adicionar due_date apenas se fornecida (combinar data+hora)
      if (formData.date) {
        try {
          const [y, m, d] = String(formData.date).split('-').map((v: string) => Number(v));
          let hh = 23, mm = 59;
          if (formData.time && typeof formData.time === 'string' && formData.time.includes(':')) {
            const [th, tm] = formData.time.split(':').map((v: string) => Number(v));
            if (!Number.isNaN(th)) hh = th;
            if (!Number.isNaN(tm)) mm = tm;
          }
          const dt = new Date(y, (m || 1) - 1, d || 1, hh, mm, 0, 0);
          updateData.due_date = dt.toISOString();
        } catch (error) {
          console.warn('⚠️ [UPDATE] Data inválida fornecida:', formData.date);
          updateData.due_date = editingActivity.due_date;
        }
      }

      // Função auxiliar para processar valores que podem ser arrays ou strings
      const processValue = (value: any, currentValue: any) => {
        if (!value) return currentValue; // Se não foi fornecido, manter valor atual
        
        // Se for array
        if (Array.isArray(value)) {
          return value.length > 0 ? value[0] : null;
        }
        
        // Se for string
        if (typeof value === 'string') {
          return value.trim() !== '' ? value.trim() : null;
        }
        
        return value || null;
      };
      const normalizeId = (val: any) => {
        if (!val) return null;
        if (typeof val === 'object') {
          if ('value' in val) return String(val.value);
          if ('id' in val) return String(val.id);
        }
        return String(val);
      };
      const normalizeIds = (value: any) => {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(Boolean).map((v) => normalizeId(v)).filter(Boolean);
        return [normalizeId(value)].filter(Boolean);
      };

      // Adicionar campos opcionais processados
      updateData.responsible_id = processValue(normalizeIds(formData.responsibleId), editingActivity.responsible_id);
      updateData.responsible_ids = normalizeIds(formData.responsibleId) || (Array.isArray(editingActivity?.responsible_ids) ? editingActivity.responsible_ids : undefined);
      (updateData as any).company_ids = normalizeIds(formData.companyId) || (Array.isArray((editingActivity as any)?.comments?.company_ids) ? (editingActivity as any).comments.company_ids : undefined);
      {
        const ids = normalizeIds(formData.companyId);
        let names: string[] = [];
        if (ids.length === 0 && Array.isArray((editingActivity as any)?.comments?.company_ids)) {
          const prevIds = (editingActivity as any).comments.company_ids;
          names = prevIds.map((id: string) => {
            const c = companies.find(cmp => cmp && (cmp.id === id || (cmp as any).id_empresa === id));
            return c?.fantasyName || (c as any)?.fantasy_name || (c as any)?.company_name || (c as any)?.name || '';
          });
        } else {
          names = ids.map((id: string) => {
            const c = companies.find(cmp => cmp && (cmp.id === id || (cmp as any).id_empresa === id));
            return c?.fantasyName || (c as any)?.fantasy_name || (c as any)?.company_name || (c as any)?.name || '';
          });
        }
        if (names.some(n => !n) && (ids.length > 0 || Array.isArray((editingActivity as any)?.comments?.company_ids))) {
          try {
            const queryIds = ids.length > 0 ? ids : (editingActivity as any).comments.company_ids;
            const [byId, byIdEmpresa] = await Promise.all([
              supabase
                .from('companies')
                .select('id, id_empresa, fantasy_name, company_name, name')
                .in('id', queryIds),
              supabase
                .from('companies')
                .select('id, id_empresa, fantasy_name, company_name, name')
                .in('id_empresa', queryIds)
            ]);
            const map = new Map<string, string>();
            ([...(byId?.data || []), ...(byIdEmpresa?.data || [])] || []).forEach((c: any) => {
              const idKey = String(c.id);
              const nm = c.fantasy_name || c.company_name || c.name || '';
              if (nm) map.set(idKey, nm);
              if (c.id_empresa) map.set(String(c.id_empresa), nm);
            });
            names = queryIds.map((id: string) => map.get(String(id)) || names[queryIds.indexOf(id)] || id);
          } catch {}
        }
        (updateData as any).company_names = names.length > 0 ? names : undefined;
      }
      updateData.project_id = processValue(normalizeIds(formData.projectId), editingActivity.project_id);
      (updateData as any).project_ids = normalizeIds(formData.projectId) || (Array.isArray((editingActivity as any)?.project_ids) ? (editingActivity as any).project_ids : undefined);
      updateData.work_group = processValue(formData.workGroup, editingActivity.work_group);
      updateData.department = processValue(formData.department, editingActivity.department);

      console.log('🔄 [UPDATE] Dados de atualização preparados:', { 
        id: editingActivity.id, 
        updateData,
        originalStatus: formData.status,
        mappedStatus 
      });

      const result = await updateActivity(editingActivity.id, updateData);
      
      if (result && !result.error) {
        console.log('✅ [UPDATE] Atividade atualizada com sucesso:', result.data);
        
        toast({
          title: "Tarefa atualizada",
          description: "Tarefa foi atualizada com sucesso"
        });
        setIsEditModalOpen(false);
        setEditingActivity(null);
        
        // Recarregar atividades para garantir que todas as visualizações sejam atualizadas
        console.log('🔄 [UPDATE] Recarregando atividades para sincronizar todas as abas...');
        await refetch();
      } else if (result && result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ [UPDATE] Erro ao atualizar atividade:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      const result = await deleteActivity(activityId);
      
      if (result && !result.error) {
        toast({
          title: "Tarefa excluída",
          description: "Tarefa foi excluída com sucesso"
        });
        // Estado local já é atualizado pelo hook; evitar refetch para não reintroduzir itens
      } else if (result && result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir tarefa",
        variant: "destructive"
      });
    }
  };


  // Função para lidar com drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se não há destino, não faz nada
    if (!destination) return;

    // Se o item foi solto na mesma posição, não faz nada
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    try {
      // Atualizar o status da atividade
      const newStatus = destination.droppableId;
      const result = await updateActivity(draggableId, { status: newStatus });
      
      if (result) {
        toast({
          title: "Status atualizado",
          description: "Tarefa movida com sucesso"
        });
        // Não precisa recarregar - o estado local já foi atualizado automaticamente
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao mover tarefa",
        variant: "destructive"
      });
    }
  };

  // Funções de scroll removidas - layout agora se ajusta sem scroll horizontal

  const handleCreateQuickTask = async (title: string, status: string) => {
    try {
      const activityData = {
        title,
        description: '',
        type: 'task' as const,
        priority: 'medium' as const,
        status: status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        responsible_id: undefined
      };

      const result = await createActivity(activityData);
      
      if (result) {
        toast({
          title: "Tarefa rápida criada",
          description: "Nova tarefa foi criada com sucesso"
        });
        // Não precisa recarregar - o estado local já foi atualizado automaticamente
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa rápida",
        variant: "destructive"
      });
    }
  };

  const handleOpenCreateModal = (columnId?: string) => {
    setIsCreateModalOpen(true);
    // Aqui poderia definir o status inicial baseado na coluna
    // Por enquanto, apenas abre o modal
  };

  const handleOpenCreateModalClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const columnId = event.currentTarget.dataset.columnId;
    handleOpenCreateModal(columnId);
  };

  const handleViewModeChange = (mode: 'board' | 'lista' | 'prazo' | 'calendario' | 'dashboard') => {
    setViewMode(mode);
  };
  React.useEffect(() => {
    if (viewMode === 'dashboard') {
      try { refetch(); } catch {}
    }
  }, [viewMode]);

  // Função para renderizar os botões de ação de cada atividade
  const renderActivityActions = (activity: any) => (
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEditActivity(activity);
        }}
        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
        title="Editar tarefa"
      >
        <Edit className="h-3 w-3" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteActivity(activity.id);
        }}
        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
        title="Excluir tarefa"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );

  // Botões de visualização exatos da imagem
  const viewButtons = useMemo(() => [
    { 
      id: 'board', 
      label: t('pages.activities.viewModes.board'),
      icon: Kanban,
      active: viewMode === 'board'
    },
    {
      id: 'lista', 
      label: t('pages.activities.viewModes.list'),
      icon: List,
      active: viewMode === 'lista'
    },
    {
      id: 'prazo', 
      label: t('pages.activities.viewModes.deadline'),
      icon: Clock,
      active: viewMode === 'prazo'
    },
    {
      id: 'calendario', 
      label: t('pages.activities.viewModes.calendar'),
      icon: Calendar,
      active: viewMode === 'calendario'
    },
    {
      id: 'dashboard', 
      label: t('pages.activities.viewModes.dashboard'),
      icon: BarChart3,
      active: viewMode === 'dashboard'
    }
  ], [viewMode, t]);

  // Tratamento de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar atividades</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Loading state - mostrar apenas se não houver dados
  // Se houver dados (cache), mostra os dados enquanto atualiza em background
  if (loading && activities.length === 0 && !forceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando suas tarefas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className={`min-h-screen ${viewMode === 'calendario' ? 'bg-transparent' : 'bg-gray-50 dark:bg-black'}`}>
        {/* Header fixo responsivo ao sidebar - Esconde em fullscreen */}
        {!isFullscreen && (
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
              {/* Botão de Tela Cheia - apenas para visualizações Kanban */}
              {(viewMode === 'board' || viewMode === 'prazo') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={toggleFullscreen}
                  title="Tela cheia"
                >
                  <Maximize2 className="h-4 w-4 text-gray-700" />
                </Button>
              )}
              
              {/* Botão de configuração do Kanban - apenas para abas com Kanban */}
              {(viewMode === 'board' || viewMode === 'prazo') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={() => setIsKanbanConfigModalOpen(true)}
                  title="Configurar Kanban"
                >
                  <Settings className="h-4 w-4 text-gray-700" />
                </Button>
              )}
              
            </div>
          </div>
        </div>

          {/* Barra de filtros funcionais - sempre exibir */}
            <FilterBar
              filters={{...filters, dateFrom: dateFilter}}
              onFilterChange={async (key, value) => {
                if (key === 'dateFrom') {
                  setDateFilter(value);
                } else if (key === 'responsibleId') {
                  updateFilter(key as any, value);
                } else if (key === 'companyId') {
                  updateFilter(key as any, value);
                } else if (key === 'search') {
                  // Apenas atualizar o estado do filtro, sem aplicar ainda
                  // O filtro será aplicado quando o usuário pressionar Enter ou clicar em "Aplicar Filtros"
                  updateFilter(key as any, value);
                } else {
                  // Para outros filtros, apenas atualizar o estado
                  updateFilter(key as any, value);
                }
              }}
              onApplyFilters={handleFilterApply}
              onClearFilters={async () => {
                clearFilters();
                setDateFilter('');
                // Recarregar atividades sem filtros
                const filterParams = getFilterParams();
                await fetchActivities(filterParams);
              }}
              employees={employees}
              departments={workGroupNames}
              searchPlaceholder="Filtrar por nome da tarefa..."
              showWorkGroupFilter={true}
              showResponsibleFilter={true}
              companies={[
                ...(((companiesHook && companiesHook.length > 0) ? companiesHook : (companies || [])) as any[])
                  .map((c: any) => ({
                    id: String(c?.id),
                    name: c?.fantasy_name || c?.company_name || c?.fantasyName || c?.companyName || 'Empresa'
                  })),
                ...(((cachedCompanies && cachedCompanies.length > 0) ? cachedCompanies : []) as any[])
                  .map((c: any) => ({
                    id: String(c?.id),
                    name: c?.fantasy_name || c?.company_name || c?.legal_name || c?.name || 'Empresa'
                  })),
                ...(organization ? [{
                  id: String(organization.id_empresa),
                  name: organization.fantasy_name || organization.company_name || organization.legal_name || organization.name || 'Empresa'
                }] : [])
              ]}
              showCompanyFilter={true}
              showArchivedFilter={false}
            />
        </div>
        )}

      {/* Container principal com padding para o header fixo */}
      <div 
        className={`overflow-x-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-50 dark:bg-black' : `${viewMode === 'dashboard' ? 'px-0' : 'px-1'} ${viewMode === 'dashboard' ? 'pt-[125px]' : 'pt-[140px]'}`}`}
      >

        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'board' && (
          <div className={`w-full overflow-x-hidden ${isFullscreen ? 'h-full flex flex-col p-4' : ''}`}>
            
            {/* KanbanBoard - Drag and Drop com @hello-pangea/dnd */}
            <KanbanBoard
              activities={activities}
              onMoveActivity={handleMoveActivity}
              onReindexColumn={async () => ({ data: null, error: null })}
              onAddActivity={handleOpenCreateModal}
              onEditActivity={handleEditActivity}
              onDeleteActivity={handleDeleteActivity}
              onActivityClick={(activityId: string) => {
                const activity = activities.find(a => a.id === activityId);
                if (activity) {
                  setViewingActivity(activity);
                  setIsViewModalOpen(true);
                }
              }}
              className={isFullscreen ? 'flex-1' : 'px-4'}
              columns={kanbanColumns.map(col => ({
                id: col.id,
                title: col.name,
                status: col.status,
                color: col.color === 'gray' ? '#6B7280' :
                       col.color === 'blue' ? '#3B82F6' :
                       col.color === 'green' ? '#22C55E' :
                       col.color === 'orange' ? '#F97316' :
                       col.color === 'red' ? '#EF4444' :
                       col.color === 'purple' ? '#8B5CF6' : '#6B7280'
              }))}
              employees={employees}
            />
          </div>
        )}

        {/* Visualização em Lista */}
        {viewMode === 'lista' && (
          <div className="w-full">
            {/* Tabela de Atividades */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {/* Cabeçalho da Tabela */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex items-center px-3 py-3 gap-2">
                  <div className="flex-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span>Atividade</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Tipo</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Prazo</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-28 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Responsável</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Projeto</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Prioridade</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-20 flex items-center justify-end gap-2 text-sm font-medium text-gray-700">
                    <span>Ações</span>
                  </div>
                </div>
              </div>

              {/* Linhas da Tabela */}
              <VirtualList
                items={activities}
                itemHeight={56}
                overscan={10}
                className="divide-y divide-gray-200 h-[600px]"
                renderItem={(activity) => (
                  <div className="flex items-center px-3 py-3 h-14 hover:bg-gray-50 transition-colors gap-2">
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-gray-900 truncate font-medium">{activity.title}</span>
                        <span className="text-xs text-gray-400">
                          {activity.description || 'Sem descrição'}
                        </span>
                      </div>
                    </div>
                    <div className="w-24 flex items-center justify-center">
                      <span className="text-xs text-gray-600">
                        {activity.type === 'task' ? 'Tarefa' :
                         activity.type === 'meeting' ? 'Reunião' :
                         activity.type === 'call' ? 'Chamada' :
                         activity.type === 'email' ? 'Email' : 'Outro'}
                      </span>
                    </div>
                    <div className="w-24 flex items-center justify-center gap-2 text-sm text-gray-600">
                      <span className="text-xs">
                        {activity.due_date ? new Date(activity.due_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit'
                        }) : 'Sem prazo'}
                      </span>
                    </div>
                    <div className="w-28 flex items-center justify-center gap-2 text-sm text-gray-600">
                      <span className="truncate max-w-20">
                        {(() => {
                          const list = Array.isArray(activity.responsible_ids) ? activity.responsible_ids : (activity.responsible_id ? [activity.responsible_id] : []);
                          if (list.length === 0) return 'Não atribuído';
                          const firstId = list[0];
                          const emp = employees.find(e => e.id === firstId) || employees.find(e => e.id_usuario === firstId);
                          const name = emp?.name || emp?.nome || firstId;
                          return `${name}${list.length > 1 ? ' +' + (list.length - 1) : ''}`;
                        })()}
                      </span>
                    </div>
                    <div className="w-24 flex items-center justify-center gap-2 text-sm text-gray-600">
                      <span className="truncate max-w-20">
                        {activity.project_id || 'Sem projeto'}
                      </span>
                    </div>
                    <div className="w-24 flex items-center justify-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-1 py-0.5 border font-medium ${
                          activity.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                          activity.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                          activity.priority === 'medium' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-green-100 text-green-800 border-green-200'
                        }`}
                      >
                        {activity.priority === 'urgent' ? 'Urgente' :
                         activity.priority === 'high' ? 'Alta' :
                         activity.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                    <div className="w-20 flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setViewingActivity(activity);
                          setIsViewModalOpen(true);
                        }}
                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-md transition-all duration-200 h-6 w-6"
                        title="Visualizar atividade"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="hidden"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-all duration-200 h-6 w-6"
                        title="Excluir atividade"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Espaço branco inferior */}
            <div className="h-32 bg-[#F9FAFB]"></div>
          </div>
        )}

        {viewMode === 'prazo' && (
          <div className={`w-full ${isFullscreen ? 'h-full flex flex-col p-4' : '-ml-2'}`}>
            {/* Cartões de Resumo das Atividades - Esconde em fullscreen */}
            {!isFullscreen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Cartão Vencidas */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dueDate = new Date(a.due_date);
                      dueDate.setHours(0, 0, 0, 0);
                      return dueDate < today;
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Vencidas</h3>
                  <p className="text-xs text-gray-600">Tarefas com prazo vencido</p>
                </div>
              </div>

              {/* Cartão Para Hoje */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const today = new Date();
                      const dueDate = new Date(a.due_date);
                      return dueDate.toDateString() === today.toDateString();
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Para Hoje</h3>
                  <p className="text-xs text-gray-600">Tarefas para hoje</p>
                </div>
              </div>

              {/* Cartão Para Amanhã */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const dueDate = new Date(a.due_date);
                      return dueDate.toDateString() === tomorrow.toDateString();
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Para Amanhã</h3>
                  <p className="text-xs text-gray-600">Tarefas para amanhã</p>
                </div>
              </div>

              {/* Cartão Esta Semana */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const tomorrow = new Date(today);
                      tomorrow.setDate(today.getDate() + 1);
                      const endOfWeek = new Date(today);
                      endOfWeek.setDate(today.getDate() + 7);
                      const dueDate = new Date(a.due_date);
                      dueDate.setHours(0, 0, 0, 0);
                      return dueDate >= tomorrow && dueDate <= endOfWeek;
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Esta Semana</h3>
                  <p className="text-xs text-gray-600">Tarefas desta semana</p>
                </div>
              </div>

              {/* Cartão Mais Tarde */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const endOfWeek = new Date(today);
                      endOfWeek.setDate(today.getDate() + 7);
                      const dueDate = new Date(a.due_date);
                      dueDate.setHours(0, 0, 0, 0);
                      return dueDate > endOfWeek;
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Mais Tarde</h3>
                  <p className="text-xs text-gray-600">Tarefas futuras</p>
                </div>
              </div>
            </div>
            )}

            {/* Visualização Principal por Prazo */}
            <div className={isFullscreen ? 'flex-1 flex flex-col overflow-x-hidden' : 'p-3 overflow-x-hidden'}>
              {/* Cabeçalho da Visualização - Esconde em fullscreen */}
              {!isFullscreen && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-pink-500" />
                  <h3 className="text-base font-semibold text-gray-900/85">
                    Visualização por Prazo
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={prazoViewMode === 'lista' ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-xs font-medium"
                    onClick={() => setPrazoViewMode('lista')}
                    style={prazoViewMode === 'lista' ? {
                      backgroundColor: topBarColor,
                      borderColor: topBarColor,
                      color: 'white'
                    } : {}}
                  >
                    Lista
                  </Button>
                  <Button
                    variant={prazoViewMode === 'kanban' ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-xs font-medium"
                    onClick={() => setPrazoViewMode('kanban')}
                    style={prazoViewMode === 'kanban' ? {
                      backgroundColor: topBarColor,
                      borderColor: topBarColor,
                      color: 'white'
                    } : {}}
                  >
                    Kanban
                  </Button>

                </div>
              </div>
              )}

              {/* Conteúdo baseado no modo de visualização selecionado */}
              {prazoViewMode === 'kanban' ? (
                /* KanbanBoard configurável para Prazo */
                <KanbanBoard
                  activities={activities.filter(activity => activity.due_date)} // Filtrar apenas atividades com prazo
                  onMoveActivity={handleMoveActivity}
                  onReindexColumn={async () => ({ data: null, error: null })}
                  onAddActivity={handleOpenCreateModal}
                  onEditActivity={handleEditActivity}
                  onDeleteActivity={handleDeleteActivity}
                  onActivityClick={async (activityId: string) => {
                    const localActivity = activities.find(a => a.id === activityId);
                    let fullActivity = localActivity;
                    try {
                      const { data } = await supabase
                        .from('activities')
                        .select('*')
                        .eq('id', activityId)
                        .maybeSingle();
                      if (data) {
                        fullActivity = { ...localActivity, ...data };
                      }
                    } catch {}
                    if (fullActivity) {
                      setViewingActivity(fullActivity);
                      setIsViewModalOpen(true);
                    }
                  }}
                  className={isFullscreen ? 'flex-1' : 'px-3'}
                  columns={kanbanColumns.map(col => ({
                    id: col.id,
                    title: col.name,
                    status: col.status,
                    color: col.color === 'gray' ? '#6B7280' :
                           col.color === 'blue' ? '#3B82F6' :
                           col.color === 'green' ? '#22C55E' :
                           col.color === 'orange' ? '#F97316' :
                           col.color === 'red' ? '#EF4444' :
                           col.color === 'purple' ? '#8B5CF6' : '#6B7280'
                  }))}
                  employees={employees}
                />
              ) : (
                /* Lista por Prazo - Visualização em lista com espaçamento correto */
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Cabeçalho da Lista */}
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <div className="col-span-4">Tarefa</div>
                      <div className="col-span-2">Prioridade</div>
                      <div className="col-span-2">Prazo</div>
                      <div className="col-span-2">Responsável</div>
                      <div className="col-span-2">Ações</div>
                    </div>
                  </div>

                  {/* Lista de Atividades */}
                  <div className="divide-y divide-gray-200">
                    {activities
                      .filter(activity => activity.due_date) // Filtra apenas atividades com prazo
                      .sort((a, b) => {
                        // Ordena por prazo: vencidas primeiro, depois por data
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        const aDue = new Date(a.due_date);
                        const bDue = new Date(b.due_date);
                        
                        const aIsOverdue = aDue < today;
                        const bIsOverdue = bDue < today;
                        
                        if (aIsOverdue && !bIsOverdue) return -1;
                        if (!aIsOverdue && bIsOverdue) return 1;
                        
                        return aDue.getTime() - bDue.getTime();
                      })
                      .map(activity => {
                        const dueDate = new Date(activity.due_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isOverdue = dueDate < today;
                        
                        return (
                          <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                            <div className="grid grid-cols-12 gap-4 items-center">
                              {/* Tarefa */}
                              <div className="col-span-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                      {activity.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 truncate mt-1">
                                      {activity.description || 'Sem descrição'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Prioridade */}
                              <div className="col-span-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  activity.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  activity.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  activity.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {activity.priority === 'urgent' ? 'Urgente' :
                                   activity.priority === 'high' ? 'Alta' :
                                   activity.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                              </div>

                              {/* Prazo */}
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                    {dueDate.toLocaleDateString('pt-BR')}
                                  </span>
                                  {isOverdue && (
                                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                      Vencida
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Responsável */}
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-900">
                                    {(() => {
                                      const list = Array.isArray(activity.responsible_ids) ? activity.responsible_ids : (activity.responsible_id ? [activity.responsible_id] : []);
                                      if (list.length === 0) return 'Não atribuído';
                                      const firstId = list[0];
                                      const emp = employees.find(e => e.id === firstId) || employees.find(e => e.id_usuario === firstId);
                                      const name = emp?.name || emp?.nome || firstId;
                                      return `${name}${list.length > 1 ? ' +' + (list.length - 1) : ''}`;
                                    })()}
                                  </span>
                                </div>
                              </div>

                              {/* Ações */}
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-gray-200"
                                    onClick={() => handleEditActivity(activity)}
                                  >
                                    <Edit className="h-4 w-4 text-gray-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-gray-200"
                                    onClick={() => {
                                      const foundActivity = activities.find(a => a.id === activity.id);
                                      if (foundActivity) {
                                        setViewingActivity(foundActivity);
                                        setIsViewModalOpen(true);
                                      }
                                    }}
                                  >
                                    <Eye className="h-4 w-4 text-gray-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    
                    {activities.filter(activity => activity.due_date).length === 0 && (
                      <div className="px-6 py-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade encontrada</h3>
                        <p className="text-gray-600">Não há atividades com prazo definido no momento.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'calendario' && (
          <ActivitiesCalendarView
            activities={activities}
            onActivityClick={(activity) => {
              setViewingActivity(activity);
              setIsViewModalOpen(true);
            }}
            onCreateActivity={() => setIsCreateModalOpen(true)}
            className="-mt-[140px] pt-[140px]"
          />
        )}

        {viewMode === 'dashboard' && (
          <div className="dashboard-page min-h-screen ml-0 mr-0 w-[99%] max-w-none pl-0 pr-2 lg:pr-4" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
            <React.Suspense fallback={<div style={{ padding: 12 }}>Carregando dashboard...</div>}>
              <DashboardCharts
                activities={activities}
                filters={{
                  dateRange: filters.dateRange,
                  status: 'all',
                  priority: 'all',
                  responsible: filters.responsibleId || 'all',
                  type: 'all'
                }}
                employees={employees}
                kanbanColumns={kanbanColumns}
              />
            </React.Suspense>
          </div>
        )}
      </div>

      {/* Botão flutuante de nova atividade - esconde em fullscreen e quando modal direito estiver aberto */}
      {!isFullscreen && !isRightDrawerOpen && (
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
      )}

      {/* Botão para sair da tela cheia - aparece apenas quando em fullscreen */}
      {isFullscreen && (viewMode === 'board' || viewMode === 'prazo') && (
        <div className="fixed top-4 right-4 z-[60] flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 hover:bg-gray-200 rounded-full transition-all duration-200 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl"
            onClick={exitFullscreen}
            title="Sair da tela cheia"
          >
            <Minimize2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>
        </div>
      )}

      {/* Modal de edição do Kanban */}
      {isKanbanEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseKanbanEditModal}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Kanban className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Personalizar Planejamento Kanban</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure as etapas do seu fluxo de trabalho
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseKanbanEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Instruções */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-100 rounded">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-900">Como personalizar</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Edite os nomes das etapas, escolha cores e reorganize a ordem. Você pode adicionar novas etapas ou remover as existentes.
                      </p>
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        💾 Suas configurações são salvas automaticamente e persistem entre sessões
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lista de Colunas */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-gray-900">Etapas do Fluxo</h3>
                    <Button
                      onClick={handleAddKanbanColumn}
                      size="sm"
                      className="flex items-center gap-2 text-white hover:opacity-90 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Etapa
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {kanbanColumns.map((column, index) => (
                      <div key={column.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          {/* Drag Handle */}
                          <div className="p-1 text-gray-400 cursor-move">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>

                          {/* Color Picker */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Cor:</span>
                            <div className="flex gap-1">
                              {['gray', 'blue', 'green', 'orange', 'red', 'purple'].map((color) => (
                                <button
                                  key={color}
                                  onClick={() => handleUpdateKanbanColumn(column.id, { color })}
                                  className={`w-6 h-6 rounded-full border-2 ${
                                    column.color === color ? 'border-gray-400' : 'border-gray-200'
                                  } ${
                                    color === 'gray' ? 'bg-gray-500' :
                                    color === 'blue' ? 'bg-blue-500' :
                                    color === 'green' ? 'bg-green-500' :
                                    color === 'orange' ? 'bg-orange-500' :
                                    color === 'red' ? 'bg-red-500' :
                                    'bg-purple-500'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Nome da Coluna */}
                          <div className="flex-1">
                            <input
                              type="text"
                              value={column.name}
                              onChange={(e) => handleUpdateKanbanColumn(column.id, { name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Nome da etapa"
                            />
                          </div>

                          {/* Status */}
                          <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                            {activities.filter(activity => {
                              if (column.status === 'pending') return activity.status === 'pending' || activity.status === 'open';
                              if (column.status === 'in_progress') return activity.status === 'in_progress';
                              if (column.status === 'completed') return activity.status === 'completed';
                              if (column.status === 'archived') return activity.status === 'archived' || activity.status === 'cancelled';
                              return activity.status === column.status;
                            }).length} atividades
                          </div>

                          {/* Remove Button */}
                          {kanbanColumns.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveKanbanColumn(column.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-gray-900">Preview</h3>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex gap-2">
                      {kanbanColumns.map((column) => {
                        const columnStyle = {
                          gray: 'bg-gray-200 border-gray-300',
                          blue: 'bg-blue-200 border-blue-300',
                          green: 'bg-green-200 border-green-300',
                          orange: 'bg-orange-200 border-orange-300',
                          red: 'bg-red-200 border-red-300',
                          purple: 'bg-purple-200 border-purple-300'
                        }[column.color] || 'bg-gray-200 border-gray-300';

                        return (
                          <div key={column.id} className={`flex-1 p-3 rounded border ${columnStyle}`}>
                            <div className="text-xs font-medium text-gray-700 mb-2">{column.name}</div>
                            <div className="text-xs text-gray-500">0 atividades</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Configurações salvas automaticamente
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleCloseKanbanEditModal}
                    className="text-white hover:opacity-90 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de criação de atividade */}
      <CreateActivityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateActivity}
        employees={employees}
      />

      {/* Modal de edição de atividade */}
      <CreateActivityModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingActivity(null);
        }}
        onSubmit={handleUpdateActivity}
        employees={employees}
        initialData={editingActivity ? {
          id: editingActivity.id,
          title: editingActivity.title,
          description: editingActivity.description || '',
          date: editingActivity.due_date ? new Date(editingActivity.due_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          priority: editingActivity.priority,
          status: editingActivity.status,
          responsibleId: Array.isArray((editingActivity as any)?.responsible_ids)
            ? (editingActivity as any).responsible_ids
            : (editingActivity.responsible_id ? [editingActivity.responsible_id] : []),
          companyId: Array.isArray((editingActivity as any)?.comments?.company_ids)
            ? (editingActivity as any).comments.company_ids
            : (Array.isArray((editingActivity as any)?.companyId)
              ? (editingActivity as any).companyId
              : (editingActivity.id_empresa ? [editingActivity.id_empresa] : [])),
          projectId: Array.isArray((editingActivity as any)?.project_ids)
            ? (editingActivity as any).project_ids
            : (editingActivity.project_id ? [editingActivity.project_id] : []),
          department: Array.isArray(editingActivity.department)
            ? editingActivity.department
            : (editingActivity.department ? [editingActivity.department] : []),
          type: editingActivity.type
        } : undefined}
      />

      {/* Modal de Automações */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAutomationModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Automatize</h2>
                <button
                  onClick={() => setIsAutomationModalOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="px-6 py-6">
              <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Espaço para futuras automações</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração do Kanban */}
      <RightDrawerModal
        open={isKanbanConfigModalOpen}
        onClose={() => setIsKanbanConfigModalOpen(false)}
        title="Configure seu Kanban"
      >
        {/* Disclaimer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
              <svg className="w-2.5 h-2.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-blue-800">
                Edite os nomes das etapas, escolha cores e reorganize a ordem. Você pode adicionar novas etapas ou remover as existentes. Suas configurações são salvas automaticamente.
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Colunas */}
        <ModalSection>
          <div className="space-y-3">
            {/* Título das Etapas */}
            <h3 className="text-sm font-medium text-gray-700 mb-3">Etapas do Fluxo</h3>

            <div className="space-y-3">
              {kanbanColumns.map((column, index) => (
                <div key={column.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="space-y-3">
                    {/* Nome da Coluna */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Nome</label>
                      <input
                        type="text"
                        value={column.name}
                        onChange={(e) => handleUpdateKanbanColumn(column.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nome da etapa"
                      />
                    </div>

                    {/* Color Picker */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Cor</label>
                      <div className="flex gap-2">
                        {['gray', 'blue', 'green', 'orange', 'red', 'purple'].map((color) => (
                          <button
                            key={color}
                            onClick={() => handleUpdateKanbanColumn(column.id, { color })}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              column.color === color ? 'border-gray-900 scale-110' : 'border-gray-200'
                            } ${
                              color === 'gray' ? 'bg-gray-500' :
                              color === 'blue' ? 'bg-blue-500' :
                              color === 'green' ? 'bg-green-500' :
                              color === 'orange' ? 'bg-orange-500' :
                              color === 'red' ? 'bg-red-500' :
                              'bg-purple-500'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Status e Ações */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                        {activities.filter(activity => {
                          if (column.status === 'pending') return activity.status === 'pending' || activity.status === 'open';
                          if (column.status === 'in_progress') return activity.status === 'in_progress';
                          if (column.status === 'completed') return activity.status === 'completed';
                          if (column.status === 'archived') return activity.status === 'archived' || activity.status === 'cancelled';
                          return activity.status === column.status;
                        }).length} atividades
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Botão Adicionar Etapa - apenas no último bloco */}
                        {index === kanbanColumns.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAddKanbanColumn}
                            className="text-white bg-[#021529] hover:bg-[#031a35] w-8 h-8 p-0 rounded-full flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Botão Remover */}
                        {kanbanColumns.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveKanbanColumn(column.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModalSection>

        {/* Preview */}
        <ModalSection title="Preview">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex flex-col gap-2">
              {kanbanColumns.map((column) => {
                const columnStyle = {
                  gray: 'bg-gray-200 border-gray-300',
                  blue: 'bg-blue-200 border-blue-300',
                  green: 'bg-green-200 border-green-300',
                  orange: 'bg-orange-200 border-orange-300',
                  red: 'bg-red-200 border-red-300',
                  purple: 'bg-purple-200 border-purple-300'
                }[column.color] || 'bg-gray-200 border-gray-300';

                return (
                  <div key={column.id} className={`p-3 rounded border ${columnStyle}`}>
                    <div className="text-xs font-medium text-gray-700 mb-1">{column.name}</div>
                    <div className="text-xs text-gray-500">
                      {activities.filter(activity => {
                        if (column.status === 'pending') return activity.status === 'pending' || activity.status === 'open';
                        if (column.status === 'in_progress') return activity.status === 'in_progress';
                        if (column.status === 'completed') return activity.status === 'completed';
                        if (column.status === 'archived') return activity.status === 'archived' || activity.status === 'cancelled';
                        return activity.status === column.status;
                      }).length} atividades
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ModalSection>
      </RightDrawerModal>

      {/* Modal de Visualização de Atividade */}
      <ActivityViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingActivity(null);
        }}
        activity={viewingActivity}
        onEdit={handleViewModalEdit}
        onDelete={deleteActivity}
        employees={employees}
        companies={companies}
      />
      </div>
    </>
  );
};

export default Activities;
