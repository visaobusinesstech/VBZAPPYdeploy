import React, { useState, useEffect, useMemo, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  List as ListIcon,
  CalendarToday as CalendarIcon,
  ViewWeek as KanbanIcon,
  Dashboard as DashboardIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Settings as SettingsIcon,
  ZoomOutMap as ZoomOutMapIcon
} from "@material-ui/icons";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Popover,
  Grid,
  TextField,
  Button,
  Typography
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import "../Schedules/Schedules.css";
import "moment/locale/pt-br";

import ActivitiesStyleLayout from "../../components/ActivitiesStyleLayout";
import ProjectKanbanBoard from "../../components/ProjectKanbanBoard"; // Novo componente
import ProjectDetailsModal from "../../components/ProjectDetailsModal"; // Novo componente
import CreateProjectModal from "../../components/CreateProjectModal"; // Novo componente
import useProjects from "../../hooks/useProjects"; // Novo hook
import { toast } from "react-toastify";
import toastError from "../../errors/toastError";
import projectsService from "../../services/projectsService"; // Novo serviço

const localizer = momentLocalizer(moment);

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    height: "100%",
    overflow: "hidden",
  },
}));

// Sub-component for List View
const ProjectsList = ({ projects }) => {
  return (
    <TableContainer component={Paper} style={{ height: '100%', overflow: 'auto' }}>
      <Table stickyHeader aria-label="projects table">
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Descrição</TableCell>
            <TableCell>Empresa</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Criado em</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.length > 0 ? (
            projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell component="th" scope="row">
                  {project.name}
                </TableCell>
                <TableCell>{project.description}</TableCell>
                <TableCell>{project.company ? project.company.name : project.companyId}</TableCell>
                <TableCell>
                  <Chip 
                    label={project.status === 'active' ? 'Ativo' : project.status === 'completed' ? 'Concluído' : 'Arquivado'} 
                    size="small" 
                    color={project.status === 'active' ? 'primary' : 'default'} 
                  />
                </TableCell>
                <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center">
                Nenhum projeto encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Sub-component for Calendar View – com layout /schedules
const ProjectsCalendar = ({ projects, onCreate }) => {
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
    return projects.map(p => ({
      title: p.name,
      start: new Date(p.deadlineAt || p.createdAt),
      end: new Date(p.deadlineAt || p.createdAt),
      allDay: true,
      resource: p
    }));
  }, [projects]);
  const eventPropGetter = (event) => {
    const status = String(event.resource.status || "").toLowerCase();
    let style = { backgroundColor: "#DBEAFE", border: "1px solid #BFDBFE", color: "#1E40AF", borderRadius: 10, padding: "6px 8px", fontSize: 12 };
    if (status === "completed") style = { backgroundColor: "#D1FAE5", border: "1px solid #A7F3D0", color: "#065F46", borderRadius: 10, padding: "6px 8px", fontSize: 12 };
    if (status === "archived") style = { backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB", color: "#374151", borderRadius: 10, padding: "6px 8px", fontSize: 12 };
    return { style };
  };
  const total = projects.length;
  const concluded = projects.filter(p => String(p.status).toLowerCase() === "completed").length;
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
              <button className="aside-action" onClick={onCreate}>Novo Projeto</button>
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
                <Typography className="aside-title" variant="body2">Projeto</Typography>
              </div>
              {(() => {
                const recent = [...projects].sort((a,b) => new Date(b.updatedAt||b.createdAt) - new Date(a.updatedAt||a.createdAt))[0];
                return (
                  <div className="activity-item">
                    <div className="activity-icon">📁</div>
                    <div className="activity-info">
                      <div className="activity-title">{recent?.name || "—"}</div>
                      <div className="activity-sub">{recent?.company?.name || recent?.companyId || "Sem empresa"}</div>
                    </div>
                    <div className="activity-time">{recent ? moment(recent.updatedAt||recent.createdAt).format("HH:mm") : "—"}</div>
                  </div>
                );
              })()}
              <div className="donut-center" style={{ position: "static", transform: "none", textAlign: "left" }}>
                <div className="donut-total" style={{ fontSize: 24 }}>{total}</div>
                <div className="donut-label">Total</div>
                <div className="donut-label">Concluídos: {concluded}</div>
              </div>
            </Paper>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

const Projects = () => {
  const classes = useStyles();
  const [viewMode, setViewMode] = useState("board");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [anchorResp, setAnchorResp] = useState(null);
  const [anchorEmpresa, setAnchorEmpresa] = useState(null);
  const [anchorPeriodo, setAnchorPeriodo] = useState(null);
  const [anchorTodos, setAnchorTodos] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [contactsList, setContactsList] = useState([]);
  const [selectedResponsible, setSelectedResponsible] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [projectsState, setProjectsState] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const kanbanRef = useRef(null);
  
  const { projects, loading, count, hasMore } = useProjects({
    searchParam,
    pageNumber
  });

  useEffect(() => {
    setProjectsState(projects);
  }, [projects]);

  const handleSearch = (value) => {
    setSearchParam(value);
  };

  const handleCreateProject = () => {
    setProjectToEdit(null);
    setDrawerOpen(true);
  };

  const viewModes = [
    { value: "board", label: "Quadro", icon: <KanbanIcon /> },
    { value: "list", label: "Lista", icon: <ListIcon /> },
    { value: "calendar", label: "Calendário", icon: <CalendarIcon /> },
    { value: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  ];

  const filters = [
    {
      label: "Status",
      value: statusFilter,
      options: [
        { value: "active", label: "Ativo" },
        { value: "completed", label: "Concluído" },
        { value: "archived", label: "Arquivado" },
      ],
      onChange: (val) => setStatusFilter(val)
    }
  ];

  const headerStats = useMemo(() => {
    const total = projectsState.length;
    const completed = projectsState.filter(p => p.status === 'completed').length;
    return [
      { label: "Total", value: total, color: "#2563eb" },
      { label: "Concluídos", value: completed, color: "#22c55e" }
    ];
  }, [projectsState]);

  const filteredProjects = useMemo(() => {
    if (!statusFilter) {
      return projectsState;
    }
    return projectsState.filter((project) => project.status === statusFilter);
  }, [projectsState, statusFilter]);

  // Fullscreen logic (mesma de Activities)
  useEffect(() => {
    // carregar opções de filtros (Responsável/Empresa)
    async function fetchFilters() {
      try {
        const { data: usersResp } = await projectsService.getUsers ? await projectsService.getUsers() : { data: [] };
        if (Array.isArray(usersResp)) setUsersList(usersResp);
      } catch (_) {}
      try {
        // não existe um service específico de contatos aqui; manter vazio por ora
        setContactsList([]);
      } catch (_) {}
    }
    fetchFilters();

    const onFsChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      setIsFullscreen(!!fsEl && (fsEl === kanbanRef.current));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, []);

  const requestFs = (el) => {
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  };

  const exitFs = () => {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
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
            getOptionLabel={(option) => option.name || option.email || String(option.id)}
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
                setSelectedResponsible(null);
                setSelectedCompany(null);
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
      description="Gerencie seus projetos"
      onCreateClick={handleCreateProject}
      searchPlaceholder="Buscar projetos..."
      searchValue={searchParam}
      onSearchChange={handleSearch}
      filters={filters}
      stats={[]} // headerStats removido se quiser clean igual ao layout novo
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
                const total = projectsState.length;
                const completed = projectsState.filter(p => String(p.status).toLowerCase() === 'completed').length;
                const active = projectsState.filter(p => String(p.status).toLowerCase() === 'active').length;
                const archived = projectsState.filter(p => String(p.status).toLowerCase() === 'archived').length;
                const cards = [
                  { label: 'Total', value: total, color: '#2563eb' },
                  { label: 'Ativos', value: active, color: '#3b82f6' },
                  { label: 'Concluídos', value: completed, color: '#10b981' },
                  { label: 'Arquivados', value: archived, color: '#6b7280' },
                ];
                return cards.map((c) => (
                  <Grid item xs={12} sm={6} md={3} key={c.label}>
                    <Paper style={{ padding: 16, textAlign: 'center', borderRadius: 12 }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: c.color }}>{c.value}</div>
                      <div style={{ color: '#6b7280' }}>{c.label}</div>
                    </Paper>
                  </Grid>
                ));
              })()}
            </Grid>
          )}
          {viewMode === "list" && <ProjectsList projects={filteredProjects} />}
          {viewMode === "calendar" && <ProjectsCalendar projects={filteredProjects} onCreate={handleCreateProject} />}
          {viewMode === "board" && (
            <div ref={kanbanRef} style={{ height: '100%', width: '100%' }}>
              <ProjectKanbanBoard
                projects={filteredProjects}
                onProjectClick={(project) => {
                  setSelectedProject(project);
                  setDetailsOpen(true);
                }}
                onMove={async (projectId, sourceCol, destCol) => {
                  if (sourceCol === destCol) return;
                  const id = Number(projectId);
                  // Mapeamento reverso se necessário, mas aqui colunas == status
                  const newStatus = destCol;
                  
                  setProjectsState(prev => {
                    const next = prev.map(p => p.id === id ? { ...p, status: newStatus } : p);
                    return next;
                  });
                  try {
                    await projectsService.update(id, { status: newStatus });
                  } catch (err) {
                    toastError(err);
                  }
                }}
                onDelete={async (project) => {
                  const id = Number(project.id);
                  try {
                    await projectsService.delete(id);
                    setProjectsState(prev => prev.filter(p => p.id !== id));
                    toast.success("Projeto excluído.");
                  } catch (err) {
                    toastError(err);
                  }
                }}
                onAdd={() => handleCreateProject()}
              />
            </div>
          )}
        </>
      )}
    </ActivitiesStyleLayout>

    <ProjectDetailsModal
      open={detailsOpen}
      onClose={() => setDetailsOpen(false)}
      project={selectedProject}
      onEdit={(project) => {
        setProjectToEdit(project);
        setDetailsOpen(false);
        setDrawerOpen(true);
      }}
      onDelete={async (project) => {
        const id = Number(project.id);
        try {
          await projectsService.delete(id);
          setProjectsState(prev => prev.filter(p => p.id !== id));
          setDetailsOpen(false);
          toast.success("Projeto excluído.");
        } catch (err) {
          toastError(err);
        }
      }}
    />

    <CreateProjectModal
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      project={projectToEdit}
      onSave={(savedProject) => {
         setProjectsState((prev) => {
             const savedId = Number(savedProject.id);
             const exists = prev.some(p => Number(p.id) === savedId);
             if (exists) {
                 return prev.map(p => Number(p.id) === savedId ? savedProject : p);
             } else {
                 return [savedProject, ...prev];
             }
         });
         setProjectToEdit(null);
      }}
    />
    </>
  );
};

export default Projects;
