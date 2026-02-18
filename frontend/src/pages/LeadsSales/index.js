import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  List as ListIcon,
  CalendarToday as CalendarIcon,
  ViewWeek as KanbanIcon
} from "@material-ui/icons";
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
import useLeadsSales from "../../hooks/useLeadsSales";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import CreateLeadSaleModal from "../../components/CreateLeadSaleModal";
import { AuthContext } from "../../context/Auth/AuthContext";
import Autocomplete from "@material-ui/lab/Autocomplete";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    height: "100%",
    overflow: "hidden",
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gridAutoFlow: "column",
    overflowX: "hidden",
    padding: 12,
    columnGap: 24,
    rowGap: 0,
    ...theme.scrollbarStyles,
  },
  column: {
    width: "100%",
    minWidth: 0,
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
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  columnLabel: {
    fontWeight: 600,
    color: "#111827",
    fontSize: 14,
    lineHeight: 1.2,
  },
  columnMeta: {
    display: "flex",
    gap: 16,
    alignItems: "baseline",
    color: "#6B7280",
    fontSize: 12,
  },
  columnStripe: {
    width: 5,
    alignSelf: "stretch",
    borderRadius: 12,
    marginRight: 12,
  },
  cardsWrapper: {
    marginTop: 8,
    padding: 4,
    overflowY: "auto",
    flex: 1,
    ...theme.scrollbarStyles,
  },
  card: {
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    cursor: "pointer",
    transition: "box-shadow .2s ease, transform .1s ease",
    "&:hover": {
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      transform: "translateY(-1px)",
    },
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 28,
    height: 28,
    fontSize: 13,
    background: "#F3F4F6",
    color: "#374151",
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: 14,
    color: "#111827",
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  cardValue: {
    marginTop: 8,
    fontWeight: 700,
    color: "#059669",
    fontSize: 13,
  },
  cardRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    color: "#6B7280",
    fontSize: 12,
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  addLeadBtn: {
    marginTop: 8,
    borderRadius: 12,
    textTransform: "none",
    color: "rgba(107, 114, 128, 0.85)", // cinza com leve transparência
    borderColor: "rgba(209, 213, 219, 0.8)", // borda cinza clara
    borderStyle: "dashed",
    backgroundColor: "rgba(249, 250, 251, 0.4)", // quase transparente
    minHeight: 44,
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: 0.2,
    "& .MuiSvgIcon-root": {
      fontSize: 18,
      color: "rgba(107, 114, 128, 0.8)",
    },
    "&:hover": {
      backgroundColor: "rgba(243, 244, 246, 0.5)",
      borderColor: "rgba(209, 213, 219, 0.95)",
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
  { key: "novo", label: "Novo Lead", color: "#6366F1" },         // indigo
  { key: "qualificacao", label: "Contato Inicial", color: "#8B5CF6" }, // purple
  { key: "proposta", label: "Proposta", color: "#F59E0B" },      // amber
  { key: "negociacao", label: "Reunião", color: "#F97316" },     // orange
  { key: "fechado", label: "Fechamento", color: "#10B981" },     // emerald
];

function initials(name = "") {
  const parts = String(name).trim().split(" ");
  const i1 = parts[0]?.[0] || "";
  const i2 = parts.length > 1 ? parts[1][0] : "";
  return (i1 + i2).toUpperCase();
}

const LeadsKanbanBoard = ({ leads, onEdit, onAdd }) => {
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

  return (
    <div className={classes.board}>
      {COLUMN_DEFS.map((col) => {
        const list = leadsByStatus[col.key] || [];
        const total = getTotalValue(list);
        return (
          <div key={col.key} className={classes.column}>
            <div className={classes.columnHeader}>
              <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div className={classes.columnStripe} style={{ background: col.color }} />
                <div>
                  <div className={classes.columnLabel}>{col.label}</div>
                  <div className={classes.columnMeta}>
                    <span>R$ {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span>{list.length}</span>
                  </div>
                </div>
              </div>
              <IconButton size="small">
                <MoreHorizIcon fontSize="small" />
              </IconButton>
            </div>
            <div className={classes.cardsWrapper}>
              {list.map((l) => (
                <div
                  key={l.id}
                  className={classes.card}
                  onClick={() => onEdit(l)}
                >
                  <div className={classes.cardHeader}>
                    <Avatar className={classes.avatar}>
                      {initials(l.name || l.contact?.name || "Lead")}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={classes.cardTitle}>{l.name || "Sem nome"}</div>
                      <div className={classes.cardSub}>
                        {l.contact?.name || l.contactId || "—"} • {l.responsible?.name || l.responsibleId || "—"}
                      </div>
                    </div>
                  </div>
                  {l.contact?.number && (
                    <div className={classes.cardRow}>
                      <PhoneIcon style={{ fontSize: 16, color: "#9CA3AF" }} />
                      <span>{l.contact?.number}</span>
                    </div>
                  )}
                  {l.responsible?.name && (
                    <div className={classes.cardRow}>
                      <PersonOutlineIcon style={{ fontSize: 16, color: "#9CA3AF" }} />
                      <span>{l.responsible?.name}</span>
                    </div>
                  )}
                  <div className={classes.cardValue}>
                    {l.value ? `R$ ${Number(l.value).toLocaleString()}` : "R$ 0,00"}
                  </div>
                  <div className={classes.cardFooter}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircleOutlineIcon style={{ fontSize: 16, color: "#10B981" }} />
                      <CloseIcon style={{ fontSize: 16, color: "#EF4444" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#6B7280", fontSize: 12 }}>
                      <QueryBuilderIcon style={{ fontSize: 16, color: "#9CA3AF" }} />
                      <span>{l.date ? Math.max(0, Math.round((Date.now() - new Date(l.date).getTime()) / 1000)) : 0}s</span>
                    </div>
                  </div>
                </div>
              ))}
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
          </div>
        );
      })}
    </div>
  );
};

const LeadsList = ({ leads }) => {
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
                  <Chip 
                    label={String(item.status || "").toUpperCase()} 
                    size="small" 
                    color={String(item.status).toLowerCase() === 'fechado' ? 'primary' : 'default'} 
                  />
                </TableCell>
                <TableCell>{item.value ? `R$ ${Number(item.value).toLocaleString()}` : "—"}</TableCell>
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

  const [anchorResp, setAnchorResp] = useState(null);
  const [anchorContact, setAnchorContact] = useState(null);
  const [anchorPeriodo, setAnchorPeriodo] = useState(null);
  const [anchorTodos, setAnchorTodos] = useState(null);

  useEffect(() => {
    async function fetchFilters() {
      try {
        const { data: contactsData } = await api.get("/contacts/list");
        setContactsList(contactsData || []);
        const { data: usersResp } = await api.get("/users", { params: { searchParam: "" } });
        setUsersList(usersResp?.users || []);
      } catch (err) {
        // ignore errors in filters
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

  const viewModes = [
    { value: "board", label: "Quadro", icon: <KanbanIcon /> },
    { value: "list", label: "Lista", icon: <ListIcon /> },
    { value: "calendar", label: "Calendário", icon: <CalendarIcon /> },
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
      >
        {loading ? (
          <div style={{ padding: 20, textAlign: "center" }}>Carregando...</div>
        ) : (
          <>
            {viewMode === "list" && <LeadsList leads={leadsState} />}
            {viewMode === "calendar" && (
              <Paper style={{ padding: 16, height: '100%' }}>
                <Typography variant="h6">Calendário</Typography>
                <div style={{ marginTop: 20, textAlign: 'center', color: '#666' }}>
                  Em breve: integração com calendário
                </div>
              </Paper>
            )}
            {viewMode === "board" && (
              <div ref={kanbanRef} style={{ height: '100%', width: '100%' }}>
                <LeadsKanbanBoard
                  leads={leadsState}
                  onEdit={(lead) => { setEditing(lead); setDrawerOpen(true); }}
                  onAdd={(statusKey) => {
                    setEditing({ status: statusKey });
                    setDrawerOpen(true);
                  }}
                />
              </div>
            )}
          </>
        )}
      </ActivitiesStyleLayout>

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
