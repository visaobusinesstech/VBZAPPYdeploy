import React, { useContext, useEffect, useReducer, useState } from "react";

import openSocket from "socket.io-client";

import {
  Button,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@material-ui/core";

import { makeStyles } from "@material-ui/core/styles";

import TableRowSkeleton from "../../components/TableRowSkeleton";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { DeleteOutline, Edit, Visibility, VisibilityOff, Settings as SettingsIcon, WorkOutline as WorkOutlineIcon, Memory as MemoryIcon, FlashOn as FlashOnIcon, BugReport as BugReportIcon, List as ListIcon } from "@material-ui/icons";
import PromptModal from "../../components/PromptModal";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../../hooks/usePlans";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import ForbiddenPage from "../../components/ForbiddenPage";
import ActivitiesStyleLayout from "../../components/ActivitiesStyleLayout";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  section: {
    marginBottom: theme.spacing(2)
  },
  customTableCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  formRow: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  statusBadgeOk: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 8,
    background: "#E6F4EA",
    color: "#1E7E34",
    fontSize: 12,
    fontWeight: 600
  },
  statusBadgeWarn: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 8,
    background: "#FFF4E5",
    color: "#8A6D3B",
    fontSize: 12,
    fontWeight: 600
  },
  statusRow: {
    display: "flex",
    gap: theme.spacing(2),
    alignItems: "center",
    marginTop: theme.spacing(1)
  },
  tabsContainer: {
    background: "#fff",
    borderRadius: 8,
    marginBottom: theme.spacing(2)
  },
  inlineForm: {
    padding: theme.spacing(2),
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    marginBottom: theme.spacing(2)
  }
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_PROMPTS") {
    const prompts = action.payload;
    const newPrompts = [];

    prompts.forEach((prompt) => {
      const promptIndex = state.findIndex((p) => p.id === prompt.id);
      if (promptIndex !== -1) {
        state[promptIndex] = prompt;
      } else {
        newPrompts.push(prompt);
      }
    });

    return [...state, ...newPrompts];
  }

  if (action.type === "UPDATE_PROMPTS") {
    const prompt = action.payload;
    const promptIndex = state.findIndex((p) => p.id === prompt.id);

    if (promptIndex !== -1) {
      state[promptIndex] = prompt;
      return [...state];
    } else {
      return [prompt, ...state];
    }
  }

  if (action.type === "DELETE_PROMPT") {
    const promptId = action.payload;
    const promptIndex = state.findIndex((p) => p.id === promptId);
    if (promptIndex !== -1) {
      state.splice(promptIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const Prompts = () => {
  const classes = useStyles();

  const [prompts, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(false);

  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  //   const socketManager = useContext(SocketContext);
  const { user, socket } = useContext(AuthContext);

  const { getPlanCompany } = usePlans();
  const history = useHistory();
  const companyId = user.companyId;
  const [activeTab, setActiveTab] = useState("integracao");

  const [integrationState, setIntegrationState] = useState({
    apiKey: "",
    model: "gpt-4o-mini",
    aplicarTodos: false,
    status: { whatsapp: false, apiKey: "desconhecido" }
  });
  const [showApiKey, setShowApiKey] = useState(false);

  const [roleState, setRoleState] = useState({
    agente: "",
    funcao: "",
    personalidade: "",
    instrucoes: ""
  });

  const [brainState, setBrainState] = useState({
    fileListId: null,
    websites: [],
    qna: []
  });
  const [brainFiles, setBrainFiles] = useState([]);
  const [newWebsite, setNewWebsite] = useState("");
  const [newQa, setNewQa] = useState({ pergunta: "", resposta: "", categoria: "" });

  const [createPromptForm, setCreatePromptForm] = useState({
    name: "",
    apiKey: "",
    prompt: "",
    queueId: null,
    voice: "texto",
    voiceKey: "",
    voiceRegion: "",
    temperature: 1,
    maxTokens: 100,
    maxMessages: 10
  });
  const [queues, setQueues] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const planConfigs = await getPlanCompany(undefined, companyId);
      if (!planConfigs.plan.useOpenAi) {
        toast.error("Esta empresa não possui permissão para acessar essa página! Estamos lhe redirecionando.");
        setTimeout(() => {
          history.push(`/`)
        }, 1000);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/prompt");
        dispatch({ type: "LOAD_PROMPTS", payload: data.prompts });

        setLoading(false);
      } catch (err) {
        toastError(err);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    // const socket = socketManager.GetSocket();

    const onPromptEvent = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_PROMPTS", payload: data.prompt });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_PROMPT", payload: data.promptId });
      }
    };

    socket.on(`company-${companyId}-prompt`, onPromptEvent);
    return () => {
      socket.off(`company-${companyId}-prompt`, onPromptEvent);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !user || !user.companyId) return;
    const onSettingsEvent = (data) => {
      if (data?.action !== "update" || !data?.setting) return;
      const { key, value } = data.setting || {};
      let parsed = value;
      try {
        parsed = typeof value === "string" ? JSON.parse(value) : value;
      } catch {
        parsed = value;
      }
      if (key === "agent_integration" && parsed) {
        setIntegrationState((prev) => ({ ...prev, ...parsed }));
      }
      if (key === "agent_role" && parsed) {
        setRoleState((prev) => ({ ...prev, ...parsed }));
      }
      if (key === "agent_brain" && parsed) {
        setBrainState((prev) => ({ ...prev, ...parsed }));
      }
    };
    socket.on(`company-${user.companyId}-settings`, onSettingsEvent);
    return () => {
      socket.off(`company-${user.companyId}-settings`, onSettingsEvent);
    };
  }, [socket, user]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/settings/agent_integration");
        if (data && data.value) {
          const v = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          setIntegrationState(prev => ({
            ...prev,
            ...v
          }));
        }
      } catch {}
      try {
        const { data } = await api.get("/whatsapp/");
        const ok = Array.isArray(data) && data.some(w => String(w.status).toUpperCase().includes("CONNECT"));
        setIntegrationState(prev => ({
          ...prev,
          status: { ...prev.status, whatsapp: !!ok }
        }));
      } catch {}
      try {
        const { data } = await api.get("/settings/agent_role");
        if (data && data.value) {
          const v = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          setRoleState(prev => ({ ...prev, ...v }));
        }
      } catch {}
      try {
        const { data } = await api.get("/settings/agent_brain");
        if (data && data.value) {
          const v = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          setBrainState(prev => ({ ...prev, ...v }));
        }
      } catch {}
      try {
        const { data } = await api.get("/queue");
        setQueues(data || []);
      } catch {}
    })();
  }, []);

  const handleOpenPromptModal = () => {
    setPromptModalOpen(true);
    setSelectedPrompt(null);
  };

  const handleClosePromptModal = () => {
    setPromptModalOpen(false);
    setSelectedPrompt(null);
  };

  const handleEditPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setPromptModalOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setConfirmModalOpen(false);
    setSelectedPrompt(null);
  };

  const handleDeletePrompt = async (promptId) => {
    try {
      const { data } = await api.delete(`/prompt/${promptId}`);
      toast.info(i18n.t(data.message));
    } catch (err) {
      toastError(err);
    }
    setSelectedPrompt(null);
  };

  const saveSetting = async (key, value) => {
    try {
      const { data } = await api.put(`/settings/${key}`, { value });
      toast.success("Configurações salvas");
      return data;
    } catch (err) {
      toastError(err);
      return null;
    }
  };

  const handleSaveIntegration = async () => {
    await saveSetting("agent_integration", integrationState);
  };

  const handleSaveRole = async () => {
    await saveSetting("agent_role", roleState);
  };

  const uploadBrainFiles = async (opts, files, listId) => {
    const formData = new FormData();
    formData.append("fileId", listId);
    formData.append("typeArch", "fileList");
    opts.forEach((opt, idx) => {
      if (files[idx]) {
        formData.append("files", files[idx]);
        formData.append("mediaType", files[idx].type || "");
        formData.append("name", opt.name);
        formData.append("id", String(opt.id));
      }
    });
    try {
      await api.post(`/files/uploadList/${listId}`, formData);
      toast.success("Arquivos enviados");
    } catch (err) {
      toastError(err);
    }
  };

  const handleSendBrainFiles = async () => {
    if (!brainFiles || brainFiles.length === 0) return;
    try {
      if (!brainState.fileListId) {
        const options = Array.from(brainFiles).map(f => ({ name: f.name, path: "", mediaType: f.type }));
        const { data } = await api.post("/files", {
          name: "AGENT_BRAIN",
          message: "Base de Conhecimento do Agente",
          options
        });
        if (data?.id) {
          await uploadBrainFiles(data.options || [], Array.from(brainFiles), data.id);
          const next = { ...brainState, fileListId: data.id };
          setBrainState(next);
          await saveSetting("agent_brain", next);
        }
      } else {
        const options = Array.from(brainFiles).map(f => ({ name: f.name, path: "", mediaType: f.type }));
        const { data } = await api.put(`/files/${brainState.fileListId}`, {
          id: brainState.fileListId,
          name: "AGENT_BRAIN",
          message: "Base de Conhecimento do Agente",
          options
        });
        await uploadBrainFiles(data.options || [], Array.from(brainFiles), brainState.fileListId);
      }
      setBrainFiles([]);
    } catch (err) {
      toastError(err);
    }
  };

  const handleAddWebsite = () => {
    if (!newWebsite.trim()) return;
    const next = { ...brainState, websites: [...(brainState.websites || []), newWebsite.trim()] };
    setBrainState(next);
    saveSetting("agent_brain", next);
    setNewWebsite("");
  };

  const handleRemoveWebsite = (idx) => {
    const arr = [...(brainState.websites || [])];
    arr.splice(idx, 1);
    const next = { ...brainState, websites: arr };
    setBrainState(next);
    saveSetting("agent_brain", next);
  };

  const handleAddQa = () => {
    if (!newQa.pergunta.trim() || !newQa.resposta.trim()) return;
    const next = { ...brainState, qna: [...(brainState.qna || []), { ...newQa }] };
    setBrainState(next);
    setNewQa({ pergunta: "", resposta: "", categoria: "" });
  };

  const handleRemoveQa = (idx) => {
    const arr = [...(brainState.qna || [])];
    arr.splice(idx, 1);
    setBrainState(prev => ({ ...prev, qna: arr }));
  };

  const handleSaveBrain = async () => {
    await saveSetting("agent_brain", brainState);
  };

  const handleCreatePrompt = async () => {
    try {
      if (!createPromptForm.name || !createPromptForm.prompt || !createPromptForm.apiKey || !createPromptForm.queueId) {
        toast.error("Preencha os campos obrigatórios");
        return;
      }
      await api.post("/prompt", {
        name: createPromptForm.name,
        prompt: createPromptForm.prompt,
        apiKey: createPromptForm.apiKey,
        queueId: createPromptForm.queueId,
        voice: createPromptForm.voice,
        voiceKey: createPromptForm.voiceKey,
        voiceRegion: createPromptForm.voiceRegion,
        temperature: createPromptForm.temperature,
        maxTokens: createPromptForm.maxTokens,
        maxMessages: createPromptForm.maxMessages
      });
      toast.success(i18n.t("promptModal.success"));
      setCreatePromptForm({
        name: "",
        apiKey: "",
        prompt: "",
        queueId: null,
        voice: "texto",
        voiceKey: "",
        voiceRegion: "",
        temperature: 1,
        maxTokens: 100,
        maxMessages: 10
      });
    } catch (err) {
      toastError(err);
    }
  };

  const tabViewModes = [
    { value: "integracao", label: "Integração", icon: <SettingsIcon /> },
    { value: "cargo", label: "Cargo", icon: <WorkOutlineIcon /> },
    { value: "cerebro", label: "Cérebro", icon: <MemoryIcon /> },
    { value: "acoes", label: "Ações", icon: <FlashOnIcon /> },
    { value: "teste", label: "Teste", icon: <BugReportIcon /> },
    { value: "prompts", label: "Prompts", icon: <ListIcon /> },
  ];

  return (
    <>
      <ConfirmationModal
        title={
          selectedPrompt &&
          `${i18n.t("prompts.confirmationModal.deleteTitle")} ${selectedPrompt.name
          }?`
        }
        open={confirmModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={() => handleDeletePrompt(selectedPrompt.id)}
      >
        {i18n.t("prompts.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <PromptModal
        open={promptModalOpen}
        onClose={handleClosePromptModal}
        promptId={selectedPrompt?.id}
      />
      {user.profile === "user" ?
        <ForbiddenPage />
        :
        <>
          <ActivitiesStyleLayout
            title={null}
            description="Configura o agente de IA e gerencia Prompts"
            disableFilterBar
            hideHeaderDivider
            hideNavDivider
            hideSearch
            viewModes={tabViewModes}
            currentViewMode={activeTab}
            onViewModeChange={setActiveTab}
          >
            {activeTab === "integracao" && (
              <Paper className={classes.mainPaper} variant="outlined">
                <Typography variant="h6">Configurações de Integração</Typography>
                <div className={classes.formRow}>
                  <div className={classes.statusRow}>
                    <span className={integrationState.status.whatsapp ? classes.statusBadgeOk : classes.statusBadgeWarn}>
                      WhatsApp {integrationState.status.whatsapp ? "OK" : "Não conectado"}
                    </span>
                    <span className={classes.statusBadgeWarn}>
                      API Key {integrationState.apiKey ? "informada" : "não informada"}
                    </span>
                  </div>
                </div>
                <Grid container spacing={2} className={classes.formRow}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="API Key OpenAI"
                      type={showApiKey ? "text" : "password"}
                      value={integrationState.apiKey}
                      onChange={(e) => setIntegrationState(prev => ({ ...prev, apiKey: e.target.value }))}
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowApiKey(s => !s)}>
                              {showApiKey ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Select
                      fullWidth
                      variant="outlined"
                      value={integrationState.model}
                      onChange={(e) => setIntegrationState(prev => ({ ...prev, model: e.target.value }))}
                    >
                      <MenuItem value="gpt-4o-mini">GPT-4o Mini</MenuItem>
                      <MenuItem value="gpt-4o">GPT-4o</MenuItem>
                      <MenuItem value="gpt-4-turbo">GPT-4 Turbo</MenuItem>
                    </Select>
                  </Grid>
                </Grid>
                <div className={classes.formRow} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Switch
                    checked={integrationState.aplicarTodos}
                    onChange={(e) => setIntegrationState(prev => ({ ...prev, aplicarTodos: e.target.checked }))}
                    color="primary"
                  />
                  <Typography>Aplicar configurações a todas as filas</Typography>
                </div>
                <Button color="primary" variant="contained" onClick={handleSaveIntegration}>
                  Salvar Integração
                </Button>
              </Paper>
            )}

            {activeTab === "cargo" && (
              <Paper className={classes.mainPaper} variant="outlined">
                <Typography variant="h6">Definição de Cargo</Typography>
                <Grid container spacing={2} className={classes.formRow}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Nome do Agente"
                      value={roleState.agente}
                      onChange={(e) => setRoleState(prev => ({ ...prev, agente: e.target.value }))}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Select
                      fullWidth
                      variant="outlined"
                      value={roleState.funcao || ""}
                      onChange={(e) => setRoleState(prev => ({ ...prev, funcao: e.target.value }))}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>Selecione a função</MenuItem>
                      <MenuItem value="Atendimento ao Cliente">Atendimento ao Cliente</MenuItem>
                      <MenuItem value="Vendas">Vendas</MenuItem>
                      <MenuItem value="Suporte Técnico">Suporte Técnico</MenuItem>
                      <MenuItem value="Agente de Agendamento">Agente de Agendamento</MenuItem>
                      <MenuItem value="Cobrança">Cobrança</MenuItem>
                      <MenuItem value="Marketing">Marketing</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12}>
                    <Select
                      fullWidth
                      variant="outlined"
                      value={roleState.personalidade || ""}
                      onChange={(e) => setRoleState(prev => ({ ...prev, personalidade: e.target.value }))}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>Selecione a personalidade</MenuItem>
                      <MenuItem value="Formal">Formal</MenuItem>
                      <MenuItem value="Amigável">Amigável</MenuItem>
                      <MenuItem value="Objetivo">Objetivo</MenuItem>
                      <MenuItem value="Empático">Empático</MenuItem>
                      <MenuItem value="Criativo">Criativo</MenuItem>
                      <MenuItem value="Técnico">Técnico</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Instruções"
                      value={roleState.instrucoes}
                      onChange={(e) => setRoleState(prev => ({ ...prev, instrucoes: e.target.value }))}
                      fullWidth
                      variant="outlined"
                      multiline
                      rows={6}
                    />
                  </Grid>
                </Grid>
                <Button color="primary" variant="contained" onClick={handleSaveRole}>
                  Salvar Cargo
                </Button>
              </Paper>
            )}

            {activeTab === "cerebro" && (
              <Paper className={classes.mainPaper} variant="outlined">
                <Typography variant="h6">Cérebro do Agente</Typography>
                <div className={classes.section}>
                  <Typography variant="subtitle1">Arquivos</Typography>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setBrainFiles(Array.from(e.target.files || []))}
                    style={{ marginTop: 8, marginBottom: 8 }}
                  />
                  <div>
                    <Button
                      color="primary"
                      variant="contained"
                      onClick={handleSendBrainFiles}
                      disabled={!brainFiles || brainFiles.length === 0}
                    >
                      Enviar Arquivos
                    </Button>
                  </div>
                </div>
                <div className={classes.section}>
                  <Typography variant="subtitle1">Sites</Typography>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                    <TextField
                      placeholder="https://..."
                      value={newWebsite}
                      onChange={(e) => setNewWebsite(e.target.value)}
                      fullWidth
                      variant="outlined"
                    />
                    <Button variant="outlined" onClick={handleAddWebsite}>Adicionar</Button>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {(brainState.websites || []).map((url, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                        <span>{url}</span>
                        <Button size="small" onClick={() => handleRemoveWebsite(idx)}>Remover</Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={classes.section}>
                  <Typography variant="subtitle1">Q&A</Typography>
                  <Grid container spacing={2} className={classes.formRow}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Pergunta"
                        value={newQa.pergunta}
                        onChange={(e) => setNewQa(prev => ({ ...prev, pergunta: e.target.value }))}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Categoria"
                        value={newQa.categoria}
                        onChange={(e) => setNewQa(prev => ({ ...prev, categoria: e.target.value }))}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Resposta"
                        value={newQa.resposta}
                        onChange={(e) => setNewQa(prev => ({ ...prev, resposta: e.target.value }))}
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={4}
                      />
                    </Grid>
                  </Grid>
                  <Button variant="outlined" onClick={handleAddQa}>Adicionar Q&A</Button>
                  <div style={{ marginTop: 12 }}>
                    {(brainState.qna || []).map((qa, idx) => (
                      <div key={idx} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography style={{ fontWeight: 600 }}>{qa.pergunta}</Typography>
                          <Button size="small" onClick={() => handleRemoveQa(idx)}>Remover</Button>
                        </div>
                        {qa.categoria ? <Typography variant="caption">Categoria: {qa.categoria}</Typography> : null}
                        <Typography>{qa.resposta}</Typography>
                      </div>
                    ))}
                  </div>
                </div>
                <Button color="primary" variant="contained" onClick={handleSaveBrain}>
                  Salvar Cérebro
                </Button>
              </Paper>
            )}

            {activeTab === "acoes" && (
              <Paper className={classes.mainPaper} variant="outlined">
                <Typography variant="h6">Ações</Typography>
                <Typography variant="body2">Em breve</Typography>
              </Paper>
            )}

            {activeTab === "teste" && (
              <Paper className={classes.mainPaper} variant="outlined">
                <Typography variant="h6">Teste</Typography>
                <Typography variant="body2">Em breve</Typography>
              </Paper>
            )}

            {activeTab === "prompts" && (
              <>
                <Paper className={classes.inlineForm}>
                  <Typography variant="h6" style={{ marginBottom: 8 }}>Criar Novo Prompt</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label={i18n.t("promptModal.form.name")}
                        value={createPromptForm.name}
                        onChange={(e) => setCreatePromptForm(prev => ({ ...prev, name: e.target.value }))}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label={i18n.t("promptModal.form.apikey")}
                        type={showApiKey ? "text" : "password"}
                        value={createPromptForm.apiKey}
                        onChange={(e) => setCreatePromptForm(prev => ({ ...prev, apiKey: e.target.value }))}
                        fullWidth
                        variant="outlined"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowApiKey(s => !s)}>
                                {showApiKey ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label={i18n.t("promptModal.form.prompt")}
                        value={createPromptForm.prompt}
                        onChange={(e) => setCreatePromptForm(prev => ({ ...prev, prompt: e.target.value }))}
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={6}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Select
                        value={createPromptForm.queueId || ""}
                        onChange={(e) => setCreatePromptForm(prev => ({ ...prev, queueId: e.target.value }))}
                        fullWidth
                        variant="outlined"
                        displayEmpty
                      >
                        <MenuItem value="" disabled>Selecione a fila</MenuItem>
                        {queues.map(q => (
                          <MenuItem key={q.id} value={q.id}>{q.name}</MenuItem>
                        ))}
                      </Select>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Select
                        value={createPromptForm.voice}
                        onChange={(e) => setCreatePromptForm(prev => ({ ...prev, voice: e.target.value }))}
                        fullWidth
                        variant="outlined"
                      >
                        <MenuItem value="texto">Texto</MenuItem>
                        <MenuItem value="pt-BR-FranciscaNeural">pt-BR-FranciscaNeural</MenuItem>
                        <MenuItem value="pt-BR-AntonioNeural">pt-BR-AntonioNeural</MenuItem>
                        <MenuItem value="pt-BR-BrendaNeural">pt-BR-BrendaNeural</MenuItem>
                        <MenuItem value="pt-BR-DonatoNeural">pt-BR-DonatoNeural</MenuItem>
                        <MenuItem value="pt-BR-ElzaNeural">pt-BR-ElzaNeural</MenuItem>
                        <MenuItem value="pt-BR-FabioNeural">pt-BR-FabioNeural</MenuItem>
                        <MenuItem value="pt-BR-GiovannaNeural">pt-BR-GiovannaNeural</MenuItem>
                        <MenuItem value="pt-BR-HumbertoNeural">pt-BR-HumbertoNeural</MenuItem>
                        <MenuItem value="pt-BR-JulioNeural">pt-BR-JulioNeural</MenuItem>
                        <MenuItem value="pt-BR-LeilaNeural">pt-BR-LeilaNeural</MenuItem>
                        <MenuItem value="pt-BR-LeticiaNeural">pt-BR-LeticiaNeural</MenuItem>
                        <MenuItem value="pt-BR-ManuelaNeural">pt-BR-ManuelaNeural</MenuItem>
                        <MenuItem value="pt-BR-NicolauNeural">pt-BR-NicolauNeural</MenuItem>
                        <MenuItem value="pt-BR-ValerioNeural">pt-BR-ValerioNeural</MenuItem>
                        <MenuItem value="pt-BR-YaraNeural">pt-BR-YaraNeural</MenuItem>
                      </Select>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label={i18n.t("promptModal.form.voiceKey")}
                        value={createPromptForm.voiceKey}
                        onChange={(e) => setCreatePromptForm(prev => ({ ...prev, voiceKey: e.target.value }))}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label={i18n.t("promptModal.form.voiceRegion")}
                        value={createPromptForm.voiceRegion}
                        onChange={(e) => setCreatePromptForm(prev => ({ ...prev, voiceRegion: e.target.value }))}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label={i18n.t("promptModal.form.temperature")}
                        value={createPromptForm.temperature}
                        onChange={(e) => setCreatePromptForm(prev => ({ ...prev, temperature: e.target.value }))}
                        fullWidth
                        variant="outlined"
                        type="number"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label={i18n.t("promptModal.form.max_tokens")}
                        value={createPromptForm.maxTokens}
                        onChange={(e) => setCreatePromptForm(prev => ({ ...prev, maxTokens: e.target.value }))}
                        fullWidth
                        variant="outlined"
                        type="number"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label={i18n.t("promptModal.form.max_messages")}
                        value={createPromptForm.maxMessages}
                        onChange={(e) => setCreatePromptForm(prev => ({ ...prev, maxMessages: e.target.value }))}
                        fullWidth
                        variant="outlined"
                        type="number"
                      />
                    </Grid>
                    <Grid item xs={12} md={3} />
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCreatePrompt}
                        fullWidth
                      >
                        {i18n.t("promptModal.buttons.okAdd")}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                <Paper className={classes.mainPaper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="left">
                          {i18n.t("prompts.table.name")}
                        </TableCell>
                        <TableCell align="left">
                          {i18n.t("prompts.table.queue")}
                        </TableCell>
                        <TableCell align="left">
                          {i18n.t("prompts.table.max_tokens")}
                        </TableCell>
                        <TableCell align="center">
                          {i18n.t("prompts.table.actions")}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <>
                        {prompts.map((prompt) => (
                          <TableRow key={prompt.id}>
                            <TableCell align="left">{prompt.name}</TableCell>
                            <TableCell align="left">{prompt.queue.name}</TableCell>
                            <TableCell align="left">{prompt.maxTokens}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleEditPrompt(prompt)}
                              >
                                <Edit />
                              </IconButton>

                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedPrompt(prompt);
                                  setConfirmModalOpen(true);
                                }}
                              >
                                <DeleteOutline />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {loading && <TableRowSkeleton columns={4} />}
                      </>
                    </TableBody>
                  </Table>
                </Paper>
              </>
            )}
          </ActivitiesStyleLayout>
        </>}
    </>
  );
};

export default Prompts;
