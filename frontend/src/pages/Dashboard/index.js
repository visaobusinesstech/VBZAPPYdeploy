import React, { useContext, useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
// import {  Button, Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useTheme } from "@material-ui/core/styles";
import { IconButton } from "@mui/material";
import { Groups, SaveAlt } from "@mui/icons-material";

import CallIcon from "@material-ui/icons/Call";
import RecordVoiceOverIcon from "@material-ui/icons/RecordVoiceOver";
import GroupAddIcon from "@material-ui/icons/GroupAdd";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import FilterListIcon from "@material-ui/icons/FilterList";
import ClearIcon from "@material-ui/icons/Clear";
import SendIcon from "@material-ui/icons/Send";
import MessageIcon from "@material-ui/icons/Message";
import AccessAlarmIcon from "@material-ui/icons/AccessAlarm";
import TimerIcon from "@material-ui/icons/Timer";
import * as XLSX from "xlsx";
import CheckCircleOutlineIcon from "@material-ui/icons/RecordVoiceOver";
import ErrorOutlineIcon from "@material-ui/icons/RecordVoiceOver";

import { grey, blue } from "@material-ui/core/colors";
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import TabPanel from "../../components/TabPanel";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import { isArray } from "lodash";

import { AuthContext } from "../../context/Auth/AuthContext";

import useDashboard from "../../hooks/useDashboard";
import useContacts from "../../hooks/useContacts";
import useMessages from "../../hooks/useMessages";
import { ChatsUser } from "./ChartsUser";

import useActivities from "../../hooks/useActivities";
import useProjects from "../../hooks/useProjects";
import { isEmpty } from "lodash";
import moment from "moment";
import { ChartsDate } from "./ChartsDate";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  SvgIcon,
  Tab,
  Tabs,
  LinearProgress,
  Box,
} from "@mui/material";
import { i18n } from "../../translate/i18n";
import Grid2 from "@mui/material/Unstable_Grid2";
import ForbiddenPage from "../../components/ForbiddenPage";
import { ArrowDownward, ArrowUpward } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  overline: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: theme.palette.text.secondary,
    letterSpacing: "0.5px",
    lineHeight: 2.5,
    textTransform: "uppercase",
    fontFamily: "'Plus Jakarta Sans', sans-serif'",
  },
  greetingContainer: {
    marginBottom: theme.spacing(3),
  },
  greetingTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  greetingSubtitle: {
    color: theme.palette.text.secondary,
  },
  blocksWrapper: {
    width: "100%",
  },
  blockPaper: {
    padding: theme.spacing(2),
    borderRadius: 12,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[2],
    minHeight: 220,
    display: "flex",
    flexDirection: "column",
  },
  blockHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(1.5),
  },
  blockTitle: {
    fontWeight: 600,
  },
  blockList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    marginTop: theme.spacing(1),
  },
  blockListItem: {
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(1),
    borderRadius: 8,
    marginBottom: theme.spacing(1),
    backgroundColor:
      theme.palette.mode === "light"
        ? "#f9fafb"
        : "rgba(255,255,255,0.04)",
  },
  blockItemTitle: {
    fontSize: "0.95rem",
    fontWeight: 500,
  },
  blockItemMeta: {
    fontSize: "0.8rem",
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
  h4: {
    fontFamily: "'Plus Jakarta Sans', sans-serif'",
    fontWeight: 500,
    fontSize: "2rem",
    lineHeight: 1,
    color: theme.palette.text.primary,
  },
  tab: {
    minWidth: "auto",
    width: "auto",
    padding: theme.spacing(0.5, 1),
    borderRadius: 8,
    transition: "0.3s",
    borderWidth: "1px",
    borderStyle: "solid",
    marginRight: theme.spacing(0.5),
    marginLeft: theme.spacing(0.5),

    [theme.breakpoints.down("lg")]: {
      fontSize: "0.9rem",
      padding: theme.spacing(0.4, 0.8),
      marginRight: theme.spacing(0.4),
      marginLeft: theme.spacing(0.4),
    },
    [theme.breakpoints.down("md")]: {
      fontSize: "0.8rem",
      padding: theme.spacing(0.3, 0.6),
      marginRight: theme.spacing(0.3),
      marginLeft: theme.spacing(0.3),
    },
    "&:hover": {
      backgroundColor: "rgba(6, 81, 131, 0.3)",
    },
    "&$selected": {
      color: theme.palette.primary.contrastText,
      backgroundColor: theme.palette.primary.main,
    },
  },
  tabIndicator: {
    borderWidth: "2px",
    borderStyle: "solid",
    height: 6,
    bottom: 0,
    color:
      theme.palette.mode === "light"
        ? theme.palette.primary.main
        : theme.palette.primary.contrastText,
  },
  container: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  nps: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.padding,
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    height: 240,
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  cardAvatar: {
    fontSize: "55px",
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: theme.palette.primary.main,
  },
  cardSubtitle: {
    color: theme.palette.text.secondary,
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  iframeDashboard: {
    width: "100%",
    height: "calc(100vh - 64px)",
    border: "none",
  },
  customFixedHeightPaperLg: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
  },
  mainContainer: {
    padding: 0,
    paddingTop: 0,
  },
  mainPaper: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    ...theme.scrollbarStyles,
    backgroundColor: "transparent !important",
    borderRadius: "10px",
  },
  paper: {
    padding: theme.spacing(2),
    borderRadius: 12,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[1],
  },
  barContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(1),
  },
  progressBar: {
    flex: 1,
    marginRight: theme.spacing(1),
    borderRadius: 5,
    height: 10,
  },
  progressLabel: {
    minWidth: 50,
    textAlign: "right",
    fontWeight: 500,
    color: theme.palette.mode === "light" ? theme.palette.text.secondary : theme.palette.text.primary,
  },
  infoCard: {
    padding: theme.spacing(2),
    textAlign: "center",
    borderRadius: 12,
    boxShadow: theme.shadows[1],
    backgroundColor: theme.palette.background.paper,
    marginBottom: theme.spacing(2),
  },
  infoIcon: {
    fontSize: "2rem",
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
  },
}));

