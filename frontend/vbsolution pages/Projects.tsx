import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVB } from '@/contexts/VBContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useCompanies } from '@/hooks/useCompanies';
import { useProjects } from '@/hooks/useProjects';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useRightDrawer } from '@/contexts/RightDrawerContext';
import { toast } from '@/hooks/use-toast';
import { useFilters } from '@/hooks/useFilters';
import { useWorkGroup } from '@/contexts/WorkGroupContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import ProjectCreateModal from '@/components/ProjectCreateModal';
import ProjectEditModal from '@/components/ProjectEditModal';
import KanbanEditModal from '@/components/KanbanEditModal';
import { ProjectActivitiesModal } from '@/components/ProjectActivitiesModal';
import FilterBar from '@/components/FilterBar';
import { ProjectViewModal } from '@/components/ProjectViewModal';
import { RightDrawerModal, ModalSection } from '@/components/ui/right-drawer-modal';
import { ProjectsCalendarView } from '@/components/ProjectsCalendarView';
import { 
  Search,
  Plus,
  Eye,
  User,
  Share,
  MoreHorizontal,
  Kanban,
  List,
  Clock,
  Calendar,
  BarChart3,
  X,
  Zap,
  ArrowUpDown,
  Building2,
  Edit,
  Trash2,
  AlignJustify,
  DollarSign,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProjectDeadlineView from '@/components/ProjectDeadlineView';
import ClickUpKanban from '@/components/ClickUpKanban';
import ProjectKanbanBoard from '@/components/ProjectKanbanBoard';
import ProjectsDashboardCharts from '@/components/ProjectsDashboardCharts';
import ProjectsDashboardFilters from '@/components/ProjectsDashboardFilters';

const Projects = () => {
  const { t } = useTranslation();
  const { state } = useVB();
  const { companies = [] } = state || {};
  const { user } = useAuth();
  const { users: companyUsers } = useCompanyUsers(user?.id);
  const { companies: companiesHook } = useCompanies();
  const { workGroups } = useWorkGroup();
  const employees = React.useMemo(
    () => (companyUsers || []).map(user => ({ id: user.id, name: user.nome })),
    [companyUsers]
  );
  
  // Mapear grupos de trabalho para o formato esperado pelo FilterBar
  const workGroupNames = React.useMemo<string[]>(
    () => (workGroups || []).map(group => group.name),
    [workGroups]
  );
  
  const { projects, loading, error, createProject, updateProject, deleteProject, refetch: fetchProjects } = useProjects();
  
  // Garantir que projects seja sempre um array válido
  const safeProjects = Array.isArray(projects) ? projects : [];
  const [orderMap, setOrderMap] = useState<Record<string, string[]>>({});
  const { topBarColor } = useTheme();
  const { sidebarExpanded, setSidebarExpanded, showMenuButtons, expandSidebarFromMenu } = useSidebar();
  const { isRightDrawerOpen } = useRightDrawer();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'board' | 'lista' | 'prazo' | 'calendario' | 'dashboard'>('board');
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [isKanbanEditModalOpen, setIsKanbanEditModalOpen] = useState(false);
  const [isKanbanConfigModalOpen, setIsKanbanConfigModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<any>(null);
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [activitiesProject, setActivitiesProject] = useState<any>(null);
  const [kanbanColumns, setKanbanColumns] = useState<any[]>([]);
  const [kanbanLoaded, setKanbanLoaded] = useState(false);
  const [calendarReady, setCalendarReady] = useState(false);
  const [deadlineReady, setDeadlineReady] = useState(false);
  
  // Garantir que kanbanColumns seja sempre um array válido
  const safeKanbanColumns = Array.isArray(kanbanColumns) ? kanbanColumns : [];
  const [profiles, setProfiles] = useState<{[key: string]: string}>({});
  
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
    budget: 'all'
  });

  // Funções para fullscreen customizado (não usa API nativa do browser)
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    let handle: any;
    if (viewMode === 'calendario') {
      setCalendarReady(false);
      const cb = () => setCalendarReady(true);
      const ric = (window as any).requestIdleCallback;
      if (typeof ric === 'function') {
        handle = ric(cb, { timeout: 500 });
      } else {
        handle = setTimeout(cb, 150);
      }
    } else {
      setCalendarReady(false);
    }
    return () => {
      const cic = (window as any).cancelIdleCallback;
      if (typeof cic === 'function' && typeof handle === 'number') {
        cic(handle);
      } else if (handle) {
        clearTimeout(handle);
      }
    };
  }, [viewMode]);

  useEffect(() => {
    let handle: any;
    if (viewMode === 'prazo') {
      setDeadlineReady(false);
      const cb = () => setDeadlineReady(true);
      const ric = (window as any).requestIdleCallback;
      if (typeof ric === 'function') {
        handle = ric(cb, { timeout: 500 });
      } else {
        handle = setTimeout(cb, 150);
      }
    } else {
      setDeadlineReady(false);
    }
    return () => {
      const cic = (window as any).cancelIdleCallback;
      if (typeof cic === 'function' && typeof handle === 'number') {
        cic(handle);
      } else if (handle) {
        clearTimeout(handle);
      }
    };
  }, [viewMode]);

  const exitFullscreen = () => {
    setIsFullscreen(false);
  };

  const toggleFullscreenLayout = () => {
    setFullscreenLayout(prev => (prev === 'fit' ? 'scroll' : 'fit'));
  };

  // Handlers
  const handleProjectClick = (projectId: string) => {
    const project = enhancedProjects.find(p => p.id === projectId);
    if (project) {
      setViewingProject(project);
      setIsViewModalOpen(true);
    }
  };

  const handleViewModalEdit = (project: any) => {
    setEditingProject(project);
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    const initialOrder: Record<string, string[]> = {};
    const statuses = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
    statuses.forEach(st => { initialOrder[st] = []; });
    safeKanbanColumns.forEach(col => {
      if (col.status && !initialOrder[col.status]) initialOrder[col.status] = [];
    });
    safeProjects.forEach(p => {
      const st = p.status || 'planning';
      if (!initialOrder[st]) initialOrder[st] = [];
      initialOrder[st].push(p.id);
    });
    setOrderMap(initialOrder);
  }, [safeProjects, safeKanbanColumns]);


  // Funções para o ProjectKanbanBoard
  const handleMoveProject = async (projectId: string, newColumn: string, newPosition: number) => {
    try {
      // Mapear as colunas do Kanban para os status dos projetos
      let newStatus = newColumn;
      
      // Verificar se é uma coluna personalizada
      const customColumn = safeKanbanColumns.find(col => col.id === newColumn);
      if (customColumn && customColumn.status) {
        newStatus = customColumn.status;
      } else {
        // Mapeamento para colunas padrão
        if (newColumn === 'planning') newStatus = 'planning';
        else if (newColumn === 'active') newStatus = 'active';
        else if (newColumn === 'on_hold') newStatus = 'on_hold';
        else if (newColumn === 'completed') newStatus = 'completed';
        else if (newColumn === 'cancelled') newStatus = 'cancelled';
      }

      const current = safeProjects.find(p => p.id === projectId);
      const sourceStatus = current?.status || newStatus;

      setOrderMap(prev => {
        const next = { ...prev };
        const srcArr = [...(next[sourceStatus] || [])].filter(id => id !== projectId);
        next[sourceStatus] = srcArr;
        const destArr = [...(next[newStatus] || [])].filter(id => id !== projectId);
        const clampedIndex = Math.max(0, Math.min(newPosition, destArr.length));
        destArr.splice(clampedIndex, 0, projectId);
        next[newStatus] = destArr;
        return next;
      });

      const statusChanged = sourceStatus !== newStatus;
      const result = statusChanged ? await updateProject(projectId, { status: newStatus }) : { data: null, error: null };
      
      if (result.error) {
        toast({
          title: "Erro ao mover projeto",
          description: result.error,
          variant: "destructive",
        });
        return { data: null, error: result.error };
      }

      toast({
        title: "Projeto movido",
        description: statusChanged ? "Projeto movido para outra etapa" : "Ordem atualizada na etapa",
      });

      return { data: result.data, error: null };
    } catch (error) {
      console.error('Erro ao mover projeto:', error);
      return { data: null, error: 'Erro ao mover projeto' };
    }
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setIsEditModalOpen(true);
  };

  const handleUpdateProject = async (formData: any) => {
    try {
      if (!editingProject) return;

      console.log('🔄 [UPDATE] Dados recebidos do formulário:', formData);
      console.log('🔄 [UPDATE] Projeto sendo editado:', editingProject);
      
      // Verificar se há dados problemáticos
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        console.log(`🔍 [UPDATE] Campo ${key}:`, value, typeof value);
      });

      const cleanValue = (value: any) => {
        if (value === undefined) return undefined;
        if (value === null || value === '') return null;
        if (Array.isArray(value)) return value.length > 0 ? value[0] : null;
        return value;
      };

      // Usar apenas campos essenciais - mesma lógica que funcionou para atividades
      const updateData: any = {
        name: formData.name?.trim() || editingProject.name,
        description: formData.description?.trim() || null,
        status: formData.status || editingProject.status,
        priority: formData.priority || editingProject.priority
      };

      // Adicionar apenas campos opcionais se válidos
      if (formData.start_date) {
        try {
          updateData.start_date = new Date(formData.start_date).toISOString();
        } catch (error) {
          console.warn('⚠️ [UPDATE] Data de início inválida:', formData.start_date);
        }
      }

      if (formData.due_date) {
        try {
          // Tabela usa end_date; aceitar due_date do formulário e mapear
          updateData.end_date = new Date(formData.due_date).toISOString();
        } catch (error) {
          console.warn('⚠️ [UPDATE] Data de vencimento inválida:', formData.due_date);
        }
      }

      if (formData.budget && !isNaN(parseFloat(formData.budget.toString()))) {
        updateData.budget = parseFloat(formData.budget.toString());
      }

      if (formData.id_empresa !== undefined) {
        updateData.id_empresa = cleanValue(formData.id_empresa);
      }

      if (formData.manager_id !== undefined) {
        updateData.manager_id = cleanValue(formData.manager_id);
      }

      if (formData.responsible_id !== undefined) {
        updateData.responsible_id = cleanValue(formData.responsible_id);
      }

      // Campos progress e notes não existem no schema atual de projects; omitidos

      console.log('🔄 [UPDATE] Dados de atualização preparados:', { 
        id: editingProject.id, 
        updateData
      });

      const result = await updateProject(editingProject.id, updateData);
      
      if (result && !result.error) {
        console.log('✅ [UPDATE] Projeto atualizado com sucesso:', result.data);
        
        toast({
          title: "Projeto atualizado",
          description: "Projeto foi atualizado com sucesso"
        });
        
        setIsEditModalOpen(false);
        setEditingProject(null);
      } else if (result && result.error) {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ [UPDATE] Erro ao atualizar projeto:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar projeto",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const result = await deleteProject(projectId);
      
      if (result.error) {
        toast({
          title: "Erro ao excluir projeto",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Projeto excluído",
        description: "Projeto excluído com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      toast({
        title: "Erro ao excluir projeto",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };


  // Carregar configurações do Kanban salvas
  useEffect(() => {
    const savedKanbanConfig = localStorage.getItem('projectsKanbanColumns');
    if (savedKanbanConfig) {
      try {
        const parsedConfig = JSON.parse(savedKanbanConfig);
        setKanbanColumns(parsedConfig);
        setKanbanLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar configurações do Kanban:', error);
        setKanbanColumns([
          { id: 'planning', name: 'PLANEJAMENTO', color: '#8B7355', status: 'planning' },
          { id: 'active', name: 'EM ANDAMENTO', color: '#6B8E23', status: 'active' },
          { id: 'on_hold', name: 'PAUSADO', color: '#CD853F', status: 'on_hold' },
          { id: 'completed', name: 'CONCLUÍDO', color: '#556B2F', status: 'completed' },
          { id: 'cancelled', name: 'CANCELADO', color: '#DC2626', status: 'cancelled' }
        ]);
        setKanbanLoaded(true);
      }
    } else {
      setKanbanColumns([
        { id: 'planning', name: 'PLANEJAMENTO', color: '#8B7355', status: 'planning' },
        { id: 'active', name: 'EM ANDAMENTO', color: '#6B8E23', status: 'active' },
        { id: 'on_hold', name: 'PAUSADO', color: '#CD853F', status: 'on_hold' },
        { id: 'completed', name: 'CONCLUÍDO', color: '#556B2F', status: 'completed' },
        { id: 'cancelled', name: 'CANCELADO', color: '#DC2626', status: 'cancelled' }
      ]);
      setKanbanLoaded(true);
    }
    
    // Carregar perfis
    loadProfiles();
  }, []);

  // Salvar configurações do Kanban sempre que houver mudanças
  useEffect(() => {
    if (kanbanLoaded && safeKanbanColumns.length > 0) {
      localStorage.setItem('projectsKanbanColumns', JSON.stringify(safeKanbanColumns));
    }
  }, [safeKanbanColumns, kanbanLoaded]);

  // Funções para gerenciar colunas do Kanban
  const handleAddKanbanColumn = () => {
    const newColumn = {
      id: `column_${Date.now()}`,
      name: 'NOVA ETAPA',
      color: 'gray',
      status: 'planning'
    };
    setKanbanColumns([...safeKanbanColumns, newColumn]);
    
    toast({
      title: "Nova etapa adicionada",
      description: "Uma nova etapa foi adicionada ao seu Kanban",
      duration: 3000,
    });
  };

  const handleRemoveKanbanColumn = async (columnId: string) => {
    if (safeKanbanColumns.length > 1) {
      const columnToRemove = safeKanbanColumns.find(col => col.id === columnId);
      
      // Encontrar a coluna "Planejamento" ou "Pendente" para mover os projetos
      const planningColumn = safeKanbanColumns.find(col => 
        col.status === 'planning' || 
        col.status === 'pending' ||
        col.name?.toLowerCase().includes('planejamento') ||
        col.name?.toLowerCase().includes('planning') ||
        col.name?.toLowerCase().includes('pendente')
      );
      
      const planningStatus = planningColumn?.status || 'planning';
      
      // Buscar projetos que estão na coluna que será removida
      const projectsToMove = safeProjects.filter(project => 
        project.status === columnToRemove?.status
      );
      
      if (projectsToMove.length > 0) {
        // Mover todos os projetos para "Planejamento"
        try {
          const updatePromises = projectsToMove.map(project =>
            updateProject(project.id, { status: planningStatus })
          );
          
          await Promise.all(updatePromises);
          
          toast({
            title: "Projetos movidos",
            description: `${projectsToMove.length} projeto(s) foram movidos para "${planningColumn?.name || 'Planejamento'}"`,
            duration: 3000,
          });
        } catch (error) {
          console.error('Erro ao mover projetos:', error);
          toast({
            title: "Erro ao mover projetos",
            description: "Alguns projetos podem não ter sido movidos corretamente",
            variant: "destructive",
            duration: 3000,
          });
        }
      }
      
      // Remover a coluna
      setKanbanColumns(safeKanbanColumns.filter(col => col.id !== columnId));
      
      toast({
        title: "Etapa removida",
        description: `"${columnToRemove?.name}" foi removida do seu Kanban`,
        duration: 3000,
      });
    }
  };

  const handleUpdateKanbanColumn = (columnId: string, fieldOrUpdates: string | any, value?: string) => {
    setKanbanColumns(safeKanbanColumns.map(col => {
      if (col.id === columnId) {
        if (typeof fieldOrUpdates === 'string' && value !== undefined) {
          // Chamada com field e value: handleUpdateKanbanColumn(id, 'name', 'Novo Nome')
          return { ...col, [fieldOrUpdates]: value };
        } else {
          // Chamada com updates object: handleUpdateKanbanColumn(id, { name: 'Novo Nome' })
          return { ...col, ...fieldOrUpdates };
        }
      }
      return col;
    }));
  };

  // Função para reordenar colunas
  const handleReorderKanbanColumns = (fromIndex: number, toIndex: number) => {
    const newColumns = [...safeKanbanColumns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);
    setKanbanColumns(newColumns);
    
    toast({
      title: "Etapas reordenadas",
      description: "A ordem das etapas foi atualizada",
      duration: 2000,
    });
  };

  // Hook para gerenciar filtros
  const { filters, updateFilter, clearFilters, getFilterParams } = useFilters();
  
  // Estado para filtro de data de criação
  const [dateFilter, setDateFilter] = useState<string>('');
  
  const navigate = useNavigate();

  // Função para aplicar filtros
  const applyFilters = async () => {
    const filterParams = getFilterParams();
    // Adicionar filtro de data de criação se houver
    if (dateFilter) {
      filterParams.created_date = dateFilter;
    }
    // Garantir que o filtro de responsável seja aplicado corretamente
    if (filters.responsibleId && filters.responsibleId !== 'all') {
      filterParams.responsible_id = filters.responsibleId;
    } else {
      delete filterParams.responsible_id;
    }
    (filterParams as any).view = viewMode;
    console.log('🔍 [FILTER-DEBUG] Aplicando filtros:', filterParams);
    await fetchProjects(filterParams);
  };

  const handleFilterApply = () => {
    applyFilters();
  };
  
  const filtersDebounceRef = React.useRef<number | null>(null);
  const isFirstRun = React.useRef(true);

  useEffect(() => {
    // Na primeira execução (montagem), carregar imediatamente sem debounce
    if (isFirstRun.current) {
      isFirstRun.current = false;
      applyFilters();
      return;
    }

    if (filtersDebounceRef.current) {
      window.clearTimeout(filtersDebounceRef.current);
    }
    filtersDebounceRef.current = window.setTimeout(() => {
      applyFilters();
    }, 250);
    return () => {
      if (filtersDebounceRef.current) {
        window.clearTimeout(filtersDebounceRef.current);
        filtersDebounceRef.current = null;
      }
    };
  }, [filters, dateFilter]);

  const handleCreateProject = async (formData: any) => {
    try {
      // Converter strings vazias para null
      const cleanValue = (value: any) => {
        if (!value || value === '') return null;
        if (Array.isArray(value)) return value.length > 0 ? value[0] : null;
        return value;
      };

      const projectData = {
        name: formData.name,
        description: formData.description,
        status: formData.status as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled',
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        budget: formData.budget !== undefined && formData.budget !== null && formData.budget !== ''
          ? Number(formData.budget)
          : undefined,
        id_empresa: cleanValue(formData.id_empresa),
        manager_id: cleanValue(formData.manager_id),
        responsible_id: cleanValue(formData.responsible_id)
      };

      console.log('🔄 [CREATE PROJECT] Dados limpos:', projectData);

      const result = await createProject(projectData);
      
      if (result) {
        toast({
          title: "Projeto criado",
          description: "Projeto foi criado com sucesso"
        });
        setIsCreateModalOpen(false);
        fetchProjects();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar projeto",
        variant: "destructive"
      });
    }
  };

  // Função para importação em massa de projetos via Excel
  const handleImportProjects = async (data: any[]) => {
    try {
      console.log('📊 [IMPORT] Iniciando importação de', data.length, 'projetos');

      // Filtrar apenas linhas com dados válidos
      const validData = data.filter(row => {
        return row.name && row.name.trim() !== '' && row.name.trim() !== 'Exemplo';
      });

      console.log(`📊 [IMPORT] Dados válidos: ${validData.length} de ${data.length} total`);

      if (validData.length === 0) {
        throw new Error('Nenhum dado válido encontrado para importar');
      }

      // Processar dados importados
      const projectsData = await Promise.all(validData.map(async (row) => {
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

        // Processar status - sempre usar 'planning' para projetos sem status definido
        let processedStatus = 'planning'; // Status padrão que corresponde a "PLANEJAMENTO" no Kanban
        if (row.status && row.status !== 'Exemplo' && row.status.trim() !== '') {
          const statusMap: { [key: string]: string } = {
            'planejamento': 'planning',
            'ativo': 'active',
            'em andamento': 'active',
            'pausado': 'on_hold',
            'concluído': 'completed',
            'cancelado': 'cancelled'
          };
          processedStatus = statusMap[row.status.toLowerCase()] || 'planning';
        }

        // Processar prioridade
        let processedPriority = 'medium';
        if (row.priority && row.priority !== 'Exemplo' && row.priority.trim() !== '') {
          const priorityMap: { [key: string]: string } = {
            'baixa': 'low',
            'média': 'medium', 
            'alta': 'high',
            'urgente': 'urgent'
          };
          processedPriority = priorityMap[row.priority.toLowerCase()] || 'medium';
        }

        const projectData = {
          name: row.name,
          description: row.description || '',
          status: processedStatus as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled',
          priority: processedPriority as 'low' | 'medium' | 'high' | 'urgent',
          start_date: row.start_date || undefined,
          due_date: row.due_date || undefined,
          budget: row.budget || undefined,
          currency: row.currency || 'BRL',
          progress: row.progress || 0,
          id_empresa,
          notes: row.notes || ''
        };
        
        console.log('🔍 [IMPORT] Dados do projeto individual:', projectData);
        return projectData;
      }));

      console.log('📤 [IMPORT] Dados preparados para inserção:', projectsData);

      // Inserir todos os projetos no Supabase
      const { data: insertedProjects, error } = await supabase
        .from('projects')
        .insert(projectsData)
        .select();

      if (error) {
        console.error('❌ [IMPORT] Erro no Supabase:', error);
        throw error;
      }

      console.log('✅ [IMPORT] Projetos importados com sucesso:', insertedProjects);

      // Recarregar projetos para atualizar todas as visualizações
      console.log('🔄 [IMPORT] Recarregando projetos...');
      await fetchProjects();
      console.log('✅ [IMPORT] Projetos recarregados');

      toast({
        title: "Importação concluída",
        description: `${insertedProjects?.length || 0} projetos foram importados com sucesso`
      });

    } catch (error) {
      console.error('❌ [IMPORT] Erro ao importar projetos:', error);
      throw error;
    }
  };

  const handleProjectMove = (taskId: string, fromColumn: string, toColumn: string) => {
    console.log(`Projeto ${taskId} movido de ${fromColumn} para ${toColumn}`);
  };

  const handleOpenCreateModal = (columnId?: string) => {
    setIsCreateModalOpen(true);
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
      budget: 'all'
    });
  };

  const handleRefreshDashboard = () => {
    fetchProjects();
  };




  const handleViewModeChange = (mode: 'board' | 'lista' | 'prazo' | 'calendario' | 'dashboard') => {
    setViewMode(mode);
  };

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

  const enhancedProjects = useMemo(() => {
    const statusOrderRank: Record<string, number> = {
      planning: 0, active: 1, on_hold: 2, completed: 3, cancelled: 4
    };
    return safeProjects.map(project => {
      const resolvedCompanyId = (project as any).id_empresa || null;
      const responsibleName = project.responsible_id ? getProfileName(project.responsible_id) : undefined;
      const managerName = project.manager_id ? getProfileName(project.manager_id) : undefined;
      const st = project.status || 'planning';
      const ids = orderMap[st] || [];
      const pos = ids.indexOf(project.id);
      const sortIndex = (statusOrderRank[st] ?? 999) * 100000 + (pos >= 0 ? pos : 99999);

      return {
        ...project,
        id_empresa: resolvedCompanyId,
        sortIndex,
        responsible: responsibleName || project.responsible || '',
        manager: managerName || project.manager || ''
      };
    }).sort((a, b) => (a.sortIndex as number) - (b.sortIndex as number));
  }, [safeProjects, profiles, orderMap]);
  const deferredProjects = React.useDeferredValue(enhancedProjects);

  // Botões de visualização
  const viewButtons = useMemo(() => [
    { 
      id: 'board', 
      label: t('pages.projects.viewModes.board'),
      icon: Kanban,
      active: viewMode === 'board'
    },
    {
      id: 'lista', 
      label: t('pages.projects.viewModes.list'),
      icon: List,
      active: viewMode === 'lista'
    },
    {
      id: 'prazo', 
      label: t('pages.projects.viewModes.deadline'),
      icon: Clock,
      active: viewMode === 'prazo'
    },
    {
      id: 'calendario', 
      label: t('pages.projects.viewModes.calendar'),
      icon: Calendar,
      active: viewMode === 'calendario'
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar projetos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
                     <Button onClick={() => fetchProjects()} variant="outline">
             Tentar novamente
           </Button>
        </div>
      </div>
    );
  }

  // Loading state - mostrar apenas se não houver projetos
  // Se houver dados (cache), mostra os dados enquanto atualiza em background
  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header fixo responsivo ao sidebar - Esconde em fullscreen */}
      {!isFullscreen && (
        <div 
          className="fixed top-[38px] right-0 bg-white border-b border-gray-200 z-30 transition-all duration-300"
          style={{
            left: sidebarExpanded ? '240px' : '64px'
          }}
        >
        {/* Botões de visualização */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Botão fixo de toggle da sidebar */}
              {showMenuButtons && !sidebarExpanded && (
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
              
              {/* Botão de configuração do Kanban - apenas para aba board */}
              {viewMode === 'board' && (
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

          {/* Barra de filtros funcionais - não exibir na aba Dashboard */}
          {viewMode !== 'dashboard' && (
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
                  const filterParams = getFilterParams();
                  (filterParams as any).view = viewMode;
                  await fetchProjects(filterParams);
              }}
              employees={employees}
              departments={workGroupNames}
              searchPlaceholder="Filtrar por nome do projeto..."
              showWorkGroupFilter={true}
              showResponsibleFilter={true}
              companies={(((companiesHook && companiesHook.length > 0) ? companiesHook : (companies || [])) as any[])
                .map((c: any) => ({
                id: String(c?.id),
                name: c?.fantasy_name || c?.company_name || c?.fantasyName || c?.companyName || 'Empresa'
              }))}
              showCompanyFilter={true}
              showArchivedFilter={false}
            />
          )}
        </div>
      )}

      {/* Container principal com padding para o header fixo */}
      <div 
        className={`overflow-x-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-50 dark:bg-black' : `px-1 ${viewMode === 'dashboard' ? 'pt-[60px]' : 'pt-[140px]'}`}`} 
        style={{minHeight: 'calc(100vh - 38px)'}}
      >

        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'board' && kanbanLoaded && (
          <div className={`w-full overflow-x-hidden ${isFullscreen ? 'h-full flex flex-col p-4' : ''}`}>
            
            {/* ProjectKanbanBoard - Kanban para Projetos */}
            <ProjectKanbanBoard
              projects={deferredProjects}
              onMoveProject={handleMoveProject}
              onReindexColumn={async () => ({ data: null, error: null })}
              onAddProject={handleOpenCreateModal}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
              onProjectClick={handleProjectClick}
              className={isFullscreen ? 'flex-1' : 'px-3'}
              columns={safeKanbanColumns}
              employees={employees}
            />
          </div>
        )}

        {/* Visualização em Lista */}
        {viewMode === 'lista' && (
          <div className="w-full">
            {/* Tabela de Projetos */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {/* Cabeçalho da Tabela */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex items-center px-3 py-3 gap-2">
                  <div className="flex-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span>Projeto</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Status</span>
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
                    <span>Orçamento</span>
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
              <div className="divide-y divide-gray-200">
                {deferredProjects.length > 0 ? (
                  deferredProjects.map((project) => (
                    <div key={project.id} className="flex items-center px-3 py-3 h-14 hover:bg-gray-50 transition-colors gap-2">
                      <div className="flex-1 flex items-center gap-3 min-w-0">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm text-gray-900 truncate font-medium">{project.name}</span>
                          <span className="text-xs text-gray-400">
                            {project.description || 'Sem descrição'}
                          </span>
                        </div>
                      </div>
                      <div className="w-24 flex items-center justify-center">
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1 py-0.5 border font-medium ${
                            project.status === 'planning' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                            project.status === 'active' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            project.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}
                        >
                            {project.status === 'planning' ? 'Pendente' :
                           project.status === 'active' ? 'Ativo' :
                             project.status === 'completed' ? 'Concluído' : 'Pendente'}
                        </Badge>
                        </div>
                      <div className="w-24 flex items-center justify-center gap-2 text-sm text-gray-600">
                        <span className="text-xs">
                          {project.end_date ? new Date(project.end_date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit'
                          }) : 'Sem prazo'}
                        </span>
                      </div>
                      <div className="w-28 flex items-center justify-center gap-2 text-sm text-gray-600">
                        <span className="truncate max-w-20">
                          {project.responsible_id ? getProfileName(project.responsible_id) : 'Não atribuído'}
                        </span>
                      </div>
                      <div className="w-24 flex items-center justify-center gap-2 text-sm text-gray-600">
                        <span className="text-xs">
                          {project.budget ? `R$ ${project.budget.toLocaleString()}` : 'Sem orçamento'}
                        </span>
                      </div>
                      <div className="w-24 flex items-center justify-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1 py-0.5 border font-medium ${
                          project.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                          project.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                          project.priority === 'medium' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-green-100 text-green-800 border-green-200'
                          }`}
                        >
                          {project.priority === 'urgent' ? 'Urgente' :
                           project.priority === 'high' ? 'Alta' :
                           project.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                      <div className="w-20 flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                          onClick={() => handleProjectClick(project.id)}
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-md transition-all duration-200 h-6 w-6"
                          title="Visualizar projeto"
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
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-all duration-200 h-6 w-6"
                          title="Excluir projeto"
                          >
                          <Trash2 className="h-3 w-3" />
                          </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    Nenhum projeto encontrado
                  </div>
                )}
              </div>
            </div>

            {/* Espaço branco inferior */}
            <div className="h-32 bg-[#F9FAFB]"></div>
          </div>
        )}

        {/* Visualização por Prazo */}
          {viewMode === 'prazo' && deadlineReady && (
          <div className={`w-full projects-prazo-view ${isFullscreen ? 'h-full flex flex col p-4' : ''}`}>
            <ProjectDeadlineView 
              projects={deferredProjects}
              onProjectClick={handleProjectClick}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
              onCreateProject={handleOpenCreateModal}
              isFullscreen={isFullscreen}
              topBarColor={topBarColor}
              columns={safeKanbanColumns}
              onMoveProject={handleMoveProject}
              onReindexColumn={async () => ({ data: null, error: null })}
              employees={employees}
            />
          </div>
        )}

        {/* Visualização Calendário */}
        {viewMode === 'calendario' && calendarReady && (
          <ProjectsCalendarView
            projects={deferredProjects}
            onProjectClick={handleProjectClick}
            onCreateProject={() => setIsCreateModalOpen(true)}
            className="-mt-[140px] pt-[140px]"
          />
        )}



                </div>

      {/* Botão flutuante de novo projeto - esconde em fullscreen e quando modal direito estiver aberto */}
      {!isFullscreen && !isRightDrawerOpen && (
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

      {/* Modais */}
                <ProjectCreateModal
          isOpen={isCreateModalOpen}
                  onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateProject}
          companies={companies}
          employees={employees}
                />

      {/* Modal de Automações */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAutomationModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
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
            <div className="px-6 py-6">
              <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Espaço para futuras automações</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição do Kanban */}
      {isKanbanEditModalOpen && (
        <KanbanEditModal
          isOpen={isKanbanEditModalOpen}
          onClose={handleCloseKanbanEditModal}
          columns={safeKanbanColumns}
          projects={deferredProjects}
          onUpdateColumn={handleUpdateKanbanColumn}
          onRemoveColumn={handleRemoveKanbanColumn}
          onAddColumn={handleAddKanbanColumn}
        />
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Etapas do Kanban</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddKanbanColumn}
                className="flex items-center gap-2 text-xs"
              >
                <Plus className="w-3 h-3" />
                Adicionar Etapa
              </Button>
            </div>

            <div className="space-y-3">
              {safeKanbanColumns.map((column, index) => (
                <div 
                  key={column.id} 
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 group hover:shadow-md transition-all duration-200"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', index.toString());
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('ring-2', 'ring-blue-200');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('ring-2', 'ring-blue-200');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('ring-2', 'ring-blue-200');
                    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    if (draggedIndex !== index) {
                      handleReorderKanbanColumns(draggedIndex, index);
                    }
                  }}
                >
                  <div className="space-y-3">
                    {/* Header com drag handle */}
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 cursor-move text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-medium text-gray-500">Etapa {index + 1}</span>
                      </div>
                    </div>

                    {/* Nome da Coluna */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Nome</label>
                      <input
                        type="text"
                        value={column.name}
                        onChange={(e) => handleUpdateKanbanColumn(column.id, 'name', e.target.value)}
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
                            onClick={() => handleUpdateKanbanColumn(column.id, 'color', color)}
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
                        {projects.filter(project => {
                          const statusMap = {
                            'planning': 'planning',
                            'active': 'active', 
                            'on_hold': 'on_hold',
                            'completed': 'completed',
                            'cancelled': 'cancelled',
                            'new': 'new'
                          };
                          return statusMap[project.status] === column.status;
                        }).length} projetos
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Botão Remover */}
                        {safeKanbanColumns.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveKanbanColumn(column.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
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
        <ModalSection title="Preview do Kanban">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex gap-3 overflow-x-auto">
              {safeKanbanColumns.map((column) => {
                const columnStyle = {
                  gray: 'bg-gray-200 border-gray-300',
                  blue: 'bg-blue-200 border-blue-300',
                  green: 'bg-green-200 border-green-300',
                  orange: 'bg-orange-200 border-orange-300',
                  red: 'bg-red-200 border-red-300',
                  purple: 'bg-purple-200 border-purple-300'
                }[column.color] || 'bg-gray-200 border-gray-300';

                const projectCount = projects.filter(project => {
                  const statusMap = {
                    'planning': 'planning',
                    'active': 'active', 
                    'on_hold': 'on_hold',
                    'completed': 'completed',
                    'cancelled': 'cancelled',
                    'new': 'new'
                  };
                  return statusMap[project.status] === column.status;
                }).length;

                return (
                  <div key={column.id} className={`p-3 rounded border min-w-[120px] ${columnStyle}`}>
                    <div className="text-xs font-medium text-gray-700 mb-1 truncate">{column.name}</div>
                    <div className="text-xs text-gray-500">
                      {projectCount} projeto{projectCount !== 1 ? 's' : ''}
                    </div>
                    <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          column.color === 'gray' ? 'bg-gray-400' :
                          column.color === 'blue' ? 'bg-blue-400' :
                          column.color === 'green' ? 'bg-green-400' :
                          column.color === 'orange' ? 'bg-orange-400' :
                          column.color === 'red' ? 'bg-red-400' :
                          'bg-purple-400'
                        }`}
                        style={{ width: `${Math.min((projectCount / Math.max(projects.length, 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-xs text-gray-500 text-center">
              Arraste as etapas para reordenar • Clique nas cores para alterar • Use o botão + para adicionar
            </div>
          </div>
        </ModalSection>
      </RightDrawerModal>

      {/* Modal de edição de projeto */}
      {isEditModalOpen && editingProject && (
        <ProjectEditModal
                  isOpen={isEditModalOpen}
                  project={editingProject}
                  companies={companies}
                  employees={employees}
                  onSubmit={handleUpdateProject}
                  onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingProject(null);
                  }}
                />
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

      {/* Modal de Visualização de Projeto */}
      <ProjectViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingProject(null);
        }}
        project={viewingProject}
        onEdit={handleViewModalEdit}
        onDelete={deleteProject}
        employees={employees}
        companies={companies}
        onOpenActivities={(project) => {
          console.log('Abrindo modal de atividades para projeto:', project);
          setActivitiesProject(project);
          setIsActivitiesModalOpen(true);
        }}
      />

      {/* Modal de Atividades do Projeto */}
      <ProjectActivitiesModal
        isOpen={isActivitiesModalOpen}
        onClose={() => {
          setIsActivitiesModalOpen(false);
          setActivitiesProject(null);
        }}
        project={activitiesProject}
        employees={employees}
        companies={companies}
      />
    </div>
  );
};

export default Projects;
