import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton
} from '@material-ui/core';
import { MoreVert as MoreVertIcon } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    overflowX: 'auto',
    padding: theme.spacing(2),
    gap: theme.spacing(2),
    backgroundColor: 'transparent',
    '&::-webkit-scrollbar': {
      height: 6,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(148, 163, 184, 0.6)',
      borderRadius: 3,
    },
  },
  column: {
    minWidth: 300,
    width: 300,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '100%',
  },
  columnHeader: {
    padding: theme.spacing(1.5, 2),
    fontWeight: 600,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  columnContent: {
    padding: theme.spacing(1),
    overflowY: 'auto',
    flex: 1,
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(0,0,0,0.1)',
      borderRadius: '3px',
    },
  },
  card: {
    margin: theme.spacing(1, 0.5),
    borderRadius: 10,
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
    cursor: 'pointer',
    '&:hover': {
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
    },
  },
  cardTitle: {
    fontWeight: 500,
    marginBottom: theme.spacing(1),
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(1),
  },
}));

const KanbanBoard = ({ activities, onActivityClick }) => {
  const classes = useStyles();

  const columns = [
    { id: 'pending', title: 'A Fazer', color: '#eab308' },
    { id: 'in_progress', title: 'Em Progresso', color: '#3b82f6' },
    { id: 'completed', title: 'Concluído', color: '#22c55e' }
  ];

  // Função auxiliar para mapear status do backend para colunas
  const getColumnId = (status) => {
    // Ajustar conforme os status reais do backend
    if (status === 'A Fazer' || status === 'pending') return 'pending';
    if (status === 'Em Progresso' || status === 'in_progress') return 'in_progress';
    if (status === 'Concluído' || status === 'completed') return 'completed';
    return 'pending'; // Default
  };

  const getActivitiesByColumn = (columnId) => {
    return activities.filter(activity => getColumnId(activity.status) === columnId);
  };

  return (
    <div className={classes.root}>
      {columns.map((column) => (
        <div key={column.id} className={classes.column}>
          <div className={classes.columnHeader}>
            <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
              {column.title}
            </Typography>
            <Chip 
              size="small" 
              label={getActivitiesByColumn(column.id).length} 
              style={{ backgroundColor: 'rgba(0,0,0,0.08)', fontWeight: 'bold' }}
            />
          </div>
          <div className={classes.columnContent}>
            {getActivitiesByColumn(column.id).map((activity) => (
              <Card 
                key={activity.id} 
                className={classes.card}
                onClick={() => onActivityClick && onActivityClick(activity)}
              >
                <CardContent style={{ padding: 12 }}>
                  <Typography variant="body2" className={classes.cardTitle}>
                    {activity.title || "Sem título"}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block">
                    {activity.description ? (activity.description.length > 50 ? activity.description.substring(0, 50) + '...' : activity.description) : "Sem descrição"}
                  </Typography>
                  
                  <div className={classes.cardFooter}>
                    <Typography variant="caption" color="textSecondary">
                      {activity.date || "Sem data"}
                    </Typography>
                    {activity.owner && (
                      <Avatar 
                        style={{ width: 24, height: 24, fontSize: 12 }}
                      >
                        {activity.owner.charAt(0).toUpperCase()}
                      </Avatar>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
