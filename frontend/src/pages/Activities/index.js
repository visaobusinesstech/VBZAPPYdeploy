// Re-saved
import React, { useState, useEffect, useMemo, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  List as ListIcon,
  CalendarToday as CalendarIcon,
  ViewWeek as KanbanIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon, // Mantendo import original se precisar reverter
  FullscreenExit as FullscreenExitIcon,
  Settings as SettingsIcon,
  ZoomOutMap as ZoomOutMapIcon,
  ExpandMore as ExpandMoreIcon
} from "@material-ui/icons";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Drawer,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Popover,
  Grid
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import api from "../../services/api";

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import ActivitiesStyleLayout from "../../components/ActivitiesStyleLayout";
import KanbanBoard from "../../components/KanbanBoard";
import ActivityDetailsModal from "../../components/ActivityDetailsModal";
import CreateActivityModal from "../../components/CreateActivityModal";
import useActivities from "../../hooks/useActivities";
import { toast } from "react-toastify";
import toastError from "../../errors/toastError";
import activitiesService from "../../services/activitiesService";

const localizer = momentLocalizer(moment);

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    height: "100%",
    overflow: "hidden",
  },
  dashboardCard: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing(2),
  },
  cardValue: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: theme.palette.primary.main,
  },
  cardLabel: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
  },
  drawerPaper: {
    width: 420,
    maxWidth: "100%",
    padding: theme.spacing(2),
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
    borderRadius: "16px 0 0 16px",
  },
  drawerContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
  },
  drawerTitle: {
    fontWeight: 600,
  },
  drawerContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
  },
  drawerActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: theme.spacing(3),
    gap: theme.spacing(1),
  },
}));
// Helpers
const formatDate = (value) => {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return String(value);
  }
};

const mapTypeLabel = (type) => {
  const t = String(type || '').toLowerCase();
  if (t === 'task') return 'Tarefa';
  if (t === 'call') return 'Ligação';
  if (t === 'email') return 'E-mail';
  if (t === 'meeting') return 'Reunião';
  return type || '';
};

const mapStatusLabel = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'in_progress') return 'Em progresso';
  if (s === 'pending') return 'Pendente';
  if (s === 'completed') return 'Concluído';
  if (s === 'backlog') return 'Backlog';
  return status || '';
};

