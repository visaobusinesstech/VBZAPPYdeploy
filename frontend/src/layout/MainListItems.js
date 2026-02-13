import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useLocation, useHistory } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useHelps from "../hooks/useHelps";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import Avatar from "@material-ui/core/Avatar";
import Badge from "@material-ui/core/Badge";
import Collapse from "@material-ui/core/Collapse";
import List from "@material-ui/core/List";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";

import HistoryIcon from "@material-ui/icons/History";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import AccountBalanceWalletIcon from "@material-ui/icons/AccountBalanceWallet";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import ViewKanban from "@mui/icons-material/ViewKanban";
import Schedule from "@material-ui/icons/Schedule";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import CakeIcon from "@material-ui/icons/Cake";
import PeopleIcon from "@material-ui/icons/People";
import ListIcon from "@material-ui/icons/ListAlt";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import ForumIcon from "@material-ui/icons/Forum";
import LocalAtmIcon from "@material-ui/icons/LocalAtm";
import BusinessIcon from "@material-ui/icons/Business";
import ConfirmationNumberOutlinedIcon from "@material-ui/icons/ConfirmationNumberOutlined";
import AndroidIcon from "@material-ui/icons/Android";
import {
  AllInclusive,
  AttachFile,
  Dashboard,
  Description,
  DeviceHubOutlined,
  GridOn,
  PhonelinkSetup,
} from "@material-ui/icons";

import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { useActiveMenu } from "../context/ActiveMenuContext";

import { Can } from "../components/Can";

import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import usePlans from "../hooks/usePlans";
// import useVersion from "../hooks/useVersion";
import { i18n } from "../translate/i18n";
import { Campaign, ShapeLine, Webhook } from "@mui/icons-material";

import useCompanySettings from "../hooks/useSettings/companySettings";

const useStyles = makeStyles((theme) => ({
  listItem: {
    height: "44px",
    width: "auto",
    "&:hover $iconHoverActive": {
      backgroundColor: "transparent", // Removido fundo
      color: theme.palette.primary.main,
      transform: "scale(1.05)",
    },
    "&:hover $listItemText": {
      color: theme.palette.primary.main,
      fontWeight: 400,
    },
    transition: "all 0.3s ease",
  },

  listItemText: {
    fontSize: "14px",
    color: theme.mode === "light" ? "#000" : "#FFF",
    transition: "color 0.3s ease",
    fontWeight: 400,
    "& .MuiTypography-root": {
      fontFamily: '"Helvetica Neue", "Helvetica", "Arial", sans-serif',
    }
  },

  avatarActive: {
    backgroundColor: "transparent",
  },

  avatarHover: {
    backgroundColor: "transparent",
  },

  iconHoverActive: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "50%",
    height: 28,
    width: 28,
    backgroundColor: "transparent", // Removido fundo cinza inicial
    color: theme.mode === "light" ? "#000" : "#FFF",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover, &.active": {
      backgroundColor: "transparent", // Removido fundo azul ao selecionar
      color: theme.palette.primary.main, // Apenas muda a cor
      boxShadow: "none", // Removido shadow
    },
    "& .MuiSvgIcon-root": {
      fontSize: "1.2rem",
      transition: "transform 0.3s ease",
    },
    "&:hover .MuiSvgIcon-root": {
      transform: "scale(1.1)",
    }
  },

  badge: {
    "& .MuiBadge-badge": {
      backgroundColor: "#ef4444",
      color: "#fff",
      fontSize: "0.75rem",
      fontWeight: 600,
      animation: "$pulse 2s infinite",
    }
  },

  "@keyframes pulse": {
    "0%, 100%": {
      opacity: 1,
    },
    "50%": {
      opacity: 0.7,
    }
  },

  submenuContainer: {
    backgroundColor: theme.mode === "light"
      ? "rgba(0, 0, 0, 0.02)"
      : "rgba(255, 255, 255, 0.02)",
  },

  customTooltip: {
    backgroundColor: theme.mode === "light" ? "#1e293b" : "#374151",
    color: "#fff",
    fontSize: "0.875rem",
    fontWeight: 500,
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    "& .MuiTooltip-arrow": {
      color: theme.mode === "light" ? "#1e293b" : "#374151",
    }
  },

  versionContainer: {
    textAlign: "center",
    padding: "10px",
    color: theme.palette.primary.main,
    fontSize: "12px",
    fontWeight: "bold",
    borderTop: `1px solid ${theme.mode === "light" ? "#f0f0f0" : "#333"}`,
    marginTop: "auto",
  },

  adminSection: {
    "& .MuiListSubheader-root": {
      color: theme.palette.primary.main,
      fontSize: "0.875rem",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    }
  },

  expandIcon: {
    transition: "transform 0.3s ease",
    color: theme.palette.primary.main,
    "&.expanded": {
      transform: "rotate(180deg)",
    }
  },

  menuContainer: {
    overflowY: "auto",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      background: theme.mode === "light"
        ? "rgba(0, 0, 0, 0.1)"
        : "rgba(255, 255, 255, 0.1)",
      borderRadius: "3px",
      "&:hover": {
        background: theme.mode === "light"
          ? "rgba(0, 0, 0, 0.2)"
          : "rgba(255, 255, 255, 0.2)",
      }
    },
  },

  activeItem: {
    backgroundColor: theme.mode === "light" ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.05)",
    "& $iconHoverActive": {
      backgroundColor: "#808080",
      color: "#fff",
    },
    "& $listItemText": {
      color: "#808080",
      fontWeight: 500,
    }
  }
}));

