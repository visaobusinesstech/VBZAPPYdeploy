import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  List as ListIcon,
  CalendarToday as CalendarIcon,
  ViewWeek as KanbanIcon
} from "@material-ui/icons";
import DashboardIcon from "@material-ui/icons/Dashboard";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  TextField,
  Popover,
  Button,
  Typography,
  Avatar,
  IconButton
} from "@material-ui/core";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import BusinessCenterIcon from "@material-ui/icons/BusinessCenter";
import AddIcon from "@material-ui/icons/Add";
import PhoneIcon from "@material-ui/icons/Phone";
import PersonOutlineIcon from "@material-ui/icons/PersonOutline";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import CloseIcon from "@material-ui/icons/Close";
import QueryBuilderIcon from "@material-ui/icons/QueryBuilder";
import ZoomOutMapIcon from "@material-ui/icons/ZoomOutMap";
import FullscreenExitIcon from "@material-ui/icons/FullscreenExit";
import SettingsIcon from "@material-ui/icons/Settings";
import ActivitiesStyleLayout from "../../components/ActivitiesStyleLayout";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../Schedules/Schedules.css";
import "moment/locale/pt-br";
import useLeadsSales from "../../hooks/useLeadsSales";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import CreateLeadSaleModal from "../../components/CreateLeadSaleModal";
import { AuthContext } from "../../context/Auth/AuthContext";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import leadsSalesService from "../../services/leadsSalesService";
import { toast } from "react-toastify";
import LocalOfferOutlinedIcon from "@material-ui/icons/LocalOfferOutlined";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

const localizer = momentLocalizer(moment);

const ContactAvatar = ({ contact, lead, classes }) => {
  const [src, setSrc] = useState(contact?.urlPicture || contact?.profilePicUrl || "");
  const name = lead?.name || contact?.name || "Lead";
  const number = lead?.phone || contact?.number;

  useEffect(() => {
    setSrc(contact?.urlPicture || contact?.profilePicUrl || "");
  }, [contact?.urlPicture, contact?.profilePicUrl]);

  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      if (src || !number) return;
      try {
        const { data } = await api.get(`/contacts/profile/${encodeURIComponent(number)}`);
        const fetched =
          data?.profilePicUrl || data?.urlPicture || (typeof data === "string" ? data : "");
        if (!cancelled && fetched) setSrc(fetched);
      } catch (e) {
        // ignore
      }
    }
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [src, number]);

  return (
    <Avatar
      className={classes.cardAvatarTopLeft}
      src={src || undefined}
      imgProps={{ onError: () => setSrc("") }}
    >
      {initials(name)}
    </Avatar>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    height: "100%",
    overflow: "hidden",
  },
  fixedContent: {
    width: "100%",
    maxWidth: "100%",
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
  },
  board: {
    display: "grid",
    gridAutoRows: "1fr",
    width: "100%",
    overflowX: "hidden",
    padding: 12,
    gap: 16,
    ...theme.scrollbarStyles,
  },
  column: {
    minWidth: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    maxHeight: "100%",
  },
  columnHeader: {
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 12,
    minHeight: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    [theme.breakpoints.down("sm")]: {
      padding: 10,
      minHeight: 50,
    },
  },
  columnLabel: {
    fontWeight: 600,
    color: "#111827",
    fontSize: 14,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  columnMeta: {
    display: "flex",
    gap: 16,
    alignItems: "baseline",
    color: "#6B7280",
    fontSize: 12,
  },
  columnRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
    whiteSpace: "nowrap",
  },
  columnCount: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 1.2,
    padding: 0,
  },
  columnMenuBtn: {
    width: 28,
    height: 28,
    padding: 0,
    color: "#9CA3AF",
  },
  columnStripe: {
    width: 5,
    alignSelf: "stretch",
    borderRadius: 12,
    marginRight: 12,
  },
  cardsWrapper: {
    marginTop: 10,
    padding: "4px 0 8px",
    width: "100%",
    flex: 1,
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    ...theme.scrollbarStyles,
    [theme.breakpoints.down("sm")]: {
      marginTop: 8,
    },
  },
  card: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: "8px 10px 10px 40px",
    marginBottom: 10,
    width: "100%",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    cursor: "pointer",
    transition: "box-shadow .2s ease, transform .1s ease",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    aspectRatio: "auto",
    "&:hover": {
      boxShadow: "0 5px 12px rgba(0,0,0,0.08)",
      transform: "translateY(-1px)",
    },
    [theme.breakpoints.down("sm")]: {
      marginBottom: 8,
      padding: "8px 8px 10px 38px",
      aspectRatio: "auto",
    },
  },
  cardTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardDeleteBtn: {
    position: "absolute",
    bottom: 2,
    right: 6,
    width: 20,
    height: 20,
    minWidth: 20,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    color: "#EF4444",
    transition: "all 120ms ease",
    "&:hover": {
      color: "#B91C1C",
    }
  },
  cardApproveBtn: {
    position: "absolute",
    bottom: 2,
    left: 6,
    width: 20,
    height: 20,
    minWidth: 20,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    color: "#10B981",
    transition: "all 120ms ease",
    "&:hover": {
      color: "#059669",
    }
  },
  cardTimeBadge: {
    position: "absolute",
    bottom: 32,
    right: 8,
    fontSize: 10,
    color: "#6B7280",
    backgroundColor: "rgba(0,0,0,0.02)",
    border: "none",
    borderRadius: 6,
    padding: "1px 4px"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 0
  },
  avatar: {
    width: 26,
    height: 26,
    fontSize: 12,
    background: "#F3F4F6",
    color: "#374151",
  },
  cardAvatarTopRight: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    fontSize: 11,
    background: "#F3F4F6",
    color: "#374151",
    border: "1px solid #E5E7EB",
  },
  cardAvatarTopLeft: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    fontSize: 12,
    background: "#F3F4F6",
    color: "#374151",
    border: "1px solid #E5E7EB",
  },
  avatarStatusDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 9999,
    backgroundColor: "#10B981",
    top: 28,
    left: 28,
    zIndex: 2,
    border: "2px solid #FFFFFF"
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: "clamp(9px, 1.1vw, 12px)",
    color: "#111827",
    lineHeight: 1.25,
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  cardSub: {
    fontSize: "clamp(8px, 1vw, 11px)",
    fontWeight: 400,
    color: "#9CA3AF",
    marginTop: 2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  tagChip: {
    fontSize: 8.5,
    color: "#6B7280",
    backgroundColor: "rgba(0,0,0,0.03)",
    border: "1px solid #E5E7EB",
    borderRadius: 6,
    padding: "0 4px",
    lineHeight: "14px"
  },
  cardValue: {
    marginTop: 4,
    fontWeight: 700,
    color: "#059669",
    fontSize: "clamp(7.5px, 0.95vw, 10px)",
    textAlign: "left"
  },
  cardRow: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    marginTop: 3,
    color: "#6B7280",
    fontSize: "clamp(7.5px, 0.85vw, 9.5px)",
  },
  cardEdgeLeft: {
    marginLeft: -36
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  cardTagRow: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    marginTop: 2
  },
  cardResponsible: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    marginTop: 1,
    color: "#4B5563",
    fontSize: 8
  },
  addLeadBtn: {
    marginTop: 8,
    borderRadius: 12,
    textTransform: "none",
    color: "rgba(107, 114, 128, 0.85)",
    borderColor: "rgba(209, 213, 219, 0.7)",
    borderStyle: "dashed",
    backgroundColor: "rgba(249, 250, 251, 0.45)",
    minHeight: 40,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: 0,
    "& .MuiSvgIcon-root": {
      fontSize: 16,
      color: "rgba(107, 114, 128, 0.8)",
    },
    "&:hover": {
      backgroundColor: "rgba(243, 244, 246, 0.6)",
      borderColor: "rgba(209, 213, 219, 1)",
    },
  },
  popoverContent: {
    padding: theme.spacing(2),
    maxWidth: 360
  },
  popoverGrid: {
    width: 320
  }
}));

