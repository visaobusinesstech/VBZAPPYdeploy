import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { useTranslation } from "react-i18next";
import {
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon,
  Add as AddIcon
} from "@material-ui/icons";
import MailOutlineIcon from "@material-ui/icons/MailOutline";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import CancelOutlinedIcon from "@material-ui/icons/CancelOutlined";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { useLocation, useHistory } from "react-router-dom";
import qs from "query-string";

import ActivitiesStyleLayout from "../../components/ActivitiesStyleLayout";
import { Button, CircularProgress, Typography as MuiTypography, Popover } from "@material-ui/core";
import api from "../../services/api";
import { toast } from "react-toastify";
import useEmail from "../../hooks/useEmail";

// Placeholders for views
import { Grid, Paper, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ButtonGroup, Select, MenuItem, TextField, InputAdornment, Button as MuiButton, Dialog, DialogTitle, DialogContent, DialogActions, Stepper, Step, StepLabel, Chip, Avatar } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend, Filler);

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

const EmailDashboard = ({ totals = { templates: 2, sent: 3, scheduled: 0, success: 90 } }) => {
  const [chartDate, setChartDate] = useState("");
  const [anchorChartDate, setAnchorChartDate] = useState(null);
  const [period, setPeriod] = useState("week"); // week | month | year

  const fmtDate = (iso) => {
    if (!iso) return "";
    try {
      const [y, m, d] = iso.split("-");
      return `${d}/${m}/${y}`;
    } catch {
      return iso;
    }
  };
  const kpis = [
    { title: "Templates", value: totals.templates, subtitle: "Total de templates criados", Icon: DescriptionIcon, circle: "#E9D5FF", color: "#1E293B" },
    { title: "Envios", value: totals.sent, subtitle: "Total de mensagens enviadas", Icon: EmailIcon, circle: "#A7F3D0", color: "#1E293B" },
    { title: "Agendamentos", value: totals.scheduled, subtitle: "Total de envios agendados", Icon: CalendarIcon, circle: "#FDE68A", color: "#1E293B" },
    { title: "Taxa de Sucesso", value: `${totals.success}%`, subtitle: "Emails entregues com sucesso", Icon: CheckCircleIcon, circle: "#A7F3D0", color: "#10B981" },
  ];

  const chartData = React.useMemo(() => {
    let labels = [];
    let data = [];
    if (period === "week") {
      labels = ["04/01", "05/01", "06/01", "07/01", "08/01", "09/01", "10/01"];
      data = [0, 0, 0, 0, 0, 0, 2];
    } else if (period === "month") {
      labels = ["01", "05", "10", "15", "20", "25", "30"];
      data = [0, 1, 0, 2, 0, 1, 3];
    } else {
      labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      data = [2, 1, 3, 0, 4, 2, 5, 1, 3, 2, 4, 6];
    }
    return {
      labels,
      datasets: [
        {
          label: "Envios",
          data,
          fill: false,
          borderColor: "#1E293B",
          tension: 0.3,
          borderWidth: 2,
          pointBackgroundColor: "#1E293B",
        },
      ],
    };
  }, [period]);

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 0.5 },
        grid: { borderDash: [4, 4], color: "#E2E8F0" },
        max: 2,
      },
      x: {
        grid: { display: false },
      },
    },
    elements: { point: { radius: 4 } },
  };

  return (
    <Grid container spacing={3}>
      {kpis.map(({ title, value, subtitle, Icon, circle, color }) => (
        <Grid item xs={12} sm={6} md={3} key={title}>
          <Paper style={{ padding: 16, borderRadius: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: circle, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon style={{ fontSize: 18, color: "#1E293B" }} />
              </div>
              <Typography variant="body2" style={{ color: "#111827", opacity: 1 }}>{title}</Typography>
            </div>
            <Typography variant="h4" style={{ fontWeight: 700, color }}>{value}</Typography>
            <Typography variant="caption" style={{ color: "#64748B" }}>{subtitle}</Typography>
          </Paper>
        </Grid>
      ))}

      <Grid item xs={12}>
        <Paper style={{ padding: 16, borderRadius: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <Typography variant="h6" style={{ color: "#1E293B", fontWeight: 600 }}>Tendência de Envios</Typography>
              <Typography variant="body2" style={{ color: "#64748B" }}>Quantidade de emails enviados por período</Typography>
            </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ButtonGroup variant="outlined" color="default">
                  <MuiButton
                    onClick={() => setPeriod("week")}
                    style={{
                      backgroundColor: period === "week" ? "#131B2D" : "#fff",
                      color: period === "week" ? "#fff" : "#111827",
                      borderColor: "#E2E8F0",
                      fontWeight: 400
                    }}
                  >
                    Semana
                  </MuiButton>
                  <MuiButton
                    onClick={() => setPeriod("month")}
                    style={{
                      backgroundColor: period === "month" ? "#131B2D" : "#fff",
                      color: period === "month" ? "#fff" : "#111827",
                      borderColor: "#E2E8F0",
                      fontWeight: 400
                    }}
                  >
                    Mês
                  </MuiButton>
                  <MuiButton
                    onClick={() => setPeriod("year")}
                    style={{
                      backgroundColor: period === "year" ? "#131B2D" : "#fff",
                      color: period === "year" ? "#fff" : "#111827",
                      borderColor: "#E2E8F0",
                      fontWeight: 400
                    }}
                  >
                    Ano
                  </MuiButton>
                </ButtonGroup>
                <MuiButton
                  variant="outlined"
                  onClick={(e) => setAnchorChartDate(e.currentTarget)}
                  startIcon={<CalendarIcon style={{ fontSize: 16, color: "#9CA3AF" }} />}
                  style={{ background: "#fff", color: "#111827", borderColor: "#E2E8F0", fontWeight: 400, padding: "6px 10px", minWidth: 124 }}
                >
                  {chartDate ? fmtDate(chartDate) : "dd/mm/aaaa"}
                </MuiButton>
                <Popover
                  open={Boolean(anchorChartDate)}
                  anchorEl={anchorChartDate}
                  onClose={() => setAnchorChartDate(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                >
                  <div style={{ padding: 12 }}>
                    <TextField
                      type="date"
                      value={chartDate}
                      onChange={(e) => setChartDate(e.target.value)}
                      variant="outlined"
                      size="small"
                    />
                  </div>
                </Popover>
            </div>
          </div>
          <Line data={chartData} options={chartOptions} height={88} />
        </Paper>
      </Grid>
    </Grid>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: theme.spacing(3),
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    marginTop: theme.spacing(2),
    overflowY: "visible",
    maxWidth: 1120,
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: 16,
    paddingRight: 16,
  },
}));

const EmailPage = () => {
  const classes = useStyles();
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [anchorStatus, setAnchorStatus] = useState(null);
  const [anchorDate, setAnchorDate] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleStep, setScheduleStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const { emails, loading, count } = useEmail({
      pageNumber: 1,
      searchParam: ""
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    const parsed = qs.parse(location.search);
    if (parsed.tab === "agendamento" || parsed.contacts) {
      setActiveTab("agendamento");
    }
    if (parsed.tab === "historico") {
      setActiveTab("historico");
    }
    if (parsed.tab === "template") {
      setActiveTab("template");
    }
    if (parsed.contacts) {
      const ids = String(parsed.contacts).split(",").filter(Boolean);
      setRecipients(ids);
    }
  }, [location.search]);

  const templates = [
    { id: "tpl-1", name: "Boas-vindas", thumbnail: "https://via.placeholder.com/80x50?text=T1" },
    { id: "tpl-2", name: "Promoção", thumbnail: "https://via.placeholder.com/80x50?text=T2" },
  ];

  const openScheduleWizard = (presetRecipients = []) => {
    if (presetRecipients.length) setRecipients(presetRecipients);
    setScheduleStep(0);
    setScheduleOpen(true);
  };

  const closeScheduleWizard = () => setScheduleOpen(false);

  const tabs = [
    { label: "Dashboard", value: "dashboard", icon: <DashboardIcon /> },
    { label: "Template", value: "template", icon: <DescriptionIcon /> },
    { label: "Agendamento", value: "agendamento", icon: <CalendarIcon /> },
    { label: "Histórico", value: "historico", icon: <EmailIcon /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <EmailDashboard totals={{ templates: 2, sent: emails?.length || 0, scheduled: 0, success: 90 }} />;
      case "template":
        return (
          <Paper style={{ padding: 16, borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Typography variant="h6" style={{ color: "#1E293B", fontWeight: 600 }}>Templates</Typography>
              <Button
                variant="contained"
                disableElevation
                startIcon={<AddIcon style={{ color: "#fff" }} />}
                onClick={() => toast.info("Editor de Template em breve")}
                style={{
                  backgroundColor: "#131B2D",
                  color: "#fff",
                  textTransform: "none",
                  borderRadius: 8,
                  padding: "8px 14px"
                }}
              >
                Criar Novo Template
              </Button>
            </div>
            <Grid container spacing={2}>
              {templates.map(tpl => (
                <Grid item xs={12} sm={6} md={4} key={tpl.id}>
                  <Paper style={{ padding: 12, display: "flex", gap: 12, alignItems: "center", borderRadius: 12 }}>
                    <img src={tpl.thumbnail} alt={tpl.name} style={{ width: 80, height: 50, objectFit: "cover", borderRadius: 6, border: "1px solid #E2E8F0" }} />
                    <div style={{ flex: 1 }}>
                      <Typography variant="subtitle1" style={{ color: "#1E293B", fontWeight: 500 }}>{tpl.name}</Typography>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <Button size="small" variant="outlined" onClick={() => { setSelectedTemplate(tpl.id); toast.info("Editar (stub)"); }}>Editar</Button>
                        <Button size="small" variant="outlined" onClick={() => toast.success("Pré-visualização (stub)")}>Pré-visualizar</Button>
                        <Button size="small" variant="outlined" color="secondary" onClick={() => toast.warn("Excluir (stub)")}>Excluir</Button>
                      </div>
                    </div>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        );
      case "agendamento":
        return (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <Button variant="contained" color="primary" onClick={() => openScheduleWizard(recipients)}>
                Agendar Envio
              </Button>
            </div>
            <EmailCalendar data={emails} />
          </>
        );
      case "historico":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10B981", display: "inline-block" }} />
              <span style={{ color: "#10B981", fontSize: 14 }}>Atualizações em tempo real ativadas</span>
            </div>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper style={{ padding: 16, borderRadius: 12, border: "1px solid #E5E7EB", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MailOutlineIcon style={{ color: "#1E40AF" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>Total</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1 }}>2</span>
                    </div>
                  </div>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper style={{ padding: 16, borderRadius: 12, border: "1px solid #E5E7EB", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircleOutlineIcon style={{ color: "#059669" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>Enviados</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1 }}>2</span>
                    </div>
                  </div>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper style={{ padding: 16, borderRadius: 12, border: "1px solid #E5E7EB", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CancelOutlinedIcon style={{ color: "#DC2626" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>Erros</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1 }}>0</span>
                    </div>
                  </div>
                </Paper>
              </Grid>
            </Grid>

            <Paper style={{ padding: 16, borderRadius: 12, border: "1px solid #E5E7EB", background: "#FFFFFF" }}>
              <Typography variant="h6" style={{ fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>Histórico de Envios</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ color: "#6B7280", fontWeight: 600 }}>Data/Hora</TableCell>
                      <TableCell style={{ color: "#6B7280", fontWeight: 600 }}>Destinatário</TableCell>
                      <TableCell style={{ color: "#6B7280", fontWeight: 600 }}>Remetente</TableCell>
                      <TableCell style={{ color: "#6B7280", fontWeight: 600 }}>Status</TableCell>
                      <TableCell style={{ color: "#6B7280", fontWeight: 600 }}>Tipo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell style={{ color: "#111827" }}>10/01/2026 15:41</TableCell>
                      <TableCell>
                        <div style={{ color: "#111827", fontWeight: 600 }}>PLAN AUTOMAÇÃO</div>
                        <div style={{ color: "#6B7280", fontSize: 12 }}>daviresende3322@gmail.com</div>
                      </TableCell>
                      <TableCell>
                        <div style={{ color: "#111827", fontWeight: 600 }}>VISÃO BUSINESS</div>
                        <div style={{ color: "#6B7280", fontSize: 12 }}>daviresende3322@gmail.com</div>
                      </TableCell>
                      <TableCell>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 10px", borderRadius: 999, background: "#ECFDF5", color: "#059669", fontWeight: 600, fontSize: 12 }}>
                          <CheckCircleOutlineIcon style={{ fontSize: 16 }} /> Enviado
                        </span>
                      </TableCell>
                      <TableCell style={{ color: "#6B7280" }}>—</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ color: "#111827" }}>27/10/2025 22:41</TableCell>
                      <TableCell>
                        <div style={{ color: "#111827", fontWeight: 600 }}>S</div>
                        <div style={{ color: "#6B7280", fontSize: 12 }}>visaobusinesstech@gmail.com</div>
                      </TableCell>
                      <TableCell>
                        <div style={{ color: "#111827", fontWeight: 600 }}>VISÃO BUSINESS</div>
                        <div style={{ color: "#6B7280", fontSize: 12 }}>daviresende3322@gmail.com</div>
                      </TableCell>
                      <TableCell>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 10px", borderRadius: 999, background: "#ECFDF5", color: "#059669", fontWeight: 600, fontSize: 12 }}>
                          <CheckCircleOutlineIcon style={{ fontSize: 16 }} /> Enviado
                        </span>
                      </TableCell>
                      <TableCell style={{ color: "#6B7280" }}>—</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </div>
        );
      default:
        return <EmailDashboard totals={{ templates: 2, sent: emails?.length || 0, scheduled: 0, success: 90 }} />;
    }
  };

  return (
    <ActivitiesStyleLayout
      searchPlaceholder="Buscar emails..."
      viewModes={tabs}
      currentViewMode={activeTab}
      onViewModeChange={(val) => setActiveTab(val)}
      scrollContent={false}
      rightFilters={({ classes: layout }) => (
        <>
          <div className={layout.filterItem} onClick={(e) => setAnchorStatus(e.currentTarget)}>
            <MuiTypography className={layout.filterLabel}>Status</MuiTypography>
            <ExpandMoreIcon className={layout.chevronIcon} />
          </div>
          <Popover
            open={Boolean(anchorStatus)}
            anchorEl={anchorStatus}
            onClose={() => setAnchorStatus(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <div style={{ padding: 8, minWidth: 160 }}>
              <MenuItem selected={statusFilter === ""} onClick={() => { setStatusFilter(""); setAnchorStatus(null); }}>Todos</MenuItem>
              <MenuItem selected={statusFilter === "enviado"} onClick={() => { setStatusFilter("enviado"); setAnchorStatus(null); }}>Enviado</MenuItem>
              <MenuItem selected={statusFilter === "pendente"} onClick={() => { setStatusFilter("pendente"); setAnchorStatus(null); }}>Pendente</MenuItem>
              <MenuItem selected={statusFilter === "erro"} onClick={() => { setStatusFilter("erro"); setAnchorStatus(null); }}>Erro</MenuItem>
            </div>
          </Popover>

          <div className={layout.filterItem} onClick={(e) => setAnchorDate(e.currentTarget)}>
            <CalendarIcon className={layout.calendarIcon} />
            <MuiTypography className={layout.filterLabel}>
              {dateFilter ? dateFilter : "dd/mm/aaaa"}
            </MuiTypography>
            <ExpandMoreIcon className={layout.chevronIcon} />
          </div>
          <Popover
            open={Boolean(anchorDate)}
            anchorEl={anchorDate}
            onClose={() => setAnchorDate(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <div style={{ padding: 12 }}>
              <TextField
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                variant="outlined"
                size="small"
              />
            </div>
          </Popover>
        </>
      )}
    >
      <div className={classes.content}>
        {renderContent()}
      </div>

      <Dialog open={scheduleOpen} onClose={closeScheduleWizard} maxWidth="sm" fullWidth>
        <DialogTitle>Agendar Envio</DialogTitle>
        <DialogContent>
          <Stepper activeStep={scheduleStep} alternativeLabel>
            <Step><StepLabel>Template</StepLabel></Step>
            <Step><StepLabel>Destinatários</StepLabel></Step>
            <Step><StepLabel>Data e Hora</StepLabel></Step>
          </Stepper>
          {scheduleStep === 0 && (
            <div style={{ marginTop: 16 }}>
              <Typography variant="subtitle2" style={{ marginBottom: 8 }}>Selecione um template</Typography>
              <Grid container spacing={2}>
                {templates.map(tpl => (
                  <Grid item xs={6} key={tpl.id}>
                    <Paper onClick={() => setSelectedTemplate(tpl.id)} style={{ padding: 12, cursor: "pointer", border: selectedTemplate === tpl.id ? "2px solid #3B82F6" : "1px solid #E2E8F0", borderRadius: 8 }}>
                      <img src={tpl.thumbnail} alt={tpl.name} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6 }} />
                      <Typography variant="body2" style={{ marginTop: 8, textAlign: "center" }}>{tpl.name}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </div>
          )}
          {scheduleStep === 1 && (
            <div style={{ marginTop: 16 }}>
              <Typography variant="subtitle2" style={{ marginBottom: 8 }}>Destinatários</Typography>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {recipients.map(id => (
                  <Chip key={id} label={`Contato #${id}`} onDelete={() => setRecipients(recipients.filter(r => r !== id))} />
                ))}
                <Button size="small" variant="outlined" onClick={() => history.push("/contacts")}>Escolher na lista</Button>
              </div>
            </div>
          )}
          {scheduleStep === 2 && (
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <TextField
                type="datetime-local"
                label="Data e Hora"
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                fullWidth
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeScheduleWizard}>Cancelar</Button>
          {scheduleStep > 0 && <Button onClick={() => setScheduleStep(scheduleStep - 1)}>Voltar</Button>}
          {scheduleStep < 2 ? (
            <Button color="primary" variant="contained" onClick={() => setScheduleStep(scheduleStep + 1)} disabled={scheduleStep === 0 && !selectedTemplate}>
              Próximo
            </Button>
          ) : (
            <Button color="primary" variant="contained" onClick={() => { toast.success("Agendamento criado (simulado)"); closeScheduleWizard(); }}>
              Concluir
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </ActivitiesStyleLayout>
  );
};

export default EmailPage;
