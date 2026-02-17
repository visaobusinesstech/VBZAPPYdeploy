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
  Typography
} from "@material-ui/core";
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
  popoverContent: {
    padding: theme.spacing(2),
    maxWidth: 360
  },
  popoverGrid: {
    width: 320
  }
}));

const BoardPlaceholder = ({ leads }) => {
  const columns = [
    { key: "novo", label: "Novo Lead" },
    { key: "qualificacao", label: "Qualificação" },
    { key: "proposta", label: "Proposta" },
    { key: "negociacao", label: "Negociação" },
    { key: "fechado", label: "Fechado" }
  ];
  return (
    <Grid container spacing={2} style={{ height: '100%', overflowX: 'auto', flexWrap: 'nowrap' }}>
      {columns.map((col) => (
        <Grid item xs={12} sm={6} md={4} key={col.key} style={{ minWidth: 300 }}>
          <Paper style={{ height: '100%', padding: 16, backgroundColor: '#fff' }}>
            <Typography variant="subtitle1" style={{ color: '#111827', fontWeight: 600 }}>
              {col.label}
            </Typography>
            <div style={{ marginTop: 8 }}>
              {(leads || []).filter(l => String(l.status || '').toLowerCase() === col.key).map(l => (
                <Paper key={l.id} style={{ padding: 8, marginBottom: 8, borderRadius: 8, border: "1px solid #e5e7eb" }} variant="outlined">
                  <Typography variant="body2" style={{ fontWeight: 500 }}>{l.name || "Sem nome"}</Typography>
                  <Typography variant="caption" color="textSecondary">{l.value ? `R$ ${Number(l.value).toLocaleString()}` : "—"}</Typography>
                </Paper>
              ))}
            </div>
          </Paper>
        </Grid>
      ))}
    </Grid>
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
        searchPlaceholder="Buscar leads..."
        searchValue={searchParam}
        onSearchChange={handleSearch}
        stats={[]}
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
            {viewMode === "board" && <BoardPlaceholder leads={leadsState} />}
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
