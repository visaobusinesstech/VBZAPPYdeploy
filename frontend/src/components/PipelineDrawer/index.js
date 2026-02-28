import React, { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Grid,
  Divider
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Close as CloseIcon } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  drawerPaper: {
    width: 420,
    maxWidth: "100%",
    padding: theme.spacing(2),
    borderRadius: 16,
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    height: "calc(100% - 32px)",
    marginRight: theme.spacing(2),
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderBottom: "1px solid #eee",
    paddingBottom: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  closeButton: {
    position: "absolute",
    left: 0,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.5),
    overflowY: "auto",
    height: "100%",
    paddingRight: theme.spacing(1),
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: theme.spacing(2),
    gap: theme.spacing(1),
  },
  stageRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  colorInput: {
    width: 44,
    height: 40,
    padding: 0,
    border: "1px solid #E5E7EB",
    borderRadius: 6,
    background: "transparent",
  },
}));

const randomId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export default function PipelineDrawer({
  open,
  onClose,
  title = "Configure sua Pipeline",
  pipelines,
  selectedId,
  onSave,
}) {
  const classes = useStyles();
  const [localPipes, setLocalPipes] = useState([]);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    setLocalPipes(Array.isArray(pipelines) ? JSON.parse(JSON.stringify(pipelines)) : []);
    setCurrentId(selectedId || (pipelines && pipelines[0] ? pipelines[0].id : null));
  }, [pipelines, selectedId, open]);

  const current = useMemo(() => {
    const cid = currentId != null ? String(currentId) : null;
    return localPipes.find(p => String(p.id) === cid) || null;
  }, [localPipes, currentId]);

  const handleAddPipeline = () => {
    const newPipe = {
      id: randomId(),
      name: "Nova Pipeline",
      stages: [
        { key: "novo", label: "Novo Lead", color: "#6366F1" },
        { key: "qualificacao", label: "Contato Inicial", color: "#8B5CF6" },
        { key: "proposta", label: "Proposta", color: "#F59E0B" },
        { key: "negociacao", label: "Reunião", color: "#F97316" },
        { key: "fechado", label: "Fechamento", color: "#10B981" },
      ],
    };
    setLocalPipes(prev => [...prev, newPipe]);
    setCurrentId(newPipe.id);
  };

  const handleRemovePipeline = (id) => {
    if (localPipes.length <= 1) return;
    const idx = localPipes.findIndex(p => p.id === id);
    if (idx === -1) return;
    const next = localPipes.filter(p => p.id !== id);
    setLocalPipes(next);
    if (currentId === id) {
      setCurrentId(next[0]?.id || null);
    }
  };

  const updateCurrent = (updates) => {
    setLocalPipes(prev => prev.map(p => p.id === currentId ? { ...p, ...updates } : p));
  };

  const handleAddStage = () => {
    if (!current) return;
    const keyBase = `etapa_${current.stages.length + 1}`;
    const key = keyBase.toLowerCase().replace(/\s+/g, "_");
    const newStage = { key, label: `Etapa ${current.stages.length + 1}`, color: "#3B82F6" };
    updateCurrent({ stages: [...current.stages, newStage] });
  };

  const handleRemoveStage = (key) => {
    if (!current) return;
    updateCurrent({ stages: current.stages.filter(s => s.key !== key) });
  };

  const handleStageChange = (idx, field, value) => {
    if (!current) return;
    const next = current.stages.slice();
    next[idx] = { ...next[idx], [field]: value };
    updateCurrent({ stages: next });
  };

  const handleSave = () => {
    if (typeof onSave === "function") {
      onSave(localPipes, currentId);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      classes={{ paper: classes.drawerPaper }}
    >
      <Box className={classes.header}>
        <IconButton className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
        <Typography variant="subtitle1" style={{ fontWeight: 600 }}>{title}</Typography>
      </Box>
      <Box className={classes.content}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Typography variant="caption" style={{ color: "#374151" }}>Pipeline</Typography>
          </Grid>
          <Grid item xs={8}>
            <TextField
              select
              fullWidth
              variant="outlined"
              size="small"
              SelectProps={{ native: true }}
              value={currentId || ""}
              onChange={(e) => setCurrentId(e.target.value)}
            >
              {localPipes.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={4} style={{ display: "flex", gap: 8 }}>
            <Button onClick={handleAddPipeline} color="primary" variant="outlined" fullWidth>
              Nova
            </Button>
            <Button
              onClick={() => handleRemovePipeline(currentId)}
              variant="outlined"
              fullWidth
              disabled={localPipes.length <= 1}
            >
              Excluir
            </Button>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Nome da pipeline"
              variant="outlined"
              fullWidth
              size="small"
              value={current?.name || ""}
              onChange={(e) => updateCurrent({ name: e.target.value })}
            />
          </Grid>
        </Grid>
        <Divider style={{ marginTop: 8, marginBottom: 8 }} />
        <Box>
          <Typography variant="caption" style={{ color: "#374151" }}>Etapas</Typography>
          <Box style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {(current?.stages || []).map((st, idx) => (
              <div key={st.key} className={classes.stageRow}>
                <input
                  type="color"
                  className={classes.colorInput}
                  value={st.color || "#3B82F6"}
                  onChange={(e) => handleStageChange(idx, "color", e.target.value)}
                  aria-label="Cor"
                />
                <TextField
                  label="Rótulo"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={st.label}
                  onChange={(e) => handleStageChange(idx, "label", e.target.value)}
                />
                <TextField
                  label="Chave (status)"
                  variant="outlined"
                  size="small"
                  value={st.key}
                  onChange={(e) => handleStageChange(idx, "key", e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                  style={{ width: 160 }}
                />
                <Button onClick={() => handleRemoveStage(st.key)}>Remover</Button>
              </div>
            ))}
            <div>
              <Button color="primary" variant="contained" onClick={handleAddStage}>Adicionar etapa</Button>
            </div>
          </Box>
        </Box>
        <Box className={classes.actions}>
          <Button onClick={onClose} variant="outlined">Cancelar</Button>
          <Button onClick={handleSave} color="primary" variant="contained">Salvar</Button>
        </Box>
      </Box>
    </Drawer>
  );
}

