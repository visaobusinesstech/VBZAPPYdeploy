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
  CircularProgress,
  Chip
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Close as CloseIcon } from '@material-ui/icons';
import { toast } from "react-toastify";
import toastError from "../../errors/toastError";
import projectsService from "../../services/projectsService";
import useCompanies from "../../hooks/useCompanies";
import useActivities from "../../hooks/useActivities";

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

const CreateProjectModal = ({ open, onClose, onSave, project }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const { companies } = useCompanies();
  // Fetch all activities (assuming pagination allows fetching enough or handle search later)
  const { activities } = useActivities({ searchParam: "", pageNumber: 1 });
  
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    status: "active",
    companyId: "",
    activityIds: []
  });

  useEffect(() => {
    if (open) {
      if (project) {
        setFormValues({
          name: project.name || "",
          description: project.description || "",
          status: project.status || "active",
          companyId: project.companyId || "",
          activityIds: project.activities ? project.activities.map(a => a.id) : []
        });
      } else {
        setFormValues({
          name: "",
          description: "",
          status: "active",
          companyId: "",
          activityIds: []
        });
      }
    }
  }, [open, project]);

  const handleChange = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formValues.name) {
      toast.error("Nome do projeto é obrigatório.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formValues,
      };

      let savedProject;
      if (project && project.id) {
        savedProject = await projectsService.update(project.id, payload);
        toast.success("Projeto atualizado com sucesso.");
      } else {
        savedProject = await projectsService.create(payload);
        toast.success("Projeto criado com sucesso.");
      }
      
      if (onSave) onSave(savedProject);
      
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
        <Typography variant="h6">{project ? "Editar Projeto" : "Novo Projeto"}</Typography>
      </Box>

      <form onSubmit={handleSubmit} className={classes.formContainer}>
        <TextField
          label="Nome do Projeto"
          value={formValues.name}
          onChange={handleChange("name")}
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
          <InputLabel>Status</InputLabel>
          <Select
            value={formValues.status}
            onChange={handleChange("status")}
            label="Status"
          >
            <MenuItem value="active">Ativo</MenuItem>
            <MenuItem value="completed">Concluído</MenuItem>
            <MenuItem value="archived">Arquivado</MenuItem>
          </Select>
        </FormControl>

        <FormControl variant="outlined" fullWidth size="small">
          <InputLabel>Atividades Vinculadas</InputLabel>
          <Select
            multiple
            value={formValues.activityIds}
            onChange={handleChange("activityIds")}
            label="Atividades Vinculadas"
            renderValue={(selected) => (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {selected.map((value) => {
                  const activity = activities.find(a => a.id === value);
                  return (
                    <Chip key={value} label={activity ? activity.title : value} size="small" />
                  );
                })}
              </div>
            )}
          >
            {activities.map((activity) => (
              <MenuItem key={activity.id} value={activity.id}>
                {activity.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="outlined" fullWidth size="small">
          <InputLabel>Empresa</InputLabel>
          <Select
            value={formValues.companyId}
            onChange={handleChange("companyId")}
            label="Empresa"
          >
            <MenuItem value=""><em>Nenhuma</em></MenuItem>
            {companies && companies.map(c => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

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

export default CreateProjectModal;
