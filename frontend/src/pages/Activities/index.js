import React, { useState, useEffect, useMemo } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  BarChart as BarChartIcon,
  List as ListIcon,
  CalendarToday as CalendarIcon,
  ViewWeek as KanbanIcon,
  Add as AddIcon,
  Search as SearchIcon
} from "@material-ui/icons";
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip
} from "@material-ui/core";

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import ActivitiesStyleLayout from "../../components/ActivitiesStyleLayout";
import KanbanBoard from "../../components/KanbanBoard";
import useActivities from "../../hooks/useActivities";
import { i18n } from "../../translate/i18n";

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
}));

// Sub-component for Dashboard View
const ActivitiesDashboard = ({ activities }) => {
  const classes = useStyles();
  
  const stats = useMemo(() => {
    const total = activities.length;
    const pending = activities.filter(a => a.status === 'pending' || a.status === 'A Fazer').length;
    const inProgress = activities.filter(a => a.status === 'in_progress' || a.status === 'Em Progresso').length;
    const completed = activities.filter(a => a.status === 'completed' || a.status === 'Concluído').length;
    
    return [
      { label: "Total", value: total },
      { label: "Pendentes", value: pending },
      { label: "Em Progresso", value: inProgress },
      { label: "Concluídas", value: completed },
    ];
  }, [activities]);

  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card className={classes.dashboardCard}>
            <Typography className={classes.cardValue}>{stat.value}</Typography>
            <Typography className={classes.cardLabel}>{stat.label}</Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
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
  const [viewMode, setViewMode] = useState("board"); // Default to board (Quadro)
  const [searchParam, setSearchParam] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  
  // Use existing hook
  const { activities, loading, count, hasMore } = useActivities({
    searchParam,
    pageNumber
  });

  const handleSearch = (value) => {
    setSearchParam(value);
  };

  const handleCreateActivity = () => {
    // Implement creation logic or open modal
    console.log("Create activity clicked");
  };

  const viewModes = [
    { value: "dashboard", label: "Dashboard", icon: <BarChartIcon /> },
    { value: "list", label: "Lista", icon: <ListIcon /> },
    { value: "calendar", label: "Calendário", icon: <CalendarIcon /> },
    { value: "board", label: "Quadro", icon: <KanbanIcon /> },
  ];

  // Filters placeholder
  const filters = [
    {
      label: "Status",
      value: "",
      options: [
        { value: "pending", label: "Pendente" },
        { value: "in_progress", label: "Em Progresso" },
        { value: "completed", label: "Concluído" },
      ],
      onChange: (val) => console.log("Status filter:", val)
    }
  ];

  // Calculate quick stats for the header
  const headerStats = useMemo(() => {
    const total = activities.length;
    const completed = activities.filter(a => a.status === 'completed' || a.status === 'Concluído').length;
    return [
      { label: "Total", value: total, color: "#2563eb" },
      { label: "Concluídas", value: completed, color: "#22c55e" }
    ];
  }, [activities]);

  return (
    <ActivitiesStyleLayout
      title={null}
      description="Gerencie suas tarefas e atividades"
      onCreateClick={handleCreateActivity}
      searchPlaceholder="Buscar atividades..."
      searchValue={searchParam}
      onSearchChange={handleSearch}
      filters={filters}
      stats={headerStats}
      viewModes={viewModes}
      currentViewMode={viewMode}
      onViewModeChange={setViewMode}
    >
      {loading ? (
        <div style={{ padding: 20, textAlign: "center" }}>Carregando...</div>
      ) : (
        <>
          {viewMode === "dashboard" && <ActivitiesDashboard activities={activities} />}
          {viewMode === "list" && <ActivitiesList activities={activities} />}
          {viewMode === "calendar" && <ActivitiesCalendar activities={activities} />}
          {viewMode === "board" && <KanbanBoard activities={activities} />}
        </>
      )}
    </ActivitiesStyleLayout>
  );
};

export default Activities;