const dashboardBlocks = [
  { id: "pendingActivities", title: "Atividades Pendentes" },
  { id: "recentActivities", title: "Atividades Recentes" },
  { id: "recentProjects", title: "Últimos Projetos" },
];

const Dashboard = () => {
  const theme = useTheme();
  const classes = useStyles();
  const [counters, setCounters] = useState({});
  const [attendants, setAttendants] = useState([]);
  const [filterType, setFilterType] = useState(1);
  const [period, setPeriod] = useState(0);
  const [dateFrom, setDateFrom] = useState(
    moment("1", "D").format("YYYY-MM-DD")
  );
  const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const { find } = useDashboard();

  //FILTROS NPS
  const [tab, setTab] = useState("Indicadores");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedQueues, setSelectedQueues] = useState([]);

  let newDate = new Date();
  let date = newDate.getDate();
  let month = newDate.getMonth() + 1;
  let year = newDate.getFullYear();
  let nowIni = `${year}-${month < 10 ? `0${month}` : `${month}`}-01`;

  let now = `${year}-${month < 10 ? `0${month}` : `${month}`
    }-${date < 10 ? `0${date}` : `${date}`}`;

  const [showFilter, setShowFilter] = useState(false);
  const [dateStartTicket, setDateStartTicket] = useState(nowIni);
  const [dateEndTicket, setDateEndTicket] = useState(now);
  const [queueTicket, setQueueTicket] = useState(false);
  const [fetchDataFilter, setFetchDataFilter] = useState(false);
  const [blockOrder, setBlockOrder] = useState(
    dashboardBlocks.map((b) => b.id)
  );

  const { user } = useContext(AuthContext);
  const { activities, loading: loadingActivities } = useActivities({
    searchParam: "",
    pageNumber: 1,
  });
  const { projects, loading: loadingProjects } = useProjects({
    pageNumber: 1,
    searchParam: "",
  });

  const exportarGridParaExcel = () => {
    const ws = XLSX.utils.table_to_sheet(
      document.getElementById("grid-attendants")
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RelatorioDeAtendentes");
    XLSX.writeFile(wb, "relatorio-de-atendentes.xlsx");
  };

  var userQueueIds = [];

  if (user.queues && user.queues.length > 0) {
    userQueueIds = user.queues.map((q) => q.id);
  }

  useEffect(() => {
    const storageKey = `dashboard-block-order-${user.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validIds = dashboardBlocks.map((b) => b.id);
        const filtered = parsed.filter((id) => validIds.includes(id));
        const missing = validIds.filter((id) => !filtered.includes(id));
        setBlockOrder([...filtered, ...missing]);
      } catch (e) {
        setBlockOrder(dashboardBlocks.map((b) => b.id));
      }
    } else {
      setBlockOrder(dashboardBlocks.map((b) => b.id));
    }
  }, [user.id]);

  useEffect(() => {
    let isMounted = true;
    
    async function firstLoad() {
      if (isMounted) {
        console.log('Executando firstLoad...');
        await fetchData();
      }
    }
    
    const timeoutId = setTimeout(() => {
      firstLoad();
    }, 500);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDataFilter]);

  async function fetchData() {
    setLoading(true);
    console.log('Iniciando fetchData...');
  
    let params = {};
  
    // Construir parâmetros de filtro
    if (period > 0) {
      params = {
        days: period,
      };
      console.log('Usando filtro por dias:', period);
    } else {
      // Se não há período específico, usar as datas
      if (!isEmpty(dateStartTicket) && moment(dateStartTicket).isValid()) {
        params = {
          ...params,
          date_from: moment(dateStartTicket).format("YYYY-MM-DD"),
        };
        console.log('Data de início:', dateStartTicket);
      }
  
      if (!isEmpty(dateEndTicket) && moment(dateEndTicket).isValid()) {
        params = {
          ...params,
          date_to: moment(dateEndTicket).format("YYYY-MM-DD"),
        };
        console.log('Data de fim:', dateEndTicket);
      }
    }
  
    // Se nenhum parâmetro foi definido, usar período padrão de 30 dias
    if (Object.keys(params).length === 0) {
      console.log('Nenhum filtro definido, usando 30 dias como padrão');
      params = { days: 30 };
    }
  
    console.log('Parâmetros finais para busca:', params);
  
    try {
      const data = await find(params);
      console.log('Dados recebidos no componente:', data);
  
      // Garantir que counters sempre tenha valores válidos
      const safeCounters = data.counters || {};
      
      // Verificar especificamente o campo tickets
      console.log('Campo tickets recebido:', safeCounters.tickets);
      
      setCounters(safeCounters);
      
      if (isArray(data.attendants)) {
        setAttendants(data.attendants);
      } else {
        console.warn('Attendants não é um array:', data.attendants);
        setAttendants([]);
      }
  
      console.log('Estado atualizado - Counters:', safeCounters);
      console.log('Estado atualizado - Attendants:', data.attendants);
      
      // Log específico para verificar se o campo tickets está presente
      console.log('Valor de tickets no estado:', safeCounters.tickets);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados do dashboard');
      
      // Definir valores padrão em caso de erro
      setCounters({
        avgSupportTime: 0,
        avgWaitTime: 0,
        supportFinished: 0,
        supportHappening: 0,
        supportPending: 0,
        supportGroups: 0,
        leads: 0,
        activeTickets: 0,
        passiveTickets: 0,
        tickets: 0,
        waitRating: 0,
        withoutRating: 0,
        withRating: 0,
        percRating: 0,
        npsPromotersPerc: 0,
        npsPassivePerc: 0,
        npsDetractorsPerc: 0,
        npsScore: 0
      });
      setAttendants([]);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectedUsers = (selecteds) => {
    const users = selecteds.map((t) => t.id);
    setSelectedUsers(users);
  };

  const handleChangeTab = (e, newValue) => {
    setTab(newValue);
  };

  function formatTime(minutes) {
    return moment().startOf("day").add(minutes, "minutes").format("HH[h] mm[m]");
  }

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(blockOrder);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    setBlockOrder(items);
    const storageKey = `dashboard-block-order-${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify(items));
  };

  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    let base;
    if (hour < 12) {
      base = "Bom dia";
    } else if (hour < 18) {
      base = "Boa tarde";
    } else {
      base = "Boa noite";
    }
    return `${base.toUpperCase()}, ${user.name}`;
  }, [user.name]);

  const pendingActivities = useMemo(() => {
    return activities
      .filter(
        (a) => a.status === "pending" || a.status === "A Fazer"
      )
      .slice(0, 5);
  }, [activities]);

  const recentActivities = useMemo(() => {
    return [...activities]
      .sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date) - new Date(a.date);
      })
      .slice(0, 5);
  }, [activities]);

  const recentProjects = useMemo(() => {
    return [...projects].slice(0, 5);
  }, [projects]);

  const renderBlockContent = (id) => {
    if (id === "pendingActivities") {
      if (loadingActivities) {
        return (
          <Typography color="textSecondary">Carregando atividades...</Typography>
        );
      }
      if (!pendingActivities.length) {
        return (
          <Typography color="textSecondary">
            Nenhuma atividade pendente encontrada.
          </Typography>
        );
      }
      return (
        <ul className={classes.blockList}>
          {pendingActivities.map((a) => (
            <li key={a.id} className={classes.blockListItem}>
              <Typography className={classes.blockItemTitle}>
                {a.title || "Sem título"}
              </Typography>
              <Typography className={classes.blockItemMeta}>
                {a.date}
              </Typography>
            </li>
          ))}
        </ul>
      );
    }
    if (id === "recentActivities") {
      if (loadingActivities) {
        return (
          <Typography color="textSecondary">Carregando atividades...</Typography>
        );
      }
      if (!recentActivities.length) {
        return (
          <Typography color="textSecondary">
            Nenhuma atividade recente encontrada.
          </Typography>
        );
      }
      return (
        <ul className={classes.blockList}>
          {recentActivities.map((a) => (
            <li key={a.id} className={classes.blockListItem}>
              <Typography className={classes.blockItemTitle}>
                {a.title || "Sem título"}
              </Typography>
              <Typography className={classes.blockItemMeta}>
                {a.date}
              </Typography>
            </li>
          ))}
        </ul>
      );
    }
    if (id === "recentProjects") {
      if (loadingProjects) {
        return (
          <Typography color="textSecondary">Carregando projetos...</Typography>
        );
      }
      if (!recentProjects.length) {
        return (
          <Typography color="textSecondary">
            Nenhum projeto encontrado.
          </Typography>
        );
      }
      return (
        <ul className={classes.blockList}>
          {recentProjects.map((p) => (
            <li key={p.id} className={classes.blockListItem}>
              <Typography className={classes.blockItemTitle}>
                {p.title || "Sem título"}
              </Typography>
              <Typography className={classes.blockItemMeta}>
                {p.status}
              </Typography>
            </li>
          ))}
        </ul>
      );
    }
    return null;
  };

  const GetUsers = () => {
    let count;
    let userOnline = 0;
    attendants.forEach((user) => {
      if (user.online === true) {
        userOnline = userOnline + 1;
      }
    });
    count = userOnline === 0 ? 0 : userOnline;
    return count;
  };

  const GetContacts = (all) => {
    let props = {};
    if (all) {
      props = {};
    } else {
      props = {
        dateStart: dateStartTicket,
        dateEnd: dateEndTicket,
      };
    }
    const { count } = useContacts(props);
    return count;
  };

  const GetMessages = (all, fromMe) => {
    let props = {};
    if (all) {
      if (fromMe) {
        props = {
          fromMe: true,
        };
      } else {
        props = {
          fromMe: false,
        };
      }
    } else {
      if (fromMe) {
        props = {
          fromMe: true,
          dateStart: dateStartTicket,
          dateEnd: dateEndTicket,
        };
      } else {
        props = {
          fromMe: false,
          dateStart: dateStartTicket,
          dateEnd: dateEndTicket,
        };
      }
    }
    const { count } = useMessages(props);
    return count;
  };

  function toggleShowFilter() {
    setShowFilter(!showFilter);
  }

  return (
    <>
      {user.profile === "user" && user.showDashboard === "disabled" ? (
        <ForbiddenPage />
      ) : (
        <MainContainer className={classes.mainContainer}>
          <Paper
            className={classes.mainPaper}
            elevation={0}
          >
            <Container
              maxWidth={false}
              className={classes.container}
              style={{
                padding: "16px",
                maxWidth: "100%",
                overflowX: "hidden",
                marginTop: 0,
              }}
            >
              <div className={classes.greetingContainer}>
                <Typography variant="h4" className={classes.greetingTitle}>
                  {greetingText}
                </Typography>
                <Typography
                  variant="subtitle1"
                  className={classes.greetingSubtitle}
                >
                  Estes blocos puxam dados criados em Atividades e Projetos.
                </Typography>
              </div>
              <div className={classes.blocksWrapper}>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="dashboard-blocks">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <Grid2
                          container
                          spacing={2}
                          className={classes.container}
                          style={{ margin: 0, width: "100%", marginTop: 0 }}
                        >
                          {blockOrder.map((id, index) => {
                            const config = dashboardBlocks.find(
                              (b) => b.id === id
                            );
                            if (!config) return null;
                            return (
                              <Draggable
                                key={id}
                                draggableId={id}
                                index={index}
                              >
                                {(dragProvided) => (
                                  <Grid2
                                    item
                                    xs={12}
                                    md={index < 2 ? 6 : 12}
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                  >
                                    <Paper className={classes.blockPaper}>
                                      <div className={classes.blockHeader}>
                                        <Typography
                                          variant="h6"
                                          className={classes.blockTitle}
                                        >
                                          {config.title}
                                        </Typography>
                                      </div>
                                      {renderBlockContent(id)}
                                    </Paper>
                                  </Grid2>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </Grid2>
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </Container>
          </Paper>
        </MainContainer>
      )}
    </>
  );
};

export default Dashboard;
