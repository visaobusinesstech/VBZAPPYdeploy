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
import useLeadsSales from "../../hooks/useLeadsSales";

// Placeholders for views
import { Grid, Paper, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@material-ui/core";

const LeadsBoard = ({ data, loading }) => {
  if (loading) return <CircularProgress />;
  
  return (
    <Grid container spacing={2} style={{ height: '100%', overflowX: 'auto', flexWrap: 'nowrap' }}>
      {['Novo Lead', 'Qualificação', 'Proposta', 'Negociação', 'Fechado'].map((status) => (
        <Grid item xs={12} sm={6} md={4} key={status} style={{ minWidth: 300 }}>
          <Paper style={{ height: '100%', padding: 16, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom style={{ color: '#333' }}>
              {status}
            </Typography>
            {data && data.length > 0 ? (
                data.filter(item => item.status === status).map(item => (
                    <Card key={item.id} style={{ marginBottom: 8 }}>
                        <CardContent>
                        <Typography variant="subtitle1">{item.title || "Sem nome"}</Typography>
                        <Typography variant="body2" color="textSecondary">{item.value || "R$ 0,00"}</Typography>
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

const LeadsList = ({ data, loading }) => {
    if (loading) return <CircularProgress />;
    
    return (
        <TableContainer component={Paper}>
            <Table>
            <TableHead>
                <TableRow>
                <TableCell>Lead</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Contato</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {data && data.length > 0 ? (
                    data.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>{item.title}</TableCell>
                            <TableCell>{item.status}</TableCell>
                            <TableCell>{item.value}</TableCell>
                            <TableCell>{item.contact}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} align="center">Nenhum lead encontrado</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </TableContainer>
    );
};

const LeadsCalendar = ({ data }) => (
  <Paper style={{ padding: 16, height: '100%' }}>
    <Typography variant="h6">Calendário de Vendas</Typography>
    <div style={{ marginTop: 20, textAlign: 'center', color: '#666' }}>
      Componente de calendário será integrado aqui.
      {data && data.length > 0 && <div>{data.length} leads carregados.</div>}
    </div>
  </Paper>
);

const LeadsDashboard = ({ count }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={4}>
      <Paper style={{ padding: 16, textAlign: 'center' }}>
        <Typography variant="h4" color="primary">{count || 0}</Typography>
        <Typography variant="subtitle1">Total de Leads</Typography>
      </Paper>
    </Grid>
    <Grid item xs={12} sm={4}>
      <Paper style={{ padding: 16, textAlign: 'center' }}>
        <Typography variant="h4" style={{ color: '#f50057' }}>R$ 0,00</Typography>
        <Typography variant="subtitle1">Valor em Pipeline</Typography>
      </Paper>
    </Grid>
    <Grid item xs={12} sm={4}>
      <Paper style={{ padding: 16, textAlign: 'center' }}>
        <Typography variant="h4" style={{ color: '#4caf50' }}>0</Typography>
        <Typography variant="subtitle1">Conversões</Typography>
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

const LeadsSales = () => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("board");
  
  const { leadsSales, loading, count } = useLeadsSales({
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
        return <LeadsDashboard count={count} />;
      case "board":
        return <LeadsBoard data={leadsSales} loading={loading} />;
      case "list":
        return <LeadsList data={leadsSales} loading={loading} />;
      case "calendar":
        return <LeadsCalendar data={leadsSales} />;
      default:
        return <LeadsBoard data={leadsSales} loading={loading} />;
    }
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>Leads e Vendas</Title>
        <MainHeaderButtonsWrapper>
          <Button variant="contained" color="primary">Novo Lead</Button>
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

export default LeadsSales;
