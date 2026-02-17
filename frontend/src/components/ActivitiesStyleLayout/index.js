import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { DrawerContext } from "../../context/DrawerContext";
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
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Menu as MenuIcon
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
    padding: theme.spacing(1.0, 0),
  },
  navRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingBottom: theme.spacing(0.75),
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    borderBottom: '1px solid #E5E7EB', // Added divider
  },
  tabsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    overflowX: 'auto',
    scrollbarWidth: 'none', // Firefox
    '&::-webkit-scrollbar': {
      display: 'none' // Chrome/Safari
    },
    scrollBehavior: 'smooth',
    flex: 1,
    whiteSpace: 'nowrap',
    padding: theme.spacing(0.5, 0),
  },
  scrollButton: {
    minWidth: 'auto',
    padding: 6,
    borderRadius: '50%',
    color: theme.palette.text.secondary,
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      color: theme.palette.text.primary,
    },
  },
  navTab: {
    textTransform: 'none',
    fontWeight: 400,
    fontSize: '0.875rem',
    color: '#374151',
    minWidth: 'auto',
    padding: theme.spacing(1, 2),
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.03)',
      color: '#374151',
    },
  },
  navTabIcon: {
    fontSize: '0.875rem',
    opacity: 1,
    display: 'flex',
    alignItems: 'center',
    marginRight: theme.spacing(1.25),
  },
  navTabActive: {
    color: '#111827',
    backgroundColor: 'rgba(0,0,0,0.03)',
    boxShadow: '0 2px 4px rgba(15, 23, 42, 0.16)',
    border: 'none',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.02)',
    },
  },
  createButton: {
    display: 'none'
  },
  statsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(3),
  },
  statItem: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 24px',
    backgroundColor: '#FFFFFF',
    // borderBottom: '1px solid #E5E7EB', // Removed
    height: 48,
    boxSizing: 'border-box',
    width: '100%',
    marginTop: 8 // Added margin top to lower it a bit
  },
  leftFilter: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    maxWidth: 400
  },
  funnelIcon: {
    color: '#9CA3AF', // gray-400
    fontSize: 20
  },
  filterInput: {
    fontSize: '0.875rem', // 14px
    color: '#111827', // gray-900
    fontWeight: 400,
    width: '100%',
    '& input::placeholder': {
      color: '#9CA3AF', // gray-400
      opacity: 1
    }
  },
  rightFilter: {
    display: 'flex',
    alignItems: 'center',
    gap: 16 // Spacing between filter groups
  },
  filterItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 6,
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#F9FAFB' // gray-50
    }
  },
  filterLabel: {
    fontSize: '0.75rem', // 12px
    color: '#374151', // gray-700
    fontWeight: 500, // Medium
    lineHeight: '20px'
  },
  chevronIcon: {
    color: '#9CA3AF', // gray-400
    fontSize: 14
  },
  calendarIcon: {
    color: '#9CA3AF', // gray-400
    fontSize: 14,
    marginRight: 2
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
    padding: theme.spacing(0.5),
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
  navActions,
  showAdvancedFilters = false,
  advancedFiltersComponent,
  disableFilterBar = false,
  hideSearch = false,
  enableTabsScroll = false,
  hideNavDivider = false,
  hideHeaderDivider = false
}) => {
  const classes = useStyles();
  const tabsRef = React.useRef(null);
  const context = useContext(DrawerContext);
  const { drawerOpen, setDrawerOpen } = context || {};

  const handleScroll = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 300;
      tabsRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.header} style={hideHeaderDivider ? { borderBottom: 'none' } : undefined}>
        <div className={classes.headerContent}>
          {viewModes.length > 0 && (
            <div className={classes.navRow} style={hideNavDivider ? { borderBottom: 'none' } : undefined}>
              {/* Menu Icon for collapsed state */}
              {!drawerOpen && setDrawerOpen && (
                <IconButton 
                  size="small" 
                  onClick={() => setDrawerOpen(true)}
                  style={{ marginRight: 8, color: '#000000', opacity: 1, padding: 2, width: 24, height: 24 }}
                >
                  <MenuIcon style={{ fontSize: 16 }} />
                </IconButton>
              )}

              {enableTabsScroll && (
                <IconButton 
                  size="small" 
                  onClick={() => handleScroll('left')} 
                  className={classes.scrollButton}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
              )}
              
              <div className={classes.tabsContainer} ref={tabsRef}>
                {viewModes.map((mode) => {
                  const active = currentViewMode === mode.value;
                  return (
                    <Button
                      key={mode.value}
                      onClick={() => onViewModeChange && onViewModeChange(mode.value)}
                      className={`${classes.navTab} ${active ? classes.navTabActive : ''}`}
                    >
                      {mode.icon &&
                        React.cloneElement(mode.icon, {
                          className: classes.navTabIcon
                        })}
                      <span>{mode.label}</span>
                    </Button>
                  );
                })}
              </div>

              {enableTabsScroll && (
                <IconButton 
                  size="small" 
                  onClick={() => handleScroll('right')} 
                  className={classes.scrollButton}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              )}

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                {disableFilterBar && !hideSearch && (
                   <div className={classes.searchContainer} style={{ width: 'auto', marginRight: 0 }}>
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
                )}
                {navActions}
              </div>
            </div>
          )}

          {!disableFilterBar && currentViewMode !== "calendar" && (
            <div className={classes.filterBar}>
              {/* Esquerda: Busca */}
              <div className={classes.leftFilter}>
                <FilterListIcon className={classes.funnelIcon} />
                <InputBase
                  placeholder="Filtrar por nome do lead, empresa..."
                  className={classes.filterInput}
                  value={searchValue}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                />
              </div>

              {/* Direita: Filtros */}
              <div className={classes.rightFilter}>
                {/* Pipeline Ativa */}
                <div className={classes.filterItem}>
                  <Typography className={classes.filterLabel}>Pipeline Ativa</Typography>
                  <ExpandMoreIcon className={classes.chevronIcon} />
                </div>

                {/* Responsável */}
                <div className={classes.filterItem}>
                  <Typography className={classes.filterLabel}>Responsável</Typography>
                  <ExpandMoreIcon className={classes.chevronIcon} />
                </div>

                {/* Contato/Empresa */}
                <div className={classes.filterItem}>
                  <Typography className={classes.filterLabel}>Contato/Empr...</Typography>
                  <ExpandMoreIcon className={classes.chevronIcon} />
                </div>

                {/* Período */}
                <div className={classes.filterItem}>
                  <CalendarIcon className={classes.calendarIcon} />
                  <Typography className={classes.filterLabel}>Período</Typography>
                </div>

                {/* Todos (provavelmente status) */}
                <div className={classes.filterItem}>
                  <Typography className={classes.filterLabel}>Todos</Typography>
                  <ExpandMoreIcon className={classes.chevronIcon} />
                </div>
              </div>
            </div>
          )}
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
