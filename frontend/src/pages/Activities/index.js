// Re-saved
import React, { useState, useEffect, useMemo, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  List as ListIcon,
  CalendarToday as CalendarIcon,
  ViewWeek as KanbanIcon,
  Dashboard as DashboardIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon, // Mantendo import original se precisar reverter
  FullscreenExit as FullscreenExitIcon,
  Settings as SettingsIcon,
  ZoomOutMap as ZoomOutMapIcon,
  ExpandMore as ExpandMoreIcon,
  EventNote as EventNoteIcon
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
import "../Schedules/Schedules.css";
import "moment/locale/pt-br";

import ActivitiesStyleLayout from "../../components/ActivitiesStyleLayout";
import KanbanBoard from "../../components/KanbanBoard";
import ActivityDetailsModal from "../../components/ActivityDetailsModal";
import CreateActivityModal from "../../components/CreateActivityModal";
import useActivities from "../../hooks/useActivities";
import { toast } from "react-toastify";
import toastError from "../../errors/toastError";
import activitiesService from "../../services/activitiesService";
import activityStagesService from "../../services/activityStagesService";

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

const defaultActivityStages = [
  { key: 'backlog', label: 'Backlog', color: '#4B5563' },
  { key: 'pending', label: 'Pendente', color: '#4B5563' },
  { key: 'in_progress', label: 'Em Progresso', color: '#F97316' },
  { key: 'completed', label: 'Concluído', color: '#10B981' }
];

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

// Sub-component for Calendar View – layout equivalente a /schedules
const ActivitiesCalendar = ({ activities, onCreate }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const MiniMonth = ({ value, onChange }) => {
    const m = moment(value);
    const start = m.clone().startOf("month").startOf("week");
    const end = m.clone().endOf("month").endOf("week");
    const day = start.clone().subtract(1, "day");
    const days = [];
    while (day.isBefore(end, "day")) days.push(day.add(1, "day").clone());
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return (
      <div className="mini-cal">
        <div className="mini-cal-grid">
          {["D","S","T","Q","Q","S","S"].map((d,i) => <div key={i} className="mini-cal-header">{d}</div>)}
          {weeks.flat().map((d, idx) => {
            const isCurrentMonth = d.month() === m.month();
            const isToday = d.isSame(moment(), "day");
            const isSelected = d.isSame(m, "day");
            const cls = ["mini-cal-day", !isCurrentMonth ? "mini-cal-off" : "", isToday ? "mini-cal-today" : "", isSelected ? "mini-cal-selected" : ""].join(" ");
            return <button key={idx} type="button" className={cls} onClick={() => onChange(d.toDate())}>{d.date()}</button>;
          })}
        </div>
      </div>
    );
  };
  const CustomToolbar = (toolbarProps) => {
    const setView = (v) => toolbarProps.onView(v);
    const goToday = () => toolbarProps.onNavigate("TODAY");
    const goPrev = () => toolbarProps.onNavigate("PREV");
    const goNext = () => toolbarProps.onNavigate("NEXT");
    const monthRaw = moment(toolbarProps.date).format("MMMM, YYYY");
    const label = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);
    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" className="btn-naked" onClick={goToday}>Hoje</button>
        </span>
        <span className="rbc-toolbar-label">
          <button type="button" className="btn-naked chevron" onClick={goPrev}>‹</button>
          <span className="month-label">{label}</span>
          <button type="button" className="btn-naked chevron" onClick={goNext}>›</button>
        </span>
        <span className="rbc-btn-group">
          <button type="button" className={`btn-naked ${toolbarProps.view === "day" ? "active" : ""}`} onClick={() => setView("day")}>Dia</button>
          <button type="button" className={`btn-naked ${toolbarProps.view === "week" ? "active" : ""}`} onClick={() => setView("week")}>Semana</button>
          <button type="button" className={`btn-naked ${toolbarProps.view === "month" ? "active" : ""}`} onClick={() => setView("month")}>Mês</button>
        </span>
      </div>
    );
  };
  const events = useMemo(() => {
    return activities.map(a => ({
      title: a.title,
      start: new Date(a.date),
      end: new Date(a.date),
      allDay: true,
      resource: a
    }));
  }, [activities]);
  const eventPropGetter = (event) => {
    const now = new Date();
    const start = new Date(event.start);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const isPast = eventDate < today;
    const isToday = eventDate.getTime() === today.getTime();
    const status = String(event.resource.status || "").toLowerCase();
    let style = { backgroundColor: "#DBEAFE", border: "1px solid #BFDBFE", color: "#1E40AF", borderRadius: 10, padding: "6px 8px", fontSize: 12 };
    if (status === "completed" || status === "concluído") style = { backgroundColor: "#D1FAE5", border: "1px solid #A7F3D0", color: "#065F46", borderRadius: 10, padding: "6px 8px", fontSize: 12 };
    else if (isPast) style = { backgroundColor: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", borderRadius: 10, padding: "6px 8px", fontSize: 12 };
    else if (isToday) style = { backgroundColor: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E", borderRadius: 10, padding: "6px 8px", fontSize: 12 };
    return { style };
  };
  const total = activities.length;
  const conclu = activities.filter(a => String(a.status).toLowerCase() === "completed").length;
  return (
    <div className="schedules-page" style={{ paddingTop: 8 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={9} lg={9}>
          <Paper style={{ padding: 8 }}>
            <Calendar
              localizer={localizer}
              components={{ toolbar: CustomToolbar }}
              views={["day","week","month"]}
              events={events}
              startAccessor="start"
              endAccessor="end"
              eventPropGetter={eventPropGetter}
              selectable
              onSelectSlot={(slot) => {
                setSelectedDate(slot.start);
                onCreate && onCreate();
              }}
              style={{ height: "calc(100vh - 160px)" }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={3} lg={3}>
          <div className="right-aside">
            <div className="aside-top-actions">
              <button className="aside-action" onClick={onCreate}>Criar Atividade</button>
            </div>
            <Paper className="aside-card mini-calendar-card" variant="outlined">
              <div className="aside-header">
                <Typography className="aside-month" variant="body2">
                  {moment(selectedDate).format("MMMM, YYYY")}
                </Typography>
              </div>
              <div className="aside-body">
                <MiniMonth value={selectedDate} onChange={setSelectedDate} />
              </div>
            </Paper>
            <Paper className="aside-card activity-card" variant="outlined">
              <div className="aside-header">
                <Typography className="aside-title" variant="body2">Atividade</Typography>
              </div>
              {(() => {
                const recent = [...activities].sort((a,b) => new Date(b.date) - new Date(a.date))[0];
                return (
                  <div className="activity-item">
                    <div className="activity-icon"><EventNoteIcon style={{ fontSize: 18 }} /></div>
                    <div className="activity-info">
                      <div className="activity-title">{recent?.title || "—"}</div>
                      <div className="activity-sub">{recent?.type || "—"}</div>
                    </div>
                    <div className="activity-time">{recent ? moment(recent.date).format("HH:mm") : "—"}</div>
                  </div>
                );
              })()}
              <div className="donut-center" style={{ position: "static", transform: "none", textAlign: "left" }}>
                <div className="donut-total" style={{ fontSize: 24 }}>{total}</div>
                <div className="donut-label">Total</div>
                <div className="donut-label">Concluídas: {conclu}</div>
              </div>
            </Paper>
          </div>
        </Grid>
      </Grid>
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
  const [activityStagesState, setActivityStagesState] = useState([]);
  const [stagesDrawerOpen, setStagesDrawerOpen] = useState(false);
  const [localStages, setLocalStages] = useState([]);
  
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
    { value: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
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

  // Calculate quick stats for the header (exclui eventos)
  const headerStats = useMemo(() => {
    const base = activitiesState.filter(a => String(a.type || "").toLowerCase() !== "event");
    const total = base.length;
    const completed = base.filter(a => a.status === 'completed' || a.status === 'Concluído').length;
    return [
      { label: "Total", value: total, color: "#2563eb" },
      { label: "Concluídas", value: completed, color: "#22c55e" }
    ];
  }, [activitiesState]);

  const filteredActivities = useMemo(() => {
    const base = activitiesState.filter(a => String(a.type || "").toLowerCase() !== "event");
    if (!statusFilter) return base;
    return base.filter((activity) => activity.status === statusFilter);
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

  useEffect(() => {
    let mounted = true;
    const loadStages = async () => {
      try {
        const list = await activityStagesService.list();
        if (mounted && Array.isArray(list) && list.length) {
          setActivityStagesState(list);
        }
      } catch (_) {
        // silencioso
      }
    };
    loadStages();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (stagesDrawerOpen) {
      const base = activityStagesState.length ? activityStagesState : defaultActivityStages;
      // deep clone
      setLocalStages(JSON.parse(JSON.stringify(base)));
    }
  }, [stagesDrawerOpen, activityStagesState]);

  const addStage = () => {
    const idx = (localStages?.length || 0) + 1;
    const key = `etapa_${idx}`;
    setLocalStages(prev => [...prev, { key, label: `Etapa ${idx}`, color: "#4B5563" }]);
  };
  const removeStage = (key) => setLocalStages(prev => prev.filter(s => s.key !== key));
  const updateStage = (i, field, value) => {
    setLocalStages(prev => {
      const next = prev.slice();
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

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
        onClick={() => setStagesDrawerOpen(true)}
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
          {viewMode === "dashboard" && (
            <Grid container spacing={2} style={{ height: '100%', margin: 0 }}>
              {(() => {
                const total = filteredActivities.length;
                const counts = {
                  backlog: filteredActivities.filter(a => String(a.status).toLowerCase() === 'backlog').length,
                  pending: filteredActivities.filter(a => String(a.status).toLowerCase() === 'pending').length,
                  in_progress: filteredActivities.filter(a => String(a.status).toLowerCase() === 'in_progress').length,
                  completed: filteredActivities.filter(a => String(a.status).toLowerCase() === 'completed').length,
                };
                const cards = [
                  { label: 'Total', value: total, color: '#2563eb' },
                  { label: 'Pendentes', value: counts.pending, color: '#f59e0b' },
                  { label: 'Em progresso', value: counts.in_progress, color: '#3b82f6' },
                  { label: 'Concluídas', value: counts.completed, color: '#10b981' },
                ];
                return cards.map((c) => (
                  <Grid item xs={12} sm={6} md={3} key={c.label}>
                    <Paper className={classes.dashboardCard} elevation={1}>
                      <div className={classes.cardValue} style={{ color: c.color }}>{c.value}</div>
                      <div className={classes.cardLabel}>{c.label}</div>
                    </Paper>
                  </Grid>
                ));
              })()}
            </Grid>
          )}
          {viewMode === "list" && <ActivitiesList activities={filteredActivities} />}
          {viewMode === "calendar" && <ActivitiesCalendar activities={filteredActivities} onCreate={handleCreateActivity} />}
          {viewMode === "board" && (
            <div ref={kanbanRef} style={{ height: '100%', width: '100%' }}>
              <KanbanBoard
                columns={(activityStagesState.length ? activityStagesState : defaultActivityStages).map(s => ({ id: s.key, title: s.label, color: s.color }))}
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

    <Drawer
      anchor="right"
      open={stagesDrawerOpen}
      onClose={() => setStagesDrawerOpen(false)}
      classes={{ paper: classes.drawerPaper }}
    >
      <div className={classes.drawerContainer}>
        <div className={classes.drawerHeader}>
          <Typography className={classes.drawerTitle}>Configure seu Kanban</Typography>
          <IconButton onClick={() => setStagesDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </div>
        <div className={classes.drawerContent}>
          <Typography variant="caption" style={{ color: "#374151" }}>Etapas</Typography>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {localStages.map((st, idx) => (
              <div key={st.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="color"
                  value={st.color || "#4B5563"}
                  onChange={(e) => updateStage(idx, "color", e.target.value)}
                  aria-label="Cor"
                  style={{ width: 44, height: 40, padding: 0, border: "1px solid #E5E7EB", borderRadius: 6, background: "transparent" }}
                />
                <TextField
                  label="Rótulo"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={st.label}
                  onChange={(e) => updateStage(idx, "label", e.target.value)}
                />
                <TextField
                  label="Chave (status)"
                  variant="outlined"
                  size="small"
                  value={st.key}
                  onChange={(e) => updateStage(idx, "key", e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                  style={{ width: 160 }}
                />
                <Button onClick={() => removeStage(st.key)}>Remover</Button>
              </div>
            ))}
            <div>
              <Button color="primary" variant="outlined" onClick={addStage}>Adicionar etapa</Button>
            </div>
          </div>
        </div>
        <div className={classes.drawerActions}>
          <Button onClick={() => setStagesDrawerOpen(false)} variant="outlined">Cancelar</Button>
          <Button
            color="primary"
            variant="contained"
            onClick={async () => {
              try {
                const saved = await activityStagesService.bulkSave(localStages);
                setActivityStagesState(saved);
                setStagesDrawerOpen(false);
              } catch (err) {
                toastError(err);
              }
            }}
          >
            Salvar
          </Button>
        </div>
      </div>
    </Drawer>
    </>
  );
};

export default Activities;