const COLUMN_DEFS = [
  { key: "novo", label: "Novo Lead", color: "#6366F1" },
  { key: "qualificacao", label: "Contato Inicial", color: "#8B5CF6" },
  { key: "proposta", label: "Proposta", color: "#F59E0B" },
  { key: "negociacao", label: "Reunião", color: "#F97316" },
  { key: "fechado", label: "Fechamento", color: "#10B981" },
];

function initials(name = "") {
  const parts = String(name).trim().split(" ");
  const i1 = parts[0]?.[0] || "";
  const i2 = parts.length > 1 ? parts[1][0] : "";
  return (i1 + i2).toUpperCase();
}

const AutoShrinkText = ({ text, max = 13, min = 8, className }) => {
  const containerRef = React.useRef(null);
  const textRef = React.useRef(null);
  const [size, setSize] = React.useState(max);
  const measure = React.useCallback(() => {
    const container = containerRef.current;
    const el = textRef.current;
    if (!container || !el) return;
    let current = max;
    el.style.fontSize = `${current}px`;
    let guard = 0;
    const limit = Math.max(0, container.clientWidth - 6);
    while (guard < 80 && current > min && el.scrollWidth > limit) {
      current -= 0.5;
      el.style.fontSize = `${current}px`;
      guard++;
    }
    setSize(current);
  }, [max, min, text]);
  React.useLayoutEffect(() => {
    const id = requestAnimationFrame(() => measure());
    return () => cancelAnimationFrame(id);
  }, [measure, text]);
  React.useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);
  return (
    <div ref={containerRef} style={{ overflow: "hidden", whiteSpace: "nowrap", minWidth: 0, paddingRight: 12, maxWidth: "100%" }}>
      <span ref={textRef} className={className} style={{ fontSize: size, display: "inline-block", maxWidth: "100%" }}>{text}</span>
    </div>
  );
};

const currencyBRL = (v) => {
  const n = Number(v || 0);
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } catch {
    // fallback simples
    const fixed = n.toFixed(2).replace(".", ",");
    return `R$ ${fixed}`; 
  }
};

