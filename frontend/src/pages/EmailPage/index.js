import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { useTranslation } from "react-i18next";
import {
  Dashboard as DashboardIcon,
  List as ListIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
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
import useEmail from "../../hooks/useEmail";

// Placeholders for views
import { Grid, Paper, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@material-ui/core";

const EmailInbox = ({ data, loading }) => {
  if (loading) return <CircularProgress />;
  
  return (
    <Grid container spacing={2} style={{ height: '100%', overflowX: 'auto', flexWrap: 'nowrap' }}>
      {['Não Lidos', 'Lidos', 'Spam'].map((status) => (
        <Grid item xs={12} sm={6} md={4} key={status} style={{ minWidth: 300 }}>
          <Paper style={{ height: '100%', padding: 16, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom style={{ color: '#333' }}>
              {status}
            </Typography>
            {data && data.length > 0 ? (
                data.filter(item => item.status === status).map(item => (
                    <Card key={item.id} style={{ marginBottom: 8 }}>
                        <CardContent>
                        <Typography variant="subtitle1">{item.subject || "Sem assunto"}</Typography>
                        <Typography variant="body2" color="textSecondary">{item.sender || "Desconhecido"}</Typography>
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

const EmailList = ({ data, loading }) => {
    if (loading) return <CircularProgress />;
    
    return (
        <TableContainer component={Paper}>
            <Table>
            <TableHead>
                <TableRow>
                <TableCell>Assunto</TableCell>
                <TableCell>Remetente</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Status</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {data && data.length > 0 ? (
                    data.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>{item.subject}</TableCell>
                            <TableCell>{item.sender}</TableCell>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.status}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} align="center">Nenhum email encontrado</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </TableContainer>
    );
};

const EmailCalendar = ({ data }) => (
  <Paper style={{ padding: 16, height: '100%' }}>
    <Typography variant="h6">Agendamento de Emails</Typography>
    <div style={{ marginTop: 20, textAlign: 'center', color: '#666' }}>
      Componente de calendário será integrado aqui.
      {data && data.length > 0 && <div>{data.length} emails agendados.</div>}
    </div>
  </Paper>
);

const EmailDashboard = ({ count }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={4}>
      <Paper style={{ padding: 16, textAlign: 'center' }}>
        <Typography variant="h4" color="primary">{count || 0}</Typography>
        <Typography variant="subtitle1">Total de Emails</Typography>
      </Paper>
    </Grid>
    <Grid item xs={12} sm={4}>
      <Paper style={{ padding: 16, textAlign: 'center' }}>
        <Typography variant="h4" style={{ color: '#f50057' }}>0</Typography>
        <Typography variant="subtitle1">Não Lidos</Typography>
      </Paper>
    </Grid>
    <Grid item xs={12} sm={4}>
      <Paper style={{ padding: 16, textAlign: 'center' }}>
        <Typography variant="h4" style={{ color: '#4caf50' }}>0</Typography>
        <Typography variant="subtitle1">Enviados</Typography>
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

const EmailPage = () => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("board");
  
  const { emails, loading, count } = useEmail({
      pageNumber: 1,
      searchParam: ""
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: "Dashboard", value: "dashboard", icon: <DashboardIcon /> },
    { label: "Caixa de Entrada", value: "board", icon: <EmailIcon /> },
    { label: "Lista", value: "list", icon: <ListIcon /> },
    { label: "Calendário", value: "calendar", icon: <CalendarIcon /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <EmailDashboard count={count} />;
      case "board":
        return <EmailInbox data={emails} loading={loading} />;
      case "list":
        return <EmailList data={emails} loading={loading} />;
      case "calendar":
        return <EmailCalendar data={emails} />;
      default:
        return <EmailInbox data={emails} loading={loading} />;
    }
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>Email</Title>
        <MainHeaderButtonsWrapper>
          <Button variant="contained" color="primary">Escrever</Button>
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

export default EmailPage;
