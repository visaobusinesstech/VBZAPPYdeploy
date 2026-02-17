import React, { useState, useEffect, useMemo } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  List as ListIcon,
} from "@material-ui/icons";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton
} from "@material-ui/core";

import ActivitiesStyleLayout from "../../components/ActivitiesStyleLayout";
import CreateActivityModal from "../../components/CreateActivityModal";
import useActivities from "../../hooks/useActivities";
import { toast } from "react-toastify";
import toastError from "../../errors/toastError";
import activitiesService from "../../services/activitiesService";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    height: "100%",
    overflow: "hidden",
  },
}));

// Sub-component for List View
const LeadsList = ({ activities }) => {
  return (
    <TableContainer component={Paper} style={{ height: '100%', overflow: 'auto' }}>
      <Table stickyHeader aria-label="activities table">
        <TableHead>
          <TableRow>
            <TableCell>Título</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Data</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {activities.length > 0 ? (
            activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell component="th" scope="row">
                  {activity.title}
                </TableCell>
                <TableCell>{activity.type}</TableCell>
                <TableCell>{activity.date}</TableCell>
                <TableCell>
                  <Chip 
                    label={activity.status} 
                    size="small" 
                    color={activity.status === 'completed' ? 'primary' : 'default'} 
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} align="center">
                Nenhum lead convertido encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const LeadsConvertidos = () => {
  const classes = useStyles();
  const [viewMode, setViewMode] = useState("list");
  const [searchParam, setSearchParam] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [activitiesState, setActivitiesState] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Reuse activities hook for now, or use a specific one if available.
  // Assuming Leads Convertidos are a type of activity or separate entity.
  // For now, I'll use useActivities but filter for 'lead' type if possible or just show all for demo.
  const { activities, loading, count, hasMore } = useActivities({
    searchParam,
    pageNumber
  });

  useEffect(() => {
    setActivitiesState(activities);
  }, [activities]);

  const handleSearch = (value) => {
    setSearchParam(value);
  };

  const handleCreateActivity = () => {
    setDrawerOpen(true);
  };

  const viewModes = [
    { value: "list", label: "Lista", icon: <ListIcon /> },
  ];

  // Filters placeholder
  const filters = [
    {
      label: "Status",
      value: statusFilter,
      options: [
        { value: "pending", label: "Pendente" },
        { value: "in_progress", label: "Em Progresso" },
        { value: "completed", label: "Concluído" },
      ],
      onChange: (val) => setStatusFilter(val)
    }
  ];

  const filteredActivities = useMemo(() => {
    if (!statusFilter) {
      return activitiesState;
    }

    return activitiesState.filter((activity) => activity.status === statusFilter);
  }, [activitiesState, statusFilter]);

  const actionsRight = (
    <>
    </>
  );

  return (
    <>
    <ActivitiesStyleLayout
      title="Leads Convertidos"
      description="Gerencie seus leads convertidos"
      onCreateClick={handleCreateActivity}
      searchPlaceholder="Buscar leads..."
      searchValue={searchParam}
      onSearchChange={handleSearch}
      filters={filters}
      stats={[]}
      navActions={actionsRight}
      viewModes={viewModes}
      currentViewMode={viewMode}
      onViewModeChange={setViewMode}
    >
      {loading ? (
        <div style={{ padding: 20, textAlign: "center" }}>Carregando...</div>
      ) : (
        <>
          {viewMode === "list" && <LeadsList activities={filteredActivities} />}
        </>
      )}
    </ActivitiesStyleLayout>

    <CreateActivityModal
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      onSave={(created) => {
        setActivitiesState((prev) => [created, ...prev]);
      }}
    />
    </>
  );
};

export default LeadsConvertidos;
