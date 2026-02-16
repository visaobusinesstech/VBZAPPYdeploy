import React, { useState, useEffect, useMemo, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  List as ListIcon,
  CalendarToday as CalendarIcon,
  ViewWeek as KanbanIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Settings as SettingsIcon
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
  IconButton
} from "@material-ui/core";

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import ActivitiesStyleLayout from "../../components/ActivitiesStyleLayout";
import KanbanBoard from "../../components/KanbanBoard";
import ActivityDetailsModal from "../../components/ActivityDetailsModal";
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
                <TableCell>{activity.type}</TableCell>
                <TableCell>{activity.date}</TableCell>
                <TableCell>
                  <Chip 
                    label={activity.status} 
                    size="small" 
                    color={activity.status === 'completed' ? 'primary' : 'default'} 
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

  return (
    <div style={{ height: 'calc(100vh - 200px)', backgroundColor: '#fff', padding: 16 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
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
  const [activitiesState, setActivitiesState] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const kanbanRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    type: "task",
    date: "",
    status: "pending",
  });
  
  // Use existing hook
  const { activities, loading, count, hasMore } = useActivities({
    searchParam,
    pageNumber
  });

  useEffect(() => {
    setActivitiesState(activities);
  }, [activities]);

  const handleSearch = (value) => {
    setSearchParam(value);
  };

  const handleCreateActivity = () => {
    setFormValues({
      title: "",
      description: "",
      type: "task",
      date: "",
      status: "pending",
    });
    setDrawerOpen(true);
  };

  const handleChangeField = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formValues.title || !formValues.date) {
      toast.error("Preencha título e data da atividade.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formValues,
      };
      const created = await activitiesService.create(payload);
      setActivitiesState((prev) => [created, ...prev]);
      setDrawerOpen(false);
      toast.success("Atividade criada com sucesso.");
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
    }
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
        {isFullscreen ? <FullscreenExitIcon style={{ fontSize: 18 }} /> : <FullscreenIcon style={{ fontSize: 18 }} />}
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

    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      ModalProps={{ keepMounted: true }}
      PaperProps={{ className: classes.drawerPaper }}
    >
      <form onSubmit={handleSubmit} className={classes.drawerContainer}>
        <div className={classes.drawerHeader}>
          <Typography variant="h6" className={classes.drawerTitle}>
            Nova atividade
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </div>

        <div className={classes.drawerContent}>
          <TextField
            label="Título"
            value={formValues.title}
            onChange={handleChangeField("title")}
            fullWidth
            required
            variant="outlined"
          />

          <TextField
            label="Descrição"
            value={formValues.description}
            onChange={handleChangeField("description")}
            fullWidth
            multiline
            minRows={3}
            variant="outlined"
          />

          <FormControl variant="outlined" fullWidth>
            <InputLabel id="activity-type-label">Tipo</InputLabel>
            <Select
              labelId="activity-type-label"
              label="Tipo"
              value={formValues.type}
              onChange={handleChangeField("type")}
            >
              <MenuItem value="task">Tarefa</MenuItem>
              <MenuItem value="call">Ligação</MenuItem>
              <MenuItem value="email">E-mail</MenuItem>
              <MenuItem value="meeting">Reunião</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Data"
            type="date"
            value={formValues.date}
            onChange={handleChangeField("date")}
            InputLabelProps={{ shrink: true }}
            fullWidth
            variant="outlined"
            required
          />

          <FormControl variant="outlined" fullWidth>
            <InputLabel id="activity-status-label">Status</InputLabel>
            <Select
              labelId="activity-status-label"
              label="Status"
              value={formValues.status}
              onChange={handleChangeField("status")}
            >
              <MenuItem value="pending">Pendente</MenuItem>
              <MenuItem value="in_progress">Em Progresso</MenuItem>
              <MenuItem value="completed">Concluído</MenuItem>
            </Select>
          </FormControl>
        </div>

        <div className={classes.drawerActions}>
          <Button onClick={() => setDrawerOpen(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Drawer>
    </>
  );
};

export default Activities;
