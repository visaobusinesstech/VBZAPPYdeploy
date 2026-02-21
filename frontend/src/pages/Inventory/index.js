import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { useTranslation } from "react-i18next";
import {
  Dashboard as DashboardIcon,
  List as ListIcon,
  CalendarToday as CalendarIcon,
} from "@material-ui/icons";
import KanbanIcon from "@mui/icons-material/ViewKanban";

import MainContainer from "../../components/MainContainer";
import InternalNavbar from "../../components/InternalNavbar";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import { Button, CircularProgress } from "@material-ui/core";
import api from "../../services/api";
import { toast } from "react-toastify";
import useInventory from "../../hooks/useInventory";

// Placeholders for views
import { Grid, Paper, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@material-ui/core";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const InventoryBoard = ({ data, loading }) => {
  if (loading) return <CircularProgress />;
  
  return (
    <Grid container spacing={2} style={{ height: '100%', overflowX: 'auto', flexWrap: 'nowrap' }}>
      {['Em Estoque', 'Baixo Estoque', 'Sem Estoque'].map((status) => (
        <Grid item xs={12} sm={6} md={4} key={status} style={{ minWidth: 300 }}>
          <Paper style={{ height: '100%', padding: 16, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom style={{ color: '#333' }}>
              {status}
            </Typography>
            {data && data.length > 0 ? (
                data.filter(item => item.status === status).map(item => (
                    <Card key={item.id} style={{ marginBottom: 8 }}>
                        <CardContent>
                        <Typography variant="subtitle1">{item.name || "Sem nome"}</Typography>
                        <Typography variant="body2" color="textSecondary">Qtd: {item.quantity || 0}</Typography>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div style={{ padding: 10, textAlign: "center", color: "#999" }}>
                    Vazio
                </div>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

const InventoryList = ({ data, loading }) => {
    if (loading) return <CircularProgress />;
    
    return (
        <TableContainer component={Paper}>
            <Table>
            <TableHead>
                <TableRow>
                <TableCell>Produto</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Quantidade</TableCell>
                <TableCell>Preço</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {data && data.length > 0 ? (
                    data.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.status}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.price}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} align="center">Nenhum produto encontrado</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </TableContainer>
    );
};

const InventoryCalendar = ({ data }) => {
  const events = (Array.isArray(data) ? data : []).map((item) => {
    const when = item.nextRestockAt || item.updatedAt || item.createdAt || item.date || Date.now();
    return {
      title: item.name || "Item",
      start: new Date(when),
      end: new Date(when),
      allDay: true,
      resource: item,
    };
  });
  const eventPropGetter = (evt) => {
    const status = String(evt?.resource?.status || "").toLowerCase();
    let backgroundColor = "#2563eb";
    if (status.includes("sem estoque") || status.includes("no stock") || status.includes("out")) backgroundColor = "#ef4444";
    if (status.includes("baixo") || status.includes("low")) backgroundColor = "#f59e0b";
    if (status.includes("em estoque") || status.includes("in stock") || status.includes("ok")) backgroundColor = "#10b981";
    return { style: { backgroundColor, color: "#fff", borderRadius: 6, border: 0 } };
  };
  return (
    <div style={{ height: "calc(100vh - 200px)", backgroundColor: "#fff", padding: 16 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["day", "week", "month"]}
        eventPropGetter={eventPropGetter}
        style={{ height: "100%" }}
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
          noEventsInRange: "Não há eventos neste período.",
        }}
      />
    </div>
  );
};

const InventoryDashboard = ({ count }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={4}>
      <Paper style={{ padding: 16, textAlign: 'center' }}>
        <Typography variant="h4" color="primary">{count || 0}</Typography>
        <Typography variant="subtitle1">Total de Itens</Typography>
      </Paper>
    </Grid>
    <Grid item xs={12} sm={4}>
      <Paper style={{ padding: 16, textAlign: 'center' }}>
        <Typography variant="h4" style={{ color: '#f50057' }}>0</Typography>
        <Typography variant="subtitle1">Sem Estoque</Typography>
      </Paper>
    </Grid>
    <Grid item xs={12} sm={4}>
      <Paper style={{ padding: 16, textAlign: 'center' }}>
        <Typography variant="h4" style={{ color: '#4caf50' }}>R$ 0,00</Typography>
        <Typography variant="subtitle1">Valor Total</Typography>
      </Paper>
    </Grid>
  </Grid>
);

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: theme.spacing(2),
  },
  content: {
    flex: 1,
    marginTop: theme.spacing(2),
    overflowY: "auto",
  },
}));

const Inventory = () => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("board");
  
  const { inventory, loading, count } = useInventory({
      pageNumber: 1,
      searchParam: ""
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: "Dashboard", value: "dashboard", icon: <DashboardIcon /> },
    { label: "Kanban", value: "board", icon: <KanbanIcon /> },
    { label: "Lista", value: "list", icon: <ListIcon /> },
    { label: "Calendário", value: "calendar", icon: <CalendarIcon /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <InventoryDashboard count={count} />;
      case "board":
        return <InventoryBoard data={inventory} loading={loading} />;
      case "list":
        return <InventoryList data={inventory} loading={loading} />;
      case "calendar":
        return <InventoryCalendar data={inventory} />;
      default:
        return <InventoryBoard data={inventory} loading={loading} />;
    }
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>Inventário</Title>
        <MainHeaderButtonsWrapper>
          <Button variant="contained" color="primary">Novo Item</Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      
      <div className={classes.root}>
        <InternalNavbar
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
        <div className={classes.content}>
          {renderContent()}
        </div>
      </div>
    </MainContainer>
  );
};

export default Inventory;
