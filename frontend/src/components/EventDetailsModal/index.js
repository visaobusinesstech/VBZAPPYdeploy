import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid
} from "@material-ui/core";
import moment from "moment";

const EventDetailsModal = ({ open, onClose, event }) => {
  if (!event) return null;
  const res = event.resource || event;
  const isActivityEvent = !!res.date || !!res.type;
  const when = isActivityEvent ? res.date : res.sendAt;
  const title = res.title || res?.contact?.name || "Evento";
  const description = res.description || res.body || "Sem descrição";
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Detalhes do Evento</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">Título</Typography>
            <Typography variant="body1">{title}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">Quando</Typography>
            <Typography variant="body1">
              {when ? moment(when).format("DD/MM/YYYY HH:mm") : "Sem data"}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">Descrição</Typography>
            <Typography variant="body1">{description}</Typography>
          </Grid>
          {res.responsible && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">Responsável</Typography>
              <Typography variant="body1">{res.responsible}</Typography>
            </Grid>
          )}
          {res.location && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">Local</Typography>
              <Typography variant="body1">{res.location}</Typography>
            </Grid>
          )}
          {res.address && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">Endereço</Typography>
              <Typography variant="body1">{res.address}</Typography>
            </Grid>
          )}
          {res.phone && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">Telefone</Typography>
              <Typography variant="body1">{res.phone}</Typography>
            </Grid>
          )}
          {res.link && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">Link</Typography>
              <Typography variant="body1">
                <a href={res.link} target="_blank" rel="noreferrer">{res.link}</a>
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDetailsModal;

