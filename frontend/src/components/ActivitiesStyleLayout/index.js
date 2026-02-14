import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Paper,
  Typography,
  Button,
  InputBase,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Grid,
  Box
} from '@material-ui/core';
import {
  Add as AddIcon,
  Search as SearchIcon
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  headerContent: {
    padding: theme.spacing(3), // p-6
  },
  navRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    paddingBottom: theme.spacing(1),
  },
  navTab: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.9rem',
    color: '#6b7280',
    minWidth: 'auto',
    padding: theme.spacing(1, 2),
    borderRadius: 0,
    borderBottom: '2px solid transparent',
  },
  navTabActive: {
    color: '#111827',
    borderBottom: `2px solid ${theme.palette.primary.main}`,
  },
  createButton: {
    display: 'none'
  },
  statsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(3), // gap-6
  },
  statItem: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: '1.5rem', // text-2xl
    fontWeight: 700,
  },
  statLabel: {
    fontSize: '0.75rem', // text-xs
    color: '#6b7280', // text-gray-500
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  searchContainer: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: '#f3f4f6', // bg-gray-100
    '&:hover': {
      backgroundColor: '#e5e7eb',
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 'auto',
    },
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
  },
  searchIcon: {
    padding: theme.spacing(0, 1),
    height: '100%',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
  },
  inputRoot: {
    color: 'inherit',
    fontSize: '0.875rem',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
  filtersContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  viewModeGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    backgroundColor: '#fff',
    padding: theme.spacing(0.5),
    borderRadius: 8,
    border: '1px solid #e5e7eb'
  },
  viewModeButton: {
    textTransform: 'none',
    fontWeight: 500,
    minWidth: 'auto',
    padding: theme.spacing(0.75, 1.25),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  content: {
    flex: 1,
    padding: theme.spacing(3),
    overflowY: 'auto',
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    width: 56,
    height: 56,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    color: '#fff',
    boxShadow: `0 8px 24px ${theme.palette.primary.main}4D`
  },
}));

const ActivitiesStyleLayout = ({
  title,
  description,
  children,
  onCreateClick,
  createButtonText = "Criar",
  searchPlaceholder = "Buscar...",
  searchValue = "",
  onSearchChange,
  filters = [],
  stats = [],
  viewModes = [],
  currentViewMode,
  onViewModeChange,
  actions,
  showAdvancedFilters = false,
  advancedFiltersComponent
}) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.headerContent}>
          {viewModes.length > 0 && (
            <div className={classes.navRow}>
              {viewModes.map((mode) => {
                const active = currentViewMode === mode.value;
                return (
                  <Button
                    key={mode.value}
                    onClick={() => onViewModeChange && onViewModeChange(mode.value)}
                    className={`${classes.navTab} ${active ? classes.navTabActive : ''}`}
                  >
                    {mode.label}
                  </Button>
                );
              })}
            </div>
          )}

          <Divider />

          <div className={classes.controlsRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
              <div className={classes.searchContainer}>
                <div className={classes.searchIcon}>
                  <SearchIcon fontSize="small" />
                </div>
                <InputBase
                  placeholder={searchPlaceholder}
                  classes={{
                    root: classes.inputRoot,
                    input: classes.inputInput,
                  }}
                  value={searchValue}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                />
              </div>

              {filters.map((filter, index) => (
                <Select
                  key={index}
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  variant="outlined"
                  margin="dense"
                  style={{ height: 40, minWidth: 120, backgroundColor: '#fff' }}
                >
                  <MenuItem value="" disabled>
                    {filter.label}
                  </MenuItem>
                  {filter.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              ))}
              
              {actions}
            </div>

            {stats.length > 0 && (
              <div className={classes.statsContainer}>
                {stats.map((stat, index) => (
                  <div key={index} className={classes.statItem}>
                    <div
                      className={classes.statValue}
                      style={{ color: stat.color || '#2563eb' }}
                    >
                      {stat.value}
                    </div>
                    <div className={classes.statLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={classes.content}>
        {children}
      </div>

      {onCreateClick && (
        <IconButton
          className={classes.fab}
          onClick={onCreateClick}
          aria-label="nova-atividade"
        >
          <AddIcon />
        </IconButton>
      )}
    </div>
  );
};

export default ActivitiesStyleLayout;