// Sub-component for List View
const ActivitiesList = ({ activities }) => {
  return (
    <TableContainer component={Paper} style={{ height: '100%', overflow: 'auto' }}>
      <Table stickyHeader aria-label="activities table">
        <TableHead>
          <TableRow>
            <TableCell>Título</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Data</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {activities.length > 0 ? (
            activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell component="th" scope="row">
                  {activity.title}
                </TableCell>
                <TableCell>{mapTypeLabel(activity.type)}</TableCell>
                <TableCell>{formatDate(activity.date)}</TableCell>
                <TableCell>
                  <Chip 
                    label={mapStatusLabel(activity.status)} 
                    size="small" 
                    color={String(activity.status).toLowerCase() === 'completed' ? 'primary' : 'default'} 
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} align="center">
                Nenhuma atividade encontrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Sub-component for Calendar View
const ActivitiesCalendar = ({ activities }) => {
  const events = useMemo(() => {
    return activities.map(a => ({
      title: a.title,
      start: new Date(a.date),
      end: new Date(a.date), // Assuming 1 hour or all day for simplicity
      allDay: true,
      resource: a
    }));
  }, [activities]);

  const eventPropGetter = (event) => {
    const now = new Date();
    const start = new Date(event.start);
    // Remove hora para comparar apenas datas
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    
    const isPast = eventDate < today;
    const isToday = eventDate.getTime() === today.getTime();
    const status = event.resource.status;

    let backgroundColor = '#2563eb'; // Azul padrão (pendente/futuro)

    if (status === 'completed' || status === 'Concluído') {
      backgroundColor = '#10B981'; // Verde (Concluído)
    } else if (isPast) {
      backgroundColor = '#EF4444'; // Vermelho (Vencido)
    } else if (isToday) {
      backgroundColor = '#F59E0B'; // Laranja (Vence hoje)
    } else if (status === 'in_progress' || status === 'Em Progresso') {
      backgroundColor = '#3B82F6'; // Azul (Em progresso)
    }

    return { style: { backgroundColor, borderRadius: '4px', opacity: 0.8, color: 'white', border: '0px', display: 'block' } };
  };

  return (
    <div style={{ height: 'calc(100vh - 200px)', backgroundColor: '#fff', padding: 16 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={eventPropGetter}
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          date: "Data",
          time: "Hora",
          event: "Evento",
          noEventsInRange: "Não há eventos neste período."
        }}
      />
    </div>
  );
};

const Activities = () => {
  const classes = useStyles();
  const [viewMode, setViewMode] = useState("board");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selectedResponsible, setSelectedResponsible] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [contactsList, setContactsList] = useState([]);
  const [anchorResp, setAnchorResp] = useState(null);
  const [anchorEmpresa, setAnchorEmpresa] = useState(null);
  const [anchorPeriodo, setAnchorPeriodo] = useState(null);
  const [anchorTodos, setAnchorTodos] = useState(null);
  const [activitiesState, setActivitiesState] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityToEdit, setActivityToEdit] = useState(null);
  const kanbanRef = useRef(null);
  
  // Use existing hook
  const { activities, loading, count, hasMore } = useActivities({
    searchParam,
    pageNumber,
    dateStart,
    dateEnd
  });

  useEffect(() => {
    async function fetchFilters() {
      try {
        const { data: contactsData } = await api.get("/contacts/list");
        setContactsList(contactsData || []);
        const { data: usersResp } = await api.get("/users", { params: { searchParam: "" } });
        setUsersList(usersResp?.users || []);
      } catch (err) {
        // ignore
      }
    }
    fetchFilters();
  }, []);

  useEffect(() => {
    setActivitiesState(activities);
  }, [activities]);

  const handleSearch = (value) => {
    setSearchParam(value);
  };

  const handleCreateActivity = () => {
    setDrawerOpen(true);
  };

  const viewModes = [
    { value: "board", label: "Quadro", icon: <KanbanIcon /> },
    { value: "list", label: "Lista", icon: <ListIcon /> },
    { value: "calendar", label: "Calendário", icon: <CalendarIcon /> },
  ];

  // Filters placeholder
  const filters = [
    {
      label: "Status",
      value: statusFilter,
      options: [
        { value: "pending", label: "Pendente" },
        { value: "in_progress", label: "Em Progresso" },
        { value: "completed", label: "Concluído" },
      ],
      onChange: (val) => setStatusFilter(val)
    }
  ];

  // Calculate quick stats for the header
  const headerStats = useMemo(() => {
    const total = activitiesState.length;
    const completed = activitiesState.filter(a => a.status === 'completed' || a.status === 'Concluído').length;
    return [
      { label: "Total", value: total, color: "#2563eb" },
      { label: "Concluídas", value: completed, color: "#22c55e" }
    ];
  }, [activitiesState]);

  const filteredActivities = useMemo(() => {
    if (!statusFilter) {
      return activitiesState;
    }

    return activitiesState.filter((activity) => activity.status === statusFilter);
  }, [activitiesState, statusFilter]);

  useEffect(() => {
    const onFsChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      setIsFullscreen(!!fsEl && (fsEl === kanbanRef.current));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("mozfullscreenchange", onFsChange);
    document.addEventListener("MSFullscreenChange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("mozfullscreenchange", onFsChange);
      document.removeEventListener("MSFullscreenChange", onFsChange);
    };
  }, []);

  const requestFs = (el) => {
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
    if (el.msRequestFullscreen) return el.msRequestFullscreen();
  };

  const exitFs = () => {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
    if (document.msExitFullscreen) return document.msExitFullscreen();
  };

  const handleToggleKanbanFullscreen = () => {
    if (viewMode !== "board") return;
    if (!kanbanRef.current) return;
    if (isFullscreen) {
      exitFs();
    } else {
      requestFs(kanbanRef.current);
    }
  };

  const actionsRight = (
    <>
      {/* Removidos botões de setas da navbar */}
      <IconButton
        title="Expandir Kanban"
        onClick={handleToggleKanbanFullscreen}
        color="default"
        size="small"
        style={{ color: '#6b7280', padding: 4, width: 32, height: 32 }}
      >
        {isFullscreen ? <FullscreenExitIcon style={{ fontSize: 18 }} /> : <ZoomOutMapIcon style={{ fontSize: 18 }} />}
      </IconButton>
      <IconButton
        title="Configurações"
        color="default"
        size="small"
        style={{ color: '#6b7280', padding: 4, width: 32, height: 32 }}
        onClick={() => {}}
      >
        <SettingsIcon style={{ fontSize: 18 }} />
      </IconButton>
    </>
  );

  const rightFilters = ({ classes: layout }) => (
    <>
      <div className={layout.filterItem} onClick={(e) => setAnchorResp(e.currentTarget)}>
        <Typography className={layout.filterLabel}>Responsável</Typography>
        <ExpandMoreIcon className={layout.chevronIcon} />
      </div>
      <Popover
        open={Boolean(anchorResp)}
        anchorEl={anchorResp}
        onClose={() => setAnchorResp(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <div style={{ padding: 16, width: 320 }}>
          <Autocomplete
            fullWidth
            value={selectedResponsible}
            options={usersList}
            onChange={(e, val) => setSelectedResponsible(val)}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => <TextField {...params} label="Responsável" variant="outlined" />}
          />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setSelectedResponsible(null)}>Limpar</Button>
          </div>
        </div>
      </Popover>

      <div className={layout.filterItem} onClick={(e) => setAnchorEmpresa(e.currentTarget)}>
        <Typography className={layout.filterLabel}>Empresa</Typography>
        <ExpandMoreIcon className={layout.chevronIcon} />
      </div>
      <Popover
        open={Boolean(anchorEmpresa)}
        anchorEl={anchorEmpresa}
        onClose={() => setAnchorEmpresa(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <div style={{ padding: 16, width: 320 }}>
          <Autocomplete
            fullWidth
            value={selectedCompany}
            options={contactsList}
            onChange={(e, val) => setSelectedCompany(val)}
            getOptionLabel={(option) => option.name || option.number || String(option.id)}
            renderInput={(params) => <TextField {...params} label="Empresa" variant="outlined" />}
          />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setSelectedCompany(null)}>Limpar</Button>
          </div>
        </div>
      </Popover>

      <div className={layout.filterItem} onClick={(e) => setAnchorPeriodo(e.currentTarget)}>
        <CalendarIcon className={layout.calendarIcon} />
        <Typography className={layout.filterLabel}>Período</Typography>
      </div>
      <Popover
        open={Boolean(anchorPeriodo)}
        anchorEl={anchorPeriodo}
        onClose={() => setAnchorPeriodo(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <div style={{ padding: 16, width: 320 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Início"
                type="date"
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Fim"
                type="date"
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </Grid>
          </Grid>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => { setDateStart(""); setDateEnd(""); }}>Limpar</Button>
            <Button color="primary" variant="contained" onClick={() => setAnchorPeriodo(null)}>Aplicar</Button>
          </div>
        </div>
      </Popover>

      <div className={layout.filterItem} onClick={(e) => setAnchorTodos(e.currentTarget)}>
        <Typography className={layout.filterLabel}>Todos</Typography>
        <ExpandMoreIcon className={layout.chevronIcon} />
      </div>
      <Popover
        open={Boolean(anchorTodos)}
        anchorEl={anchorTodos}
        onClose={() => setAnchorTodos(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <div style={{ padding: 16, width: 320 }}>
          <Typography variant="subtitle2" style={{ marginBottom: 8 }}>Período rápido</Typography>
          <Grid container spacing={1}>
            <Grid item>
              <Button size="small" onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 7);
                setDateStart(start.toISOString().slice(0,10));
                setDateEnd(end.toISOString().slice(0,10));
                setAnchorTodos(null);
              }}>Últimos 7 dias</Button>
            </Grid>
            <Grid item>
              <Button size="small" onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setMonth(end.getMonth() - 1);
                setDateStart(start.toISOString().slice(0,10));
                setDateEnd(end.toISOString().slice(0,10));
                setAnchorTodos(null);
              }}>Último mês</Button>
            </Grid>
            <Grid item>
              <Button size="small" onClick={() => {
                setDateStart("");
                setDateEnd("");
                setSelectedCompany(null);
                setSelectedResponsible(null);
                setAnchorTodos(null);
              }}>Todos os registros</Button>
            </Grid>
          </Grid>
        </div>
      </Popover>
    </>
  );

  return (
    <>
    <ActivitiesStyleLayout
      title={null}
      description="Gerencie suas tarefas e atividades"
      onCreateClick={handleCreateActivity}
      searchPlaceholder="Buscar atividades..."
      searchValue={searchParam}
      onSearchChange={handleSearch}
      filters={filters}
      stats={[]}
      navActions={actionsRight}
      viewModes={viewModes}
      currentViewMode={viewMode}
      onViewModeChange={setViewMode}
      rightFilters={rightFilters}
    >
      {loading ? (
        <div style={{ padding: 20, textAlign: "center" }}>Carregando...</div>
      ) : (
        <>
          {viewMode === "list" && <ActivitiesList activities={filteredActivities} />}
          {viewMode === "calendar" && <ActivitiesCalendar activities={filteredActivities} />}
          {viewMode === "board" && (
            <div ref={kanbanRef} style={{ height: '100%', width: '100%' }}>
              <KanbanBoard
                activities={filteredActivities}
                onActivityClick={(activity) => {
                  setSelectedActivity(activity);
                  setDetailsOpen(true);
                }}
                onMove={async (activityId, sourceCol, destCol) => {
                  if (sourceCol === destCol) return;
                  const id = Number(activityId);
                  const map = {
                    backlog: 'backlog',
                    pending: 'pending',
                    in_progress: 'in_progress',
                    completed: 'completed'
                  };
                  const newStatus = map[destCol] || destCol;
                  setActivitiesState(prev => {
                    const next = prev.map(a => a.id === id ? { ...a, status: newStatus } : a);
                    return next;
                  });
                  try {
                    await activitiesService.update(id, { status: newStatus });
                  } catch (err) {
                    toastError(err);
                  }
                }}
                onDelete={async (activity) => {
                  const id = Number(activity.id);
                  try {
                    await activitiesService.delete(id);
                    setActivitiesState(prev => prev.filter(a => a.id !== id));
                    toast.success("Atividade excluída.");
                  } catch (err) {
                    toastError(err);
                  }
                }}
                onAdd={() => handleCreateActivity()}
              />
            </div>
          )}
        </>
      )}
    </ActivitiesStyleLayout>

    <ActivityDetailsModal
      open={detailsOpen}
      onClose={() => setDetailsOpen(false)}
      activity={selectedActivity}
      onEdit={(activity) => {
        setActivityToEdit(activity);
        setDetailsOpen(false);
        setDrawerOpen(true);
      }}
      onDelete={async (activity) => {
        const id = Number(activity.id);
        try {
          await activitiesService.delete(id);
          setActivitiesState(prev => prev.filter(a => a.id !== id));
          setDetailsOpen(false);
          toast.success("Atividade excluída.");
        } catch (err) {
          toastError(err);
        }
      }}
    />

    <CreateActivityModal
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      activity={activityToEdit}
      onSave={(savedActivity) => {
         setActivitiesState((prev) => {
             // Garante que o ID da atividade salva seja um número para comparação consistente
             const savedId = Number(savedActivity.id);
             
             // Procura se já existe uma atividade com esse ID
             const exists = prev.some(a => Number(a.id) === savedId);
             
             if (exists) {
                 // Se existe, atualiza o item no array
                 return prev.map(a => Number(a.id) === savedId ? savedActivity : a);
             } else {
                 // Se não existe, adiciona no início
                 return [savedActivity, ...prev];
             }
         });
         // Reseta o estado de edição para evitar conflitos futuros
         setActivityToEdit(null);
      }}
    />
    </>
  );
};

export default Activities;
