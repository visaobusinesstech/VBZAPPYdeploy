import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { useTranslation } from "react-i18next";
import {
  Dashboard as DashboardIcon,
  List as ListIcon,
  CalendarToday as CalendarIcon,
} from "@material-ui/icons";
import KanbanIcon from "@mui/icons-material/ViewKanban";
import FolderIcon from "@material-ui/icons/Folder";

import MainContainer from "../../components/MainContainer";
import InternalNavbar from "../../components/InternalNavbar";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import { Button, CircularProgress } from "@material-ui/core";
import api from "../../services/api";
import { toast } from "react-toastify";
import useFiles from "../../hooks/useFiles";

// Placeholders for views
import { Grid, Paper, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@material-ui/core";

const FilesBoard = ({ data, loading }) => {
  if (loading) return <CircularProgress />;
  
  return (
    <Grid container spacing={2} style={{ height: '100%', overflowX: 'auto', flexWrap: 'nowrap' }}>
      {['Recentes', 'Compartilhados', 'Favoritos'].map((status) => (
        <Grid item xs={12} sm={6} md={4} key={status} style={{ minWidth: 300 }}>
          <Paper style={{ height: '100%', padding: 16, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom style={{ color: '#333' }}>
              {status}
            </Typography>
            {data && data.length > 0 ? (
                data.filter(item => item.category === status).map(item => (
                    <Card key={item.id} style={{ marginBottom: 8 }}>
                        <CardContent>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <FolderIcon style={{ marginRight: 8, color: '#fbc02d' }} />
                            <div>
                                <Typography variant="subtitle1">{item.name || "Sem nome"}</Typography>
                                <Typography variant="body2" color="textSecondary">{item.size || "0 KB"}</Typography>
                            </div>
                        </div>
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

const FilesList = ({ data, loading }) => {
    if (loading) return <CircularProgress />;
    
    return (
        <TableContainer component={Paper}>
            <Table>
            <TableHead>
                <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Tamanho</TableCell>
                <TableCell>Data de Modificação</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {data && data.length > 0 ? (
                    data.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <FolderIcon style={{ marginRight: 8, color: '#fbc02d' }} />
                                    {item.name}
                                </div>
                            </TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>{item.size}</TableCell>
                            <TableCell>{item.updatedAt}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} align="center">Nenhum arquivo encontrado</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </TableContainer>
    );
};

const FilesCalendar = ({ data }) => (
  <Paper style={{ padding: 16, height: '100%' }}>
    <Typography variant="h6">Histórico de Arquivos</Typography>
    <div style={{ marginTop: 20, textAlign: 'center', color: '#666' }}>
      Componente de calendário será integrado aqui.
      {data && data.length > 0 && <div>{data.length} arquivos carregados.</div>}
    </div>
  </Paper>
);

const FilesDashboard = ({ count }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={4}>
      <Paper style={{ padding: 16, textAlign: 'center' }}>
        <Typography variant="h4" color="primary">{count || 0}</Typography>
        <Typography variant="subtitle1">Total de Arquivos</Typography>
      </Paper>
    </Grid>
    <Grid item xs={12} sm={4}>
      <Paper style={{ padding: 16, textAlign: 'center' }}>
        <Typography variant="h4" style={{ color: '#f50057' }}>0 GB</Typography>
        <Typography variant="subtitle1">Espaço Usado</Typography>
      </Paper>
    </Grid>
    <Grid item xs={12} sm={4}>
      <Paper style={{ padding: 16, textAlign: 'center' }}>
        <Typography variant="h4" style={{ color: '#4caf50' }}>0</Typography>
        <Typography variant="subtitle1">Compartilhados</Typography>
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

const FilesPage = () => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("board");
  
  const { files, loading, count } = useFiles({
      pageNumber: 1,
      searchParam: ""
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: "Dashboard", value: "dashboard", icon: <DashboardIcon /> },
    { label: "Pastas", value: "board", icon: <KanbanIcon /> },
    { label: "Lista", value: "list", icon: <ListIcon /> },
    { label: "Histórico", value: "calendar", icon: <CalendarIcon /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <FilesDashboard count={count} />;
      case "board":
        return <FilesBoard data={files} loading={loading} />;
      case "list":
        return <FilesList data={files} loading={loading} />;
      case "calendar":
        return <FilesCalendar data={files} />;
      default:
        return <FilesBoard data={files} loading={loading} />;
    }
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>Arquivos</Title>
        <MainHeaderButtonsWrapper>
          <Button variant="contained" color="primary">Upload</Button>
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

export default FilesPage;