function ListItemLink(props) {
  const { icon, primary, to, tooltip, showBadge } = props;
  const classes = useStyles();
  const { activeMenu } = useActiveMenu();
  const location = useLocation();
  const isActive = activeMenu === to || location.pathname === to;

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  const ConditionalTooltip = ({ children, tooltipEnabled }) =>
    tooltipEnabled ? (
      <Tooltip title={primary} placement="right">
        {children}
      </Tooltip>
    ) : (
      children
    );

  return (
    <ConditionalTooltip tooltipEnabled={!!tooltip}>
      <li>
        <ListItem button component={renderLink} className={classes.listItem}>
          {icon ? (
            <ListItemIcon>
              {showBadge ? (
                <Badge
                  badgeContent="!"
                  color="error"
                  overlap="circular"
                  className={classes.badge}
                >
                  <Avatar
                    className={`${classes.iconHoverActive} ${isActive ? "active" : ""
                      }`}
                  >
                    {icon}
                  </Avatar>
                </Badge>
              ) : (
                <Avatar
                  className={`${classes.iconHoverActive} ${isActive ? "active" : ""
                    }`}
                >
                  {icon}
                </Avatar>
              )}
            </ListItemIcon>
          ) : null}
          <ListItemText
            primary={
              <Typography className={classes.listItemText}>
                {primary}
              </Typography>
            }
          />
        </ListItem>
      </li>
    </ConditionalTooltip>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }

    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;

    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map((chat) => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = ({ collapsed, drawerClose, section }) => {
  const theme = useTheme();
  const classes = useStyles();
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, socket } = useContext(AuthContext);
  const history = useHistory();

  const { setActiveMenu } = useActiveMenu();
  const location = useLocation();

  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [openDashboardSubmenu, setOpenDashboardSubmenu] = useState(false);
  const [openVBZappySubmenu, setOpenVBZappySubmenu] = useState(false);
  const [openSettingsSubmenu, setOpenSettingsSubmenu] = useState(false);
  
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showWavoipCall, setShowWavoipCall] = useState(false);

  const [showSchedules, setShowSchedules] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [showExternalApi, setShowExternalApi] = useState(false);

  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  
  const [managementHover, setManagementHover] = useState(false);
  const [campaignHover, setCampaignHover] = useState(false);
  const [vbzappyHover, setVbzappyHover] = useState(false);
  const [settingsHover, setSettingsHover] = useState(false);

  const { list } = useHelps();
  const [hasHelps, setHasHelps] = useState(false);

  const [openFlowSubmenu, setOpenFlowSubmenu] = useState(false);
  const [flowHover, setFlowHover] = useState(false);

  const { get: getSetting } = useCompanySettings();
  const [showWallets, setShowWallets] = useState(false);

  const isFlowbuilderRouteActive = location.pathname.startsWith("/phrase-lists") || location.pathname.startsWith("/flowbuilders");

  const handleVBZappyClick = () => {
    history.push("/tickets");
    setOpenVBZappySubmenu((prev) => !prev);
  };

  const handleSettingsClick = () => {
    history.push("/settings");
    setOpenSettingsSubmenu((prev) => !prev);
  };

  useEffect(() => {
    async function checkHelps() {
      try {
        const helps = await list();
        setHasHelps(helps.length > 0);
      } catch (err) {
      }
    }
    checkHelps();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const setting = await getSetting(
          {
            "column": "DirectTicketsToWallets"
          }
        );
        setShowWallets(setting.DirectTicketsToWallets);
      } catch (err) {
        toastError(err);
      }
    }
    fetchSettings();
  }, [setShowWallets]);

  const isManagementActive =
    location.pathname === "/" ||
    location.pathname.startsWith("/reports") ||
    location.pathname.startsWith("/moments");

  const isCampaignRouteActive =
    location.pathname === "/campaigns" ||
    location.pathname.startsWith("/contact-lists") ||
    location.pathname.startsWith("/campaigns-config");

  useEffect(() => {
    if (location.pathname.startsWith("/tickets")) {
      setActiveMenu("/tickets");
    } else {
      setActiveMenu("");
    }
  }, [location, setActiveMenu]);

  const { getPlanCompany } = usePlans();

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    async function fetchData() {
      try {
        const companyId = user.companyId;
        const planConfigs = await getPlanCompany(undefined, companyId);

        if (!planConfigs || !planConfigs.plan) return;

        setShowCampaigns(planConfigs.plan.useCampaigns);
        setShowKanban(planConfigs.plan.useKanban);
        setShowOpenAi(planConfigs.plan.useOpenAi);
        setShowIntegrations(planConfigs.plan.useIntegrations);
        setShowSchedules(planConfigs.plan.useSchedules);
        setShowInternalChat(planConfigs.plan.useInternalChat);
        setShowExternalApi(planConfigs.plan.useExternalApi);
        setShowWavoipCall(planConfigs.plan.wavoip);
      } catch (err) {
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  useEffect(() => {
    if (user.id && socket && typeof socket.on === 'function') {
      const companyId = user.companyId;

      const onCompanyChatMainListItems = (data) => {
        if (data.action === "new-message") {
          dispatch({ type: "CHANGE_CHAT", payload: data });
        }
        if (data.action === "update") {
          dispatch({ type: "CHANGE_CHAT", payload: data });
        }
      };

      const eventName = `company-${companyId}-chat`;
      socket.on(eventName, onCompanyChatMainListItems);

      return () => {
        if (socket && typeof socket.off === 'function') {
          socket.off(eventName, onCompanyChatMainListItems);
        }
      };
    }
  }, [socket, user.id, user.companyId]);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [chats, user.id]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <div onClick={drawerClose}>
      {section === "main" && (
        <>
          <ListItemLink
            to="/"
            primary={i18n.t("mainDrawer.listItems.start")}
            icon={<DashboardOutlinedIcon />}
            tooltip={collapsed}
          />
          <ListItemLink
            to="/tickets"
            primary={i18n.t("mainDrawer.listItems.tickets")}
            icon={<ConfirmationNumberOutlinedIcon />}
            tooltip={collapsed}
          />
          <Can
            role={
              (user.profile === "user" && user.showDashboard === "enabled") ||
                user.allowRealTime === "enabled"
                ? "admin"
                : user.profile
            }
            perform={"drawer-admin-items:view"}
            yes={() => (
              <>
                <Tooltip
                  title={collapsed ? i18n.t("mainDrawer.listItems.management") : ""}
                  placement="right"
                >
                  <ListItem
                    dense
                    button
                    onClick={() => setOpenDashboardSubmenu((prev) => !prev)}
                    onMouseEnter={() => setManagementHover(true)}
                    onMouseLeave={() => setManagementHover(false)}
                    className={classes.listItem}
                  >
                    <ListItemIcon>
                      <Avatar
                        className={`${classes.iconHoverActive} ${isManagementActive || managementHover ? "active" : ""
                          }`}
                      >
                        <Dashboard />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography className={classes.listItemText}>
                          {i18n.t("mainDrawer.listItems.management")}
                        </Typography>
                      }
                    />
                    {openDashboardSubmenu ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </ListItem>
                </Tooltip>
                <Collapse
                  in={openDashboardSubmenu}
                  timeout="auto"
                  unmountOnExit
                  className={classes.submenuContainer}
                >
                  <Can
                    role={
                      user.profile === "user" && user.showDashboard === "enabled"
                        ? "admin"
                        : user.profile
                    }
                    perform={"drawer-admin-items:view"}
                    yes={() => (
                      <>
                        <ListItemLink
                          small
                          to="/reports"
                          primary={i18n.t("mainDrawer.listItems.reports")}
                          icon={<Description />}
                          tooltip={collapsed}
                        />
                      </>
                    )}
                  />
                  <Can
                    role={
                      user.profile === "user" && user.allowRealTime === "enabled"
                        ? "admin"
                        : user.profile
                    }
                    perform={"drawer-admin-items:view"}
                    yes={() => (
                      <ListItemLink
                        to="/moments"
                        primary={i18n.t("mainDrawer.listItems.chatsTempoReal")}
                        icon={<GridOn />}
                        tooltip={collapsed}
                      />
                    )}
                  />
                  {showWavoipCall && (
                    <ListItemLink
                        to="/call-historicals"
                        primary="Histórico de Chamadas"
                        icon={<HistoryIcon />}
                        tooltip={collapsed}
                    />
                   )}
                </Collapse>
              </>
            )}
          />

          {user.showContacts === "enabled" && (
            <ListItemLink
              to="/contacts"
              primary={i18n.t("mainDrawer.listItems.contacts")}
              icon={<ContactPhoneOutlinedIcon />}
              tooltip={collapsed}
            />
          )}

          {showSchedules && (
            <ListItemLink
              to="/schedules"
              primary={"Calendário"}
              icon={<Schedule />}
              tooltip={collapsed}
            />
          )}

          {showInternalChat && (
            <ListItemLink
              to="/chats"
              primary={i18n.t("mainDrawer.listItems.chats")}
              icon={
                <Badge color="secondary" variant="dot" invisible={invisible}>
                  <ForumIcon />
                </Badge>
              }
              tooltip={collapsed}
            />
          )}

          {hasHelps && (
            <ListItemLink
              to="/helps"
              primary={i18n.t("mainDrawer.listItems.helps")}
              icon={<HelpOutlineIcon />}
              tooltip={collapsed}
            />
          )}

          {user.showFlow === "enabled" && (
            <Tooltip
                title={collapsed ? "Flowbuilder" : ""}
                placement="right"
            >
                <ListItemLink
                    to="/flowbuilders"
                    primary={"Flowbuilder"}
                    icon={<AccountTreeOutlinedIcon />}
                    tooltip={collapsed}
                />
            </Tooltip>
          )}
        </>
      )}

      {section === "bottom" && (
        <>
           <Tooltip title={collapsed ? "VBZappy" : ""} placement="right">
            <ListItem
                button
                onClick={handleVBZappyClick}
                onMouseEnter={() => setVbzappyHover(true)}
                onMouseLeave={() => setVbzappyHover(false)}
                className={classes.listItem}
            >
                <ListItemIcon>
                    <Avatar className={`${classes.iconHoverActive} ${location.pathname.startsWith("/tickets") || vbzappyHover ? "active" : ""}`}>
                        <WhatsAppIcon />
                    </Avatar>
                </ListItemIcon>
                <ListItemText primary={<Typography className={classes.listItemText}>VBZappy</Typography>} />
                {openVBZappySubmenu ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItem>
           </Tooltip>
           <Collapse in={openVBZappySubmenu} timeout="auto" unmountOnExit className={classes.submenuContainer}>
                <ListItemLink to="/queues" primary="Filas e Chatbot" icon={<AccountTreeOutlinedIcon />} tooltip={collapsed} />
                <ListItemLink to="/birthday-settings" primary="Config. Aniversário" icon={<CakeIcon />} tooltip={collapsed} />
                <ListItemLink to="/quick-messages" primary="Disparo Automático" icon={<FlashOnIcon />} tooltip={collapsed} />
                <ListItemLink to="/connections" primary="Gerenciar Conexões" icon={<SyncAltIcon />} showBadge={connectionWarning} tooltip={collapsed} />
                <ListItemLink to="/announcements" primary="Informativos" icon={<AnnouncementIcon />} tooltip={collapsed} />
                {showKanban && <ListItemLink to="/kanban" primary="Kanban" icon={<ViewKanban />} tooltip={collapsed} />}
                {showCampaigns && <ListItemLink to="/campaigns" primary="Campanhas" icon={<EventAvailableIcon />} tooltip={collapsed} />}
           </Collapse>

           {showOpenAi && (
             <ListItemLink
                to="/prompts"
                primary="Agente IA"
                icon={<AndroidIcon />}
                tooltip={collapsed}
             />
           )}

           <Tooltip title={collapsed ? "Configurações" : ""} placement="right">
            <ListItem
                button
                onClick={handleSettingsClick}
                onMouseEnter={() => setSettingsHover(true)}
                onMouseLeave={() => setSettingsHover(false)}
                className={classes.listItem}
            >
                <ListItemIcon>
                    <Avatar className={`${classes.iconHoverActive} ${location.pathname.startsWith("/settings") || settingsHover ? "active" : ""}`}>
                        <SettingsOutlinedIcon />
                    </Avatar>
                </ListItemIcon>
                <ListItemText primary={<Typography className={classes.listItemText}>Configurações</Typography>} />
                {openSettingsSubmenu ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItem>
           </Tooltip>
           <Collapse in={openSettingsSubmenu} timeout="auto" unmountOnExit className={classes.submenuContainer}>
                <ListItemLink to="/companies" primary="Empresas" icon={<BusinessIcon />} tooltip={collapsed} />
                <ListItemLink to="/financeiro" primary="Financeiro" icon={<LocalAtmIcon />} tooltip={collapsed} />
                <ListItemLink to="/tags" primary="Tags" icon={<LocalOfferIcon />} tooltip={collapsed} />
           </Collapse>
        </>
      )}
    </div>
  );
};

export default MainListItems;
