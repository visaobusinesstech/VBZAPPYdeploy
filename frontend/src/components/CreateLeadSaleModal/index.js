import React, { useEffect, useState } from 'react';
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
import Autocomplete from "@material-ui/lab/Autocomplete";
import leadsSalesService from "../../services/leadsSalesService";
import toastError from "../../errors/toastError";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  drawerPaper: {
    width: 420,
    maxWidth: '100%',
    padding: theme.spacing(2),
    borderRadius: 16,
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    height: 'calc(100% - 32px)',
    marginRight: theme.spacing(2),
    overflow: 'hidden'
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
    overflowY: 'auto',
    flex: 1,
    paddingRight: theme.spacing(1),
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(0,0,0,0.1)',
      borderRadius: '3px',
    }
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(2)
  }
}));

const statusOptions = [
  { value: "novo", label: "Novo Lead" },
  { value: "qualificacao", label: "Qualificação" },
  { value: "proposta", label: "Proposta" },
  { value: "negociacao", label: "Negociação" },
  { value: "fechado", label: "Fechado" }
];

export default function CreateLeadSaleModal({ open, onClose, lead, onSave }) {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "novo",
    value: 0,
    contactId: null,
    responsibleId: null,
    date: ""
  });

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || "",
        description: lead.description || "",
        status: lead.status || "novo",
        value: lead.value || 0,
        contactId: lead.contactId || null,
        responsibleId: lead.responsibleId || null,
        date: lead.date ? String(lead.date).slice(0,10) : ""
      });
    } else {
      setForm({
        name: "",
        description: "",
        status: "novo",
        value: 0,
        contactId: null,
        responsibleId: null,
        date: ""
      });
    }
  }, [lead, open]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: contactsResp } = await api.get("/contacts/list");
        setContacts(contactsResp || []);
        const { data: usersResp } = await api.get("/users", { params: { searchParam: "" } });
        setUsers(usersResp?.users || []);
        if (lead?.contactId) {
          const c = contactsResp.find((x) => x.id === lead.contactId);
          if (c) setSelectedContact(c);
        } else {
          setSelectedContact(null);
        }
      } catch (err) {
        toastError(err);
      }
    };
    if (open) load();
  }, [open, lead]);

  const handleChange = (field) => (e) => {
    const value = e?.target?.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      let saved;
      if (lead && lead.id) {
        saved = await leadsSalesService.update(lead.id, form);
      } else {
        saved = await leadsSalesService.create(form);
      }
      setLoading(false);
      if (onSave) onSave(saved);
      onClose();
    } catch (err) {
      setLoading(false);
      toastError(err);
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
        <Typography variant="h6">{lead ? "Editar Lead" : "Novo Lead"}</Typography>
        <div style={{ width: 30 }} />
      </Box>

      <div className={classes.formContainer}>
        <TextField
          label="Nome do Lead"
          variant="outlined"
          fullWidth
          value={form.name}
          onChange={handleChange("name")}
        />
        <FormControl variant="outlined" fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={form.status}
            onChange={handleChange("status")}
          >
            {statusOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          type="number"
          label="Valor (R$)"
          variant="outlined"
          fullWidth
          value={form.value}
          onChange={handleChange("value")}
        />
        <Autocomplete
          fullWidth
          value={selectedContact}
          options={contacts}
          onChange={(e, contact) => {
            setSelectedContact(contact);
            setForm((prev) => ({ ...prev, contactId: contact ? contact.id : null }));
          }}
          getOptionLabel={(option) => option.name || option.number || String(option.id)}
          renderInput={(params) => (
            <TextField {...params} label="Contato/Empresa" variant="outlined" />
          )}
        />
        <FormControl variant="outlined" fullWidth>
          <InputLabel>Responsável</InputLabel>
          <Select
            label="Responsável"
            value={form.responsibleId || ""}
            onChange={handleChange("responsibleId")}
          >
            <MenuItem value="">&nbsp;</MenuItem>
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          type="date"
          label="Data"
          variant="outlined"
          InputLabelProps={{ shrink: true }}
          fullWidth
          value={form.date}
          onChange={handleChange("date")}
        />
        <TextField
          label="Descrição"
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          value={form.description}
          onChange={handleChange("description")}
        />
      </div>

      <div className={classes.actions}>
        <Button onClick={onClose} variant="outlined" color="secondary">Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {lead ? "Salvar" : "Criar"}
        </Button>
      </div>
    </Drawer>
  );
}

