import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Close as CloseIcon } from '@material-ui/icons';
import { toast } from "react-toastify";
import toastError from "../../errors/toastError";
import activitiesService from "../../services/activitiesService";
import useCompanies from "../../hooks/useCompanies";
import useProjects from "../../hooks/useProjects";

const useStyles = makeStyles((theme) => ({
  drawerPaper: {
    width: 420,
    maxWidth: '100%',
    padding: theme.spacing(2),
    borderRadius: '16px 0 0 16px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottom: '1px solid #eee',
    paddingBottom: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  closeButton: {
    position: 'absolute',
    left: 0,
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    paddingTop: theme.spacing(1),
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    marginTop: theme.spacing(3)
  }
}));

const CreateActivityModal = ({ open, onClose, onSave, activity }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const { companies } = useCompanies();
  const { projects } = useProjects({ searchParam: "", pageNumber: 1 });
  
  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    type: "task",
    date: "",
    status: "pending",
    responsible: "", // New field
    companyId: "", // New field
    projectId: "", // New field
    sector: "" // New field
  });

  useEffect(() => {
    if (open) {
      if (activity) {
        setFormValues({
          title: activity.title || "",
          description: activity.description || "",
          type: activity.type || "task",
          date: activity.date ? activity.date.split('T')[0] : "",
          status: activity.status || "pending",
          responsible: activity.responsible || "",
          companyId: activity.companyId || "",
          projectId: activity.projectId || "",
          sector: activity.sector || ""
        });
      } else {
        setFormValues({
          title: "",
          description: "",
          type: "task",
          date: new Date().toISOString().split('T')[0], // Default to today
          status: "pending",
          responsible: "",
          companyId: "",
          projectId: "",
          sector: ""
        });
      }
    }
  }, [open, activity]);

  const handleChange = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formValues.title || !formValues.date) {
      toast.error("Preencha título e data da atividade.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formValues,
      };
      // Here you would call the service. For now, we simulate or call the prop.
      // Assuming onSave handles the API call or we do it here.
      // If we do it here:
      let savedActivity;
      if (activity && activity.id) {
        savedActivity = await activitiesService.update(activity.id, payload);
        toast.success("Atividade atualizada com sucesso.");
      } else {
        savedActivity = await activitiesService.create(payload);
        toast.success("Atividade criada com sucesso.");
      }
      
      if (onSave) onSave(savedActivity);
      
      onClose();
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ className: classes.drawerPaper }}
      ModalProps={{ keepMounted: true }}
    >
      <Box className={classes.header}>
        <IconButton onClick={onClose} size="small" className={classes.closeButton}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h6">{activity ? "Editar Atividade" : "Nova Atividade"}</Typography>
      </Box>

      <form onSubmit={handleSubmit} className={classes.formContainer}>
        <TextField
          label="Título"
          value={formValues.title}
          onChange={handleChange("title")}
          fullWidth
          required
          variant="outlined"
          size="small"
        />

        <TextField
          label="Descrição"
          value={formValues.description}
          onChange={handleChange("description")}
          fullWidth
          multiline
          minRows={3}
          variant="outlined"
          size="small"
        />

        <FormControl variant="outlined" fullWidth size="small">
          <InputLabel>Tipo</InputLabel>
          <Select
            value={formValues.type}
            onChange={handleChange("type")}
            label="Tipo"
          >
            <MenuItem value="task">Tarefa</MenuItem>
            <MenuItem value="call">Ligação</MenuItem>
            <MenuItem value="email">E-mail</MenuItem>
            <MenuItem value="meeting">Reunião</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Prazo"
          type="date"
          value={formValues.date}
          onChange={handleChange("date")}
          InputLabelProps={{ shrink: true }}
          fullWidth
          variant="outlined"
          required
          size="small"
        />
        
        {/* New Fields */}
        <TextField
          label="Responsável"
          value={formValues.responsible}
          onChange={handleChange("responsible")}
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Selecione o responsável"
        />

        <FormControl variant="outlined" fullWidth size="small">
          <InputLabel>Empresa</InputLabel>
          <Select
            value={formValues.companyId}
            onChange={handleChange("companyId")}
            label="Empresa"
          >
            <MenuItem value=""><em>Nenhuma</em></MenuItem>
            {/* Mock options if companies not loaded or structure different */}
            {companies && companies.map(c => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="outlined" fullWidth size="small">
          <InputLabel>Projeto</InputLabel>
          <Select
            value={formValues.projectId}
            onChange={handleChange("projectId")}
            label="Projeto"
          >
             <MenuItem value=""><em>Nenhum</em></MenuItem>
             {projects && projects.map(p => (
              <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
            label="Setor"
            value={formValues.sector}
            onChange={handleChange("sector")}
            fullWidth
            variant="outlined"
            size="small"
        />

        <Box mt={2}>
           <Typography variant="caption" color="textSecondary">
             Data de Criação: {new Date().toLocaleDateString()}
           </Typography>
        </Box>

        <div className={classes.footer}>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Salvar"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};

export default CreateActivityModal;