const LeadsKanbanBoard = ({ leads, onEdit, onAdd, onMove, onDelete, contacts, onOpenTagCreator }) => {
  const classes = useStyles();

  const leadsByStatus = useMemo(() => {
    const map = {};
    (leads || []).forEach((l) => {
      const key = String(l.status || "").toLowerCase();
      if (!map[key]) map[key] = [];
      map[key].push(l);
    });
    return map;
  }, [leads]);

  const getTotalValue = (arr = []) =>
    arr.reduce((sum, l) => sum + (Number(l.value) || 0), 0);

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result || {};
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    if (onMove) onMove(draggableId, source.droppableId, destination.droppableId, destination.index);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div
        className={classes.board}
        style={{ gridTemplateColumns: `repeat(${COLUMN_DEFS.length}, minmax(0, 1fr))` }}
      >
        {COLUMN_DEFS.map((col) => {
          const list = leadsByStatus[col.key] || [];
          const total = getTotalValue(list);
          const since = (date) => {
            if (!date) return "0s";
            const diff = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
            if (diff < 60) return `${diff}s`;
            const m = Math.floor(diff / 60);
            if (m < 60) return `${m}m`;
            const h = Math.floor(m / 60);
            if (h < 24) return `${h}h`;
            const d = Math.floor(h / 24);
            return `${d}d`;
          };
          return (
            <div key={col.key} className={classes.column}>
              <div className={classes.columnHeader}>
                <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <div className={classes.columnStripe} style={{ background: col.color }} />
                  <div style={{ minWidth: 0 }}>
                    <div className={classes.columnLabel}>{col.label}</div>
                    <div className={classes.columnMeta}>
                      <span>{currencyBRL(total)}</span>
                    </div>
                  </div>
                </div>
                <div className={classes.columnRight}>
                  <span className={classes.columnCount}>{list.length}</span>
                  <IconButton size="small" className={classes.columnMenuBtn}>
                    <MoreHorizIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>

              <Droppable droppableId={col.key}>
                {(providedDroppable) => (
                  <div className={classes.cardsWrapper} ref={providedDroppable.innerRef} {...providedDroppable.droppableProps}>
                    {list.map((l, index) => (
                      <Draggable draggableId={String(l.id)} index={index} key={l.id}>
                        {(providedDraggable) => (
                          <div
                            ref={providedDraggable.innerRef}
                            {...providedDraggable.draggableProps}
                            {...providedDraggable.dragHandleProps}
                            className={classes.card}
                            onClick={() => onEdit(l)}
                          >
                            <div className={classes.cardTimeBadge} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <QueryBuilderIcon style={{ fontSize: 14, color: "#9CA3AF" }} />
                              <span>{since(l.date)}</span>
                            </div>
                            <IconButton
                              className={classes.cardDeleteBtn}
                              size="small"
                              onClick={(e) => { e.stopPropagation(); onDelete && onDelete(l); }}
                              title="Excluir lead"
                              onMouseDown={(e) => e.stopPropagation()}
                              onMouseUp={(e) => e.stopPropagation()}
                            >
                              <CloseIcon style={{ fontSize: 12 }} />
                            </IconButton>
                            <IconButton
                              className={classes.cardApproveBtn}
                              size="small"
                              title="Concluir"
                              onMouseDown={(e) => e.stopPropagation()}
                              onMouseUp={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); }}
                            >
                              <CheckCircleOutlineIcon style={{ fontSize: 12 }} />
                            </IconButton>
                            <div className={classes.cardTopBar} style={{ background: col.color }} />
                            {(() => {
                              // obtém contato via lead ou via lista carregada localmente (prop contacts)
                              const contact = l.contact || (Array.isArray(contacts) ? contacts.find((c) => String(c.id) === String(l.contactId)) : null);
                              return (
                                <>
                                  <ContactAvatar contact={contact} lead={l} classes={classes} />
                                  <span className={classes.avatarStatusDot} />
                                  <div className={classes.cardHeader}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div className={classes.cardTitle}>
                                        {l.name || "Sem nome"}
                                      </div>
                                      {(l.companyName || contact?.name || l.contactId) && (
                                        <div className={classes.cardSub}>
                                          {l.companyName || contact?.name || l.contactId}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {(l.phone || contact?.number) && (
                                    <div className={`${classes.cardRow} ${classes.cardEdgeLeft}`} style={{ textAlign: "left" }}>
                                      <PhoneIcon style={{ fontSize: 10, color: "#9CA3AF" }} />
                                      <span>{l.phone || contact?.number}</span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                            {/* valor menor (abaixo do telefone, canto esquerdo) */}
                            <div className={`${classes.cardValue} ${classes.cardEdgeLeft}`} style={{ textAlign: "left" }}>
                              {currencyBRL(l.value)}
                            </div>
                            <div
                              className={`${classes.cardTagRow} ${classes.cardEdgeLeft}`}
                              style={{ textAlign: "left", cursor: "pointer" }}
                              onClick={(e) => onOpenTagCreator && onOpenTagCreator(e, l)}
                            >
                              <LocalOfferOutlinedIcon style={{ fontSize: 12, color: "#3B82F6", opacity: 0.85 }} />
                              {Array.isArray(l.tags) && l.tags.length > 0 && (
                                <span className={classes.tagChip}>{l.tags[0]}</span>
                              )}
                              <AddIcon style={{ fontSize: 12, color: "#3B82F6", opacity: 0.9 }} />
                            </div>
                            {l.responsible?.name && (
                              <div className={`${classes.cardResponsible} ${classes.cardEdgeLeft}`} style={{ textAlign: "left" }}>
                                <PersonOutlineIcon style={{ fontSize: 9, color: "#4B5563" }} />
                                <span style={{ fontSize: 8, color: "#4B5563" }}>{l.responsible?.name}</span>
                              </div>
                            )}
                            <div className={classes.cardFooter} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {providedDroppable.placeholder}
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<AddIcon />}
                      className={classes.addLeadBtn}
                      onClick={() => onAdd(col.key)}
                    >
                      Adicionar Lead
                    </Button>
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

const LeadsList = ({ leads }) => {
  const getStatusMeta = (key) => {
    const k = String(key || "").toLowerCase();
    const meta = COLUMN_DEFS.find((c) => c.key === k);
    return meta || { label: String(key || "").toUpperCase(), color: "#E5E7EB" };
    };
  return (
    <TableContainer component={Paper} style={{ height: '100%', overflow: 'auto' }}>
      <Table stickyHeader aria-label="leads table">
        <TableHead>
          <TableRow>
            <TableCell>Lead</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Valor</TableCell>
            <TableCell>Contato</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.isArray(leads) && leads.length > 0 ? (
            leads.map((item) => (
              <TableRow key={item.id}>
                <TableCell component="th" scope="row">
                  {item.name}
                </TableCell>
                <TableCell>
                  {(() => {
                    const meta = getStatusMeta(item.status);
                    return (
                      <Chip
                        label={meta.label}
                        size="small"
                        style={{ background: `${meta.color}20`, color: meta.color, fontWeight: 600 }}
                      />
                    );
                  })()}
                </TableCell>
                <TableCell>{currencyBRL(item.value)}</TableCell>
                <TableCell>{item.contact?.name || item.contactId || "—"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} align="center">
                Nenhum lead encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const LeadsSales = () => {
  const classes = useStyles();
  const [viewMode, setViewMode] = useState("board");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [status, setStatus] = useState("");
  const [responsible, setResponsible] = useState(null);
  const [contact, setContact] = useState(null);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [leadsState, setLeadsState] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [contactsList, setContactsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const { user, socket } = useContext(AuthContext);
  const kanbanRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dash, setDash] = useState(null);

  const [anchorResp, setAnchorResp] = useState(null);
  const [anchorContact, setAnchorContact] = useState(null);
  const [anchorPeriodo, setAnchorPeriodo] = useState(null);
  const [anchorTodos, setAnchorTodos] = useState(null);
  // Tag creator popover
  const [tagAnchor, setTagAnchor] = useState(null);
  const [tagLead, setTagLead] = useState(null);
  const [tagText, setTagText] = useState("");

  useEffect(() => {
    async function fetchFilters() {
      try {
        const { data: contactsData } = await api.get("/contacts/list");
        const list = contactsData || [];
        setContactsList(list);
        const { data: usersResp } = await api.get("/users", { params: { searchParam: "" } });
        setUsersList(usersResp?.users || []);
      } catch (err) {
      }
    }
    fetchFilters();
  }, []);

  const { leadsSales, loading, count, hasMore } = useLeadsSales({
    pageNumber,
    searchParam,
    status,
    responsibleId: responsible?.id,
    contactId: contact?.id,
    dateStart,
    dateEnd
  });

  useEffect(() => {
    setLeadsState(leadsSales || []);
  }, [leadsSales]);

  useEffect(() => {
    let active = true;
    async function fetchDashboard() {
      try {
        const data = await leadsSalesService.dashboard({
          status,
          responsibleId: responsible?.id,
          contactId: contact?.id,
          dateStart,
          dateEnd
        });
        if (active) setDash(data);
      } catch (err) {
        // no toast noise here
      }
    }
    fetchDashboard();
    return () => { active = false; };
  }, [status, responsible?.id, contact?.id, dateStart, dateEnd]);

  useEffect(() => {
    if (!socket || !user || !user.companyId) return;
    const onLeadEvent = (data) => {
      if (data?.action === "create" || data?.action === "update") {
        setLeadsState((prev) => {
          const idx = prev.findIndex((x) => String(x.id) === String(data.lead.id));
          if (idx >= 0) {
            const clone = [...prev];
            clone[idx] = data.lead;
            return clone;
          }
          return [data.lead, ...prev.filter(x => String(x.id) !== String(data.lead.id))];
        });
      }
      if (data?.action === "delete") {
        setLeadsState((prev) => prev.filter(x => String(x.id) !== String(data.id)));
      }
    };
    socket.on(`company-${user.companyId}-leads-sales`, onLeadEvent);
    return () => {
      socket.off(`company-${user.companyId}-leads-sales`, onLeadEvent);
    };
  }, [socket, user]);

  useEffect(() => {
    if (!socket || !user?.companyId) return;
    const onContact = (data) => {
      if (!data?.contact) return;
      setContactsList((prev) => {
        const idx = prev.findIndex((c) => String(c.id) === String(data.contact.id));
        return idx >= 0 ? prev.map((c) => (String(c.id) === String(data.contact.id) ? data.contact : c)) : [data.contact, ...prev];
      });
    };
    socket.on(`company-${user.companyId}-contact`, onContact);
    return () => {
      socket.off(`company-${user.companyId}-contact`, onContact);
    };
  }, [socket, user]);

  const openTagCreator = (e, lead) => {
    e.stopPropagation();
    setTagAnchor(e.currentTarget);
    setTagLead(lead);
    setTagText("");
  };
  const closeTagCreator = () => {
    setTagAnchor(null);
    setTagLead(null);
    setTagText("");
  };
  const handleAddTag = async () => {
    try {
      const text = String(tagText || "").trim();
      if (!text || !tagLead) return;
      const newTags = Array.isArray(tagLead.tags) ? [...tagLead.tags, text] : [text];
      const record = await leadsSalesService.update(tagLead.id, { tags: newTags });
      setLeadsState((prev) => prev.map((x) => String(x.id) === String(record.id) ? record : x));
      closeTagCreator();
      toast.success("Tag adicionada");
    } catch (err) {
      toastError(err);
    }
  };

  const viewModes = [
    { value: "board", label: "Quadro", icon: <KanbanIcon /> },
    { value: "list", label: "Lista", icon: <ListIcon /> },
    { value: "calendar", label: "Calendário", icon: <CalendarIcon /> },
    { value: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  ];

  const handleSearch = (value) => setSearchParam(value);

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
    if (el?.requestFullscreen) return el.requestFullscreen();
    if (el?.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    if (el?.mozRequestFullScreen) return el.mozRequestFullScreen();
    if (el?.msRequestFullscreen) return el.msRequestFullscreen();
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

  const navActions = (
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
      <div className={layout.filterItem}>
        <Typography className={layout.filterLabel}>Pipeline</Typography>
        <ExpandMoreIcon className={layout.chevronIcon} />
      </div>
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
        <div className={classes.popoverContent}>
          <Autocomplete
            fullWidth
            value={responsible}
            options={usersList}
            onChange={(e, val) => setResponsible(val)}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => <TextField {...params} label="Responsável" variant="outlined" />}
          />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setResponsible(null)}>Limpar</Button>
          </div>
        </div>
      </Popover>

      <div className={layout.filterItem} onClick={(e) => setAnchorContact(e.currentTarget)}>
        <Typography className={layout.filterLabel}>Contato/Empresa</Typography>
        <ExpandMoreIcon className={layout.chevronIcon} />
      </div>
      <Popover
        open={Boolean(anchorContact)}
        anchorEl={anchorContact}
        onClose={() => setAnchorContact(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <div className={classes.popoverContent}>
          <Autocomplete
            fullWidth
            value={contact}
            options={contactsList}
            onChange={(e, val) => setContact(val)}
            getOptionLabel={(option) => option.name || option.number || String(option.id)}
            renderInput={(params) => <TextField {...params} label="Contato/Empresa" variant="outlined" />}
          />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setContact(null)}>Limpar</Button>
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
        <div className={classes.popoverContent}>
          <Grid container spacing={2} className={classes.popoverGrid}>
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
        <div className={classes.popoverContent}>
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
                setResponsible(null);
                setContact(null);
                setStatus("");
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
        description="Leads e Vendas"
        onCreateClick={() => { setEditing(null); setDrawerOpen(true); }}
        searchPlaceholder="Filtrar por nome do lead, empresa..."
        searchValue={searchParam}
        onSearchChange={handleSearch}
        stats={[]}
        navActions={navActions}
        viewModes={viewModes}
        currentViewMode={viewMode}
        onViewModeChange={setViewMode}
        rightFilters={rightFilters}
        scrollContent={viewMode !== "calendar"}
      >
        {loading ? (
          <div style={{ padding: 20, textAlign: "center" }}>Carregando...</div>
        ) : (
          <>
            {viewMode === "dashboard" && (() => {
              const palette = {
                bg: "#F8FAFC",
                card: "#FFFFFF",
                text: "#0F172A",
                sub: "#64748B",
                border: "#E2E8F0",
                shadow: "0 2px 8px rgba(2,6,23,0.06)",
                blue: "#3B82F6",
                green: "#10B981",
                red: "#EF4444",
                amber: "#F59E0B",
                indigo: "#6366F1"
              };
              const summary = dash?.summary || { totalLeads: leadsState.length, leadsWon: 0, leadsLost: 0, totalSales: 0, efficiency: 0 };
              const kpi = [
                { label: "Total de Leads", value: summary.totalLeads, color: palette.indigo, icon: <PersonOutlineIcon style={{ color: palette.indigo }} /> },
                { label: "Total de Vendas", value: (summary.totalSales || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}), color: palette.green, icon: <BusinessCenterIcon style={{ color: palette.green }} /> },
                { label: "Eficiência", value: `${summary.efficiency?.toFixed ? summary.efficiency.toFixed(0) : summary.efficiency}%`, sub: "Conversão relativa entre leads e vendas", color: palette.amber, icon: <CheckCircleOutlineIcon style={{ color: palette.amber }} /> },
                { label: "Leads Ganhos", value: summary.leadsWon || 0, color: palette.green, icon: <CheckCircleOutlineIcon style={{ color: palette.green }} /> },
                { label: "Leads Perdidos", value: summary.leadsLost || 0, color: palette.red, icon: <CloseIcon style={{ color: palette.red }} /> }
              ];
              // Dados para mini-sparklines
              const seriesLeads = (dash?.clientsValueByDay || []).map(d => d.leads);
              const seriesRevenue = (dash?.revenuePerDay || []).map(d => d.revenue);
              const sparkOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } },
                elements: { point: { radius: 0 } }
              };
              const labelsRevenue = (dash?.revenuePerDay || []).map(d => d.date);
              const dataRevenue = (dash?.revenuePerDay || []).map(d => d.revenue);
              const labelsClients = (dash?.clientsValueByDay || []).map(d => d.date);
              const dataClients = (dash?.clientsValueByDay || []).map(d => d.leads);
              const dataValues = (dash?.clientsValueByDay || []).map(d => d.value);
              const rankingLabels = (dash?.rankingResponsibles || []).map(r => r.name);
              const rankingValues = (dash?.rankingResponsibles || []).map(r => r.value);
              const originLabels = (dash?.conversionByOrigin || []).map(o => o.origin);
              const originValues = (dash?.conversionByOrigin || []).map(o => o.won);

              const chartHeight = 180;
              const lineOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { maxRotation: 0, color: palette.sub }, grid: { display: false } },
                  y: { ticks: { color: palette.sub }, grid: { color: "#eef2f7" }, beginAtZero: true }
                }
              };
              const lineData = {
                labels: labelsRevenue,
                datasets: [{
                  label: "Receita",
                  data: dataRevenue,
                  fill: true,
                  borderColor: palette.indigo,
                  backgroundColor: "rgba(99,102,241,0.12)",
                  tension: 0.35
                }]
              };
              const barOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                scales: {
                  x: { stacked: false, ticks: { color: palette.sub }, grid: { display: false }, beginAtZero: true },
                  y: { stacked: false, ticks: { color: palette.sub }, grid: { color: "#eef2f7" } }
                }
              };
              const barData = {
                labels: labelsClients,
                datasets: [
                  { type: "bar", label: "Leads", data: dataClients, backgroundColor: palette.indigo, borderRadius: 6, maxBarThickness: 22 },
                  { type: "bar", label: "Valor", data: dataValues, backgroundColor: palette.blue, borderRadius: 6, maxBarThickness: 22, yAxisID: "y1" }
                ]
              };
              const barRanking = {
                labels: rankingLabels,
                datasets: [{ label: "Valor", data: rankingValues, backgroundColor: palette.blue, borderRadius: 6, maxBarThickness: 22 }]
              };
              const doughnutData = {
                labels: originLabels,
                datasets: [{ data: originValues, backgroundColor: [palette.indigo, palette.blue, palette.green, palette.amber, palette.red] }]
              };
              const doughnutOptions = {
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom", labels: { color: palette.sub } } },
                layout: { padding: { top: 8, bottom: 8 } }
              };

              return (
                <div style={{ padding: 4 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(180px, 1fr))", gap: 16, margin: 0 }}>
                    {kpi.map((c) => (
                      <Paper key={c.label} style={{
                        borderRadius: 12,
                        padding: 12,
                        border: `1px solid ${palette.border}`,
                        boxShadow: palette.shadow,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 8,
                        minHeight: 110,
                        background: `linear-gradient(180deg, rgba(99,102,241,0.06) 0%, rgba(255,255,255,0.88) 100%)`
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ fontSize: 13, color: palette.text, whiteSpace: "nowrap", fontWeight: 600 }}>{c.label}</div>
                          <div style={{ fontWeight: 700, fontSize: 18, color: palette.text, whiteSpace: "nowrap" }}>{c.value}</div>
                        </div>
                        {c.sub && <div style={{ fontSize: 11, color: palette.sub }}>{c.sub}</div>}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 10, background: `${c.color}15`,
                            display: "grid", placeItems: "center", marginRight: 8
                          }}>
                            {c.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ width: "100%", height: 18 }}>
                              {(() => {
                                let data = seriesLeads;
                                if (c.label === "Total de Vendas") data = seriesRevenue;
                                if (c.label === "Leads Ganhos") data = seriesRevenue.map(v => (v > 0 ? 1 : 0));
                                if (c.label === "Leads Perdidos") data = seriesLeads.map(() => 0);
                                const sparkData = {
                                  labels: data.map((_, i) => i + 1),
                                  datasets: [{
                                    data,
                                    borderColor: c.color,
                                    backgroundColor: `${c.color}20`,
                                    fill: true,
                                    tension: 0.35
                                  }]
                                };
                                return <Line height={18} options={sparkOptions} data={sparkData} />;
                              })()}
                            </div>
                          </div>
                        </div>
                        {(c.label === "Total de Leads" || c.label === "Total de Vendas") && (
                          <div style={{ width: "100%", height: 10, marginTop: 6 }}>
                            {(() => {
                              const isSales = c.label === "Total de Vendas";
                              const data = isSales ? seriesRevenue : seriesLeads;
                              const lineColor = isSales ? palette.blue : palette.indigo;
                              const bottomSparkOptions = {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                scales: { x: { display: false }, y: { display: false } },
                                elements: { point: { radius: 0 } }
                              };
                              const bottomSparkData = {
                                labels: data.map((_, i) => i + 1),
                                datasets: [{
                                  data,
                                  borderColor: lineColor,
                                  backgroundColor: `${lineColor}00`,
                                  fill: false,
                                  tension: 0.45,
                                  borderWidth: 2
                                }]
                              };
                              return <Line height={10} options={bottomSparkOptions} data={bottomSparkData} />;
                            })()}
                          </div>
                        )}
                      </Paper>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
                    {/* Gráfico 1 */}
                    <Paper style={{ borderRadius: 12, padding: 16, border: `1px solid ${palette.border}`, boxShadow: palette.shadow, minHeight: 260 }}>
                      <div style={{ fontSize: 14, color: palette.text, marginBottom: 6, fontWeight: 600 }}>Receita por Dia</div>
                      <Line options={lineOptions} data={lineData} height={chartHeight} />
                    </Paper>
                    {/* Gráfico 2 */}
                    <Paper style={{ borderRadius: 12, padding: 16, border: `1px solid ${palette.border}`, boxShadow: palette.shadow, minHeight: 260 }}>
                      <div style={{ fontSize: 14, color: palette.text, marginBottom: 6, fontWeight: 600 }}>Clientes x Valor</div>
                      <Bar options={barOptions} data={barData} height={chartHeight} />
                    </Paper>
                    {/* Gráfico 3 */}
                    <Paper style={{ borderRadius: 12, padding: 16, border: `1px solid ${palette.border}`, boxShadow: palette.shadow, minHeight: 260 }}>
                      <div style={{ fontSize: 14, color: palette.text, marginBottom: 6, fontWeight: 600 }}>Ranking de Responsáveis</div>
                      <Bar
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, indexAxis: "y",
                          scales: { x: { ticks: { color: palette.sub }, grid: { display: false }, beginAtZero: true }, y: { ticks: { color: palette.sub } } }
                        }}
                        data={barRanking}
                        height={chartHeight}
                      />
                    </Paper>
                    {/* Gráfico 4 */}
                    <Paper style={{ borderRadius: 12, padding: 16, border: `1px solid ${palette.border}`, boxShadow: palette.shadow, minHeight: 260 }}>
                      <div style={{ fontSize: 14, color: palette.text, marginBottom: 6, fontWeight: 600 }}>Conversão por Origem</div>
                      <Doughnut data={doughnutData} height={chartHeight} options={doughnutOptions} />
                    </Paper>
                  </div>
                </div>
              );
            })()}
            {viewMode === "list" && <LeadsList leads={leadsState} />}
            {viewMode === "calendar" && (() => {
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
              const events = (leadsState || []).map((l) => {
                const when = l.nextFollowUpAt || l.date || l.createdAt || l.updatedAt || Date.now();
                return {
                  title: l.name || l.companyName || `Lead ${l.id}`,
                  start: new Date(when),
                  end: new Date(when),
                  allDay: true,
                  resource: l
                };
              });
              const eventPropGetter = (evt) => {
                const st = String(evt?.resource?.status || "").toLowerCase();
                let backgroundColor = "#2563eb";
                if (st.includes("won") || st.includes("converted") || st.includes("fechado")) backgroundColor = "#10B981";
                if (st.includes("lost") || st.includes("perdido")) backgroundColor = "#EF4444";
                return { style: { backgroundColor, color: "#0f172a", borderRadius: 10, border: `1px solid ${backgroundColor}`, padding: "6px 8px", fontSize: 12 } };
              };
              const total = leadsState.length;
              const ganho = leadsState.filter(l => /(won|converted|fechado)/i.test(String(l.status || ""))).length;
              return (
                <div className="schedules-page" style={{ paddingTop: 8, height: 'calc(100vh - 128px)', overflow: 'hidden' }}>
                  <Grid container spacing={2} style={{ height: '100%' }}>
                    <Grid item xs={12} md={9} lg={9} style={{ height: '100%' }}>
                      <Paper style={{ padding: 8, height: '100%', display: 'flex' }}>
                        <Calendar
                          localizer={localizer}
                          views={["day","week","month"]}
                          components={{ toolbar: CustomToolbar }}
                          events={events}
                          startAccessor="start"
                          endAccessor="end"
                          eventPropGetter={eventPropGetter}
                          selectable
                          onSelectSlot={(slot) => {
                            const d = slot.start;
                            setSelectedDate(d);
                            setEditing({ date: d.toISOString().slice(0,10) });
                            setDrawerOpen(true);
                          }}
                          style={{ height: "100%", width: '100%' }}
                        />
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={3} lg={3} style={{ height: '100%' }}>
                      <div className="right-aside" style={{ height: '100%', overflowY: 'auto' }}>
                        <div className="aside-top-actions">
                          <button className="aside-action" onClick={() => { setEditing(null); setDrawerOpen(true); }}>
                            Novo Lead
                          </button>
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
                            <Typography className="aside-title" variant="body2">Lead</Typography>
                          </div>
                          {(() => {
                            const recent = [...leadsState].sort((a,b) => new Date(b.updatedAt||b.createdAt||b.date||0) - new Date(a.updatedAt||a.createdAt||a.date||0))[0];
                            return (
                          <div className="activity-item">
                                <div className="activity-icon"><BusinessCenterIcon style={{ fontSize: 18 }} /></div>
                                <div className="activity-info">
                                  <div className="activity-title">{recent?.name || "—"}</div>
                                  <div className="activity-sub">{recent?.companyName || recent?.contact?.name || "Sem empresa"}</div>
                                </div>
                                <div className="activity-time">{recent ? moment(recent.updatedAt || recent.createdAt || recent.date).format("HH:mm") : "—"}</div>
                              </div>
                            );
                          })()}
                          <div className="donut-center" style={{ position: "static", transform: "none", textAlign: "left" }}>
                            <div className="donut-total" style={{ fontSize: 24 }}>{total}</div>
                            <div className="donut-label">Total</div>
                            <div className="donut-label">Convertidos: {ganho}</div>
                          </div>
                        </Paper>
                      </div>
                    </Grid>
                  </Grid>
                </div>
              );
            })()}
            {viewMode === "board" && (
              <div ref={kanbanRef} className={classes.fixedContent} style={{ height: '100%' }}>
                <LeadsKanbanBoard
                  leads={leadsState}
                  contacts={contactsList}
                  onEdit={(lead) => { setEditing(lead); setDrawerOpen(true); }}
                  onOpenTagCreator={openTagCreator}
                  onAdd={(statusKey) => {
                    setEditing({ status: statusKey });
                    setDrawerOpen(true);
                  }}
                  onMove={async (leadId, sourceCol, destCol) => {
                    if (sourceCol === destCol) return;
                    const id = Number(leadId);
                    const newStatus = destCol;
                    setLeadsState(prev => prev.map(l => Number(l.id) === id ? { ...l, status: newStatus } : l));
                    try {
                      await leadsSalesService.update(id, { status: newStatus });
                    } catch (err) {
                      toastError(err);
                      setLeadsState(prev => prev.map(l => Number(l.id) === id ? { ...l, status: sourceCol } : l));
                    }
                  }}
                  onDelete={async (lead) => {
                    const id = Number(lead.id);
                    try {
                      await leadsSalesService.delete(id);
                      setLeadsState(prev => prev.filter(l => Number(l.id) !== id));
                      toast.success("Lead excluído.");
                    } catch (err) {
                      toastError(err);
                    }
                  }}
                />
              </div>
            )}
          </>
        )}
      </ActivitiesStyleLayout>
      {/* calendário renderizado dentro do ActivitiesStyleLayout para evitar espaçamento extra */}
      {false && (() => {
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
        const events = (leadsState || []).map((l) => {
          const when = l.nextFollowUpAt || l.date || l.createdAt || l.updatedAt || Date.now();
          return {
            title: l.name || l.companyName || `Lead ${l.id}`,
            start: new Date(when),
            end: new Date(when),
            allDay: true,
            resource: l
          };
        });
        const eventPropGetter = (evt) => {
          const st = String(evt?.resource?.status || "").toLowerCase();
          let backgroundColor = "#2563eb";
          if (st.includes("won") || st.includes("converted") || st.includes("fechado")) backgroundColor = "#10B981";
          if (st.includes("lost") || st.includes("perdido")) backgroundColor = "#EF4444";
          return { style: { backgroundColor, color: "#0f172a", borderRadius: 10, border: `1px solid ${backgroundColor}`, padding: "6px 8px", fontSize: 12 } };
        };
        const total = leadsState.length;
        const ganho = leadsState.filter(l => /(won|converted|fechado)/i.test(String(l.status || ""))).length;
        return null;
      })()}
      <Popover
        open={Boolean(tagAnchor)}
        anchorEl={tagAnchor}
        onClose={closeTagCreator}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <div style={{ padding: 10, width: 220 }}>
          <Typography variant="caption" style={{ color: "#374151" }}>
            Criar tag
          </Typography>
          <TextField
            autoFocus
            size="small"
            fullWidth
            variant="outlined"
            placeholder="Ex.: Cliente VIP"
            value={tagText}
            onChange={(e) => setTagText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddTag(); }}
            style={{ marginTop: 6 }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <Button size="small" onClick={closeTagCreator}>Cancelar</Button>
            <Button size="small" color="primary" variant="contained" onClick={handleAddTag}>
              Adicionar
            </Button>
          </div>
        </div>
      </Popover>

      <CreateLeadSaleModal
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lead={editing}
        onSave={(saved) => {
          setLeadsState((prev) => {
            const id = Number(saved.id);
            const exists = prev.some(p => Number(p.id) === id);
            return exists ? prev.map(p => Number(p.id) === id ? saved : p) : [saved, ...prev];
          });
          setEditing(null);
        }}
      />
    </>
  );
};

export default LeadsSales;
