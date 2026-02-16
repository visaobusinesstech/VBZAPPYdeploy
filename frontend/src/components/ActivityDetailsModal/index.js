import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Close as CloseIcon, Edit as EditIcon, DeleteOutline as DeleteIcon } from '@material-ui/icons';

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
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1)
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: '0.9rem',
    color: '#111827',
    margin: theme.spacing(2, 0, 1)
  },
  infoRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  infoCardPurple: {
    backgroundColor: '#F5F3FF',
    color: '#4C1D95',
    padding: theme.spacing(2),
    borderRadius: 12,
    minHeight: 96
  },
  infoCardOrange: {
    backgroundColor: '#FFF7ED',
    color: '#9A3412',
    padding: theme.spacing(2),
    borderRadius: 12,
    minHeight: 96
  },
  label: {
    fontSize: '0.75rem',
    color: '#6B7280',
    marginBottom: 2
  },
  value: {
    fontSize: '0.95rem',
    color: '#111827'
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2)
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(2)
  }
}));

const ActivityDetailsModal = ({ open, onClose, activity, onDelete }) => {
  const classes = useStyles();
  if (!activity) return null;

  const progress = activity.progress || 33;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ className: classes.drawerPaper }}
      ModalProps={{ keepMounted: true }}
    >
      <Box className={classes.header}>
        <Typography variant="h6">Detalhes da Atividade</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box mb={2}>
        <Typography variant="caption" className={classes.label}>Título</Typography>
        <Typography variant="body1" className={classes.value}>{activity.title || 'Sem título'}</Typography>
      </Box>
      <Box mb={2}>
        <Typography variant="caption" className={classes.label}>Descrição</Typography>
        <Typography variant="body2" style={{ color: '#374151' }}>
          {activity.description || 'Sem descrição'}
        </Typography>
      </Box>

      <Divider />

      <Typography className={classes.sectionTitle}>Informações da Atividade</Typography>
      <div className={classes.infoRow}>
        <Paper className={classes.infoCardPurple} elevation={0}>
          <Typography variant="overline" style={{ opacity: 0.9 }}>EMPRESA/CLIENTE</Typography>
          <Typography variant="subtitle2" style={{ marginTop: 6 }}>Não informado</Typography>
        </Paper>
        <Paper className={classes.infoCardOrange} elevation={0}>
          <Typography variant="overline" style={{ opacity: 0.9 }}>PROJETO VINCULADO</Typography>
          <List dense disablePadding>
            {(activity.projects || ['PROJETO 4','PROJETO 5','PROJETO 2','PROJETO 3','PROJETO 1']).slice(0,5).map((p, idx) => (
              <ListItem key={idx} disableGutters>
                <ListItemText primaryTypographyProps={{ style: { fontSize: '0.85rem' } }} primary={p} />
              </ListItem>
            ))}
          </List>
          <Typography variant="caption" style={{ opacity: 0.7 }}>5 projeto(s)</Typography>
        </Paper>
      </div>

      <Box mb={1}>
        <Typography variant="caption" className={classes.label}>Tipo de Atividade</Typography>
        <Typography variant="body2" className={classes.value}>
          {activity.type || '—'}
        </Typography>
      </Box>
      <Box mb={1}>
        <Typography variant="caption" className={classes.label}>Prazo</Typography>
        <Typography variant="body2" className={classes.value}>
          {activity.date || '—'}
        </Typography>
      </Box>
      <Box className={classes.progressRow} mb={2}>
        <Typography variant="caption" className={classes.label} style={{ minWidth: 76 }}>Progresso</Typography>
        <Box flex={1}>
          <LinearProgress variant="determinate" value={progress} style={{ height: 6, borderRadius: 6 }} />
        </Box>
        <Typography variant="caption">{progress}%</Typography>
      </Box>

      <Divider />
      <Typography className={classes.sectionTitle}>Informações do Sistema</Typography>
      <Box mb={1}>
        <Typography variant="caption" className={classes.label}>Criado em</Typography>
        <Typography variant="body2" className={classes.value}>{activity.createdAt || activity.date || '—'}</Typography>
      </Box>

      <div className={classes.footer}>
        <IconButton title="Editar" color="default" size="small">
          <EditIcon />
        </IconButton>
        <IconButton
          title="Excluir"
          color="secondary"
          size="small"
          onClick={() => onDelete && onDelete(activity)}
        >
          <DeleteIcon />
        </IconButton>
      </div>
    </Drawer>
  );
};

export default ActivityDetailsModal;

