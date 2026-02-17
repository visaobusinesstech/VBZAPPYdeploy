import React, { useState, useEffect, useMemo, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  List as ListIcon,
  CalendarToday as CalendarIcon,
  ViewWeek as KanbanIcon,
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
  IconButton
} from "@material-ui/core";

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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

// Sub-component for Calendar View
const ProjectsCalendar = ({ projects }) => {
  const events = useMemo(() => {
    return projects.map(p => ({
      title: p.name,
      start: new Date(p.createdAt), // Usando data de criação como referência
      end: new Date(p.createdAt),
      allDay: true,
      resource: p
    }));
  }, [projects]);

  const eventPropGetter = (event) => {
    const status = event.resource.status;
    let backgroundColor = '#2563eb';

    if (status === 'completed') {
      backgroundColor = '#10B981';
    } else if (status === 'archived') {
      backgroundColor = '#9CA3AF';
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

const Projects = () => {
  const classes = useStyles();
  const [viewMode, setViewMode] = useState("board");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
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
    >
      {loading ? (
        <div style={{ padding: 20, textAlign: "center" }}>Carregando...</div>
      ) : (
        <>
          {viewMode === "list" && <ProjectsList projects={filteredProjects} />}
          {viewMode === "calendar" && <ProjectsCalendar projects={filteredProjects} />}
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
