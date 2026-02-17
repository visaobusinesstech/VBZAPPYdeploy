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
  IconButton,
  Button
} from '@material-ui/core';
import { MoreVert as MoreVertIcon, Add as AddIcon, DeleteOutline as DeleteIcon } from '@material-ui/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflowX: 'hidden',
    padding: theme.spacing(2),
    gap: theme.spacing(2),
    backgroundColor: 'transparent',
    '&::-webkit-scrollbar': {
      height: 0,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'transparent',
      borderRadius: 0,
    },
  },
  column: {
    flex: '1 1 240px',
    maxWidth: '30%', // Ajustado para 3 colunas
    minWidth: 260,
    backgroundColor: 'transparent',
    borderRadius: 0,
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '100%',
  },
  columnHeaderRow: {
    margin: theme.spacing(1, 1, 0.5, 1),
    padding: theme.spacing(0.5, 0.5),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28
  },
  columnHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1)
  },
  columnDot: {
    width: 10,
    height: 10,
    borderRadius: '50%'
  },
  columnTitle: {
    fontSize: '0.85rem',
    fontWeight: 400,
    letterSpacing: '0.06em',
    color: '#6B7280',
    textTransform: 'uppercase',
    opacity: 1
  },
  countBadge: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
    fontWeight: 600
  },
  columnContent: {
    padding: theme.spacing(1),
    margin: theme.spacing(0.5, 1, 1, 1),
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 0,
    overflowY: 'auto',
    flex: 1,
    '&::-webkit-scrollbar': {
      width: 0,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'transparent',
      borderRadius: 0,
    },
  },
  card: {
    position: 'relative',
    margin: theme.spacing(0.75, 0.5),
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
    cursor: 'pointer',
    minHeight: 96,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#fff',
    '&:hover': {
      boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
      '& $cardDeleteBtn': {
        opacity: 1,
        transform: 'scale(1)'
      }
    },
  },
  cardAccent: {
    height: 3,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  cardTitle: {
    fontWeight: 400,
    color: '#111827',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    marginBottom: theme.spacing(1),
  },
  cardMeta: {
    color: '#6B7280'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(1),
  },
  cardFooterDot: {
    width: 8,
    height: 8,
    borderRadius: '50%'
  },
  cardDeleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    minWidth: 22,
    padding: 0,
    backgroundColor: '#ffffffEE',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    color: '#9CA3AF',
    opacity: 0,
    transform: 'scale(0.92)',
    transition: 'all 120ms ease',
    '&:hover': {
      backgroundColor: '#fff'
    }
  },
  addButton: {
    margin: theme.spacing(1, 1.5, 1.5),
    textTransform: 'none',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px dashed #CBD5E1',
    color: '#6B7280',
    fontSize: '0.85rem',
    fontWeight: 500,
    borderRadius: 8,
    padding: theme.spacing(0.75, 0),
    minHeight: 36,
    '&:hover': {
      backgroundColor: '#F9FAFB'
    }
  }
}));

const withAlpha = (hex, alpha) => {
  const c = (hex || '').replace('#', '');
  if (c.length !== 6) return hex;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ProjectKanbanBoard = ({ projects, onProjectClick, onAdd, onMove, onDelete }) => {
  const classes = useStyles();

  const columns = [
    { id: 'active', title: 'Ativos', color: '#2563eb' },          // azul
    { id: 'completed', title: 'Concluídos', color: '#10B981' },   // verde
    { id: 'archived', title: 'Arquivados', color: '#9CA3AF' }     // cinza
  ];

  // Função auxiliar para mapear status do backend para colunas
  const getColumnId = (status) => {
    const s = String(status || '').toLowerCase();
    if (['active', 'ativo'].includes(s)) return 'active';
    if (['completed', 'concluído', 'concluido'].includes(s)) return 'completed';
    if (['archived', 'arquivado'].includes(s)) return 'archived';
    return 'active';
  };

  const getProjectsByColumn = (columnId) => {
    return projects.filter(project => getColumnId(project.status) === columnId);
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    if (onMove) {
      const projectId = draggableId;
      onMove(projectId, source.droppableId, destination.droppableId, destination.index);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={classes.root} data-kanban-scroll="true">
        {columns.map((column) => (
          <div key={column.id} className={classes.column}>
            <div className={classes.columnHeaderRow}>
              <div className={classes.columnHeaderLeft}>
                <span className={classes.columnDot} style={{ backgroundColor: column.color }} />
                <Typography className={classes.columnTitle}>{column.title}</Typography>
              </div>
              <span
                className={classes.countBadge}
                style={{ backgroundColor: withAlpha(column.color, 0.16), color: column.color }}
              >
                {getProjectsByColumn(column.id).length}
              </span>
            </div>
            <Droppable droppableId={column.id}>
              {(provided) => (
                <div
                  className={classes.columnContent}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {getProjectsByColumn(column.id).map((project, index) => (
                    <Draggable draggableId={String(project.id)} index={index} key={project.id}>
                      {(providedDraggable) => (
                        <Card
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps}
                          {...providedDraggable.dragHandleProps}
                          className={classes.card}
                          onClick={() => onProjectClick && onProjectClick(project)}
                        >
                          {onDelete && (
                            <IconButton
                              className={classes.cardDeleteBtn}
                              size="small"
                              aria-label="Excluir projeto"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(project);
                              }}
                            >
                              <DeleteIcon style={{ fontSize: 14 }} />
                            </IconButton>
                          )}
                          <div className={classes.cardAccent} style={{ backgroundColor: column.color }} />
                          <CardContent style={{ padding: 10 }}>
                            <Typography variant="body2" className={classes.cardTitle}>
                              {project.name || "Sem nome"}
                            </Typography>
                            <Typography variant="caption" className={classes.cardMeta} display="block">
                              {project.description ? (project.description.length > 38 ? project.description.substring(0, 38) + '...' : project.description) : "Sem descrição"}
                            </Typography>
                            
                            <div style={{ display: 'flex', gap: 6, marginTop: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                              {/* Company Block */}
                              {project.companyId && (
                                <div 
                                  style={{ 
                                    backgroundColor: '#F5F3FF',
                                    borderRadius: 4,
                                    padding: '4px 8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Empresa"
                                >
                                    <Typography variant="caption" style={{ color: '#4C1D95', fontWeight: 600, fontSize: '0.7rem' }}>
                                      {/* Aqui mostraria o nome da empresa se populado */}
                                      {project.company ? project.company.name : `Empresa ${project.companyId}`}
                                    </Typography>
                                </div>
                              )}
                              
                              {/* Activities Count Block */}
                              <div 
                                style={{ 
                                  backgroundColor: '#FFF7ED',
                                  borderRadius: 4,
                                  padding: '4px 8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Atividades"
                              >
                                  <Typography variant="caption" style={{ color: '#9A3412', fontWeight: 600, fontSize: '0.7rem' }}>
                                    {project.activities ? project.activities.length : 0} Ativ.
                                  </Typography>
                              </div>
                            </div>

                            <div className={classes.cardFooter}>
                              <Typography variant="caption" className={classes.cardMeta}>
                                {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "Sem data"}
                              </Typography>
                              <span className={classes.cardFooterDot} style={{ backgroundColor: column.color }} />
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {onAdd && (
                    <Button
                      fullWidth
                      size="small"
                      variant="text"
                      className={classes.addButton}
                      startIcon={<AddIcon />}
                      onClick={() => onAdd(column.id)}
                    >
                      Adicionar Projeto
                    </Button>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default ProjectKanbanBoard;
