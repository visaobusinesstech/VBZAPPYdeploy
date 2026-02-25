import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { useTranslation } from "react-i18next";
import {
  List as ListIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from "@material-ui/icons";
import ReportProblemOutlinedIcon from "@material-ui/icons/ReportProblemOutlined";
import AttachMoneyOutlinedIcon from "@material-ui/icons/AttachMoneyOutlined";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { ViewWeek as KanbanIcon } from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import ActivitiesStyleLayout from "../../components/ActivitiesStyleLayout";
import { Button, CircularProgress, Drawer, Box, IconButton } from "@material-ui/core";
import { Close as CloseIcon } from "@material-ui/icons";
import api from "../../services/api";
import { toast } from "react-toastify";
import useInventory from "../../hooks/useInventory";

import { Grid, Paper, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl, Fab } from "@material-ui/core";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import inventoryService from "../../services/inventoryService";
import KanbanBoard from "../../components/KanbanBoard";

const columnsDef = [
  { id: "in_stock", title: "Em Estoque", color: "#10B981" },
  { id: "low_stock", title: "Estoque Baixo", color: "#F59E0B" },
  { id: "out_of_stock", title: "Sem Estoque", color: "#EF4444" },
  { id: "ordered", title: "Pedido Efetuado", color: "#3B82F6" }
];

const InventoryBoard = ({ data, loading, onMove }) => {
  if (loading) return <CircularProgress />;
  const getByCol = (colId) => (Array.isArray(data) ? data.filter(i => String(i.status || "").toLowerCase() === colId) : []);
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (onMove) onMove(draggableId, source.droppableId, destination.droppableId);
  };
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Grid container spacing={2} style={{ height: '100%', overflowX: 'auto', flexWrap: 'nowrap' }}>
        {columnsDef.map((col) => (
          <Grid item xs={12} sm={6} md={3} key={col.id} style={{ minWidth: 280 }}>
            <Paper style={{ height: '100%', padding: 16, backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom style={{ color: '#333' }}>
                {col.title}
              </Typography>
              <Droppable droppableId={col.id}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: 100 }}>
                    {getByCol(col.id).map((item, index) => (
                      <Draggable draggableId={String(item.id)} index={index} key={item.id}>
                        {(prov) => (
                          <Card ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} style={{ marginBottom: 8 }}>
                            <CardContent>
                              <Typography variant="subtitle1">{item.name || "Sem nome"}</Typography>
                              <Typography variant="body2" color="textSecondary">Qtd: {item.quantity || 0}</Typography>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </DragDropContext>
  );
};

const InventoryList = ({ data, loading, onEdit, onDelete }) => {
    if (loading) return <CircularProgress />;
    const items = Array.isArray(data) ? data : [];
    const totalItens = items.length;
    const semEstoque = items.filter(i => String(i.status || "").toLowerCase() === "out_of_stock").length;
    const estoqueBaixo = items.filter(i => String(i.status || "").toLowerCase() === "low_stock").length;
    const emEstoque = items.filter(i => String(i.status || "").toLowerCase() === "in_stock").length;
    const valorTotal = items.reduce((sum, i) => {
      const q = Number(i.quantity || 0);
      const p = Number(i.price || 0);
      if (!isFinite(q) || !isFinite(p)) return sum;
      return sum + q * p;
    }, 0);
    
    return (
        <div>
          <div style={{
            display: "flex",
            flexWrap: "nowrap",
            gap: 16,
            justifyContent: "center",
            padding: "0 24px",
            margin: "0 auto 24px",
            width: "100%",
            maxWidth: 1120,
            overflowX: "auto"
          }}>
            {[
              { label: "Itens", value: totalItens, icon: <ListIcon style={{ color: "#111827" }} /> },
              { label: "Em Estoque", value: emEstoque, icon: <CheckCircleOutlineIcon style={{ color: "#111827" }} /> },
              { label: "Estoque Baixo", value: estoqueBaixo, icon: <ReportProblemOutlinedIcon style={{ color: "#111827" }} /> },
              { label: "Sem Estoque", value: semEstoque, icon: <CloseIcon style={{ color: "#111827" }} /> },
              { label: "Valor Total", value: (valorTotal || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}), icon: <AttachMoneyOutlinedIcon style={{ color: "#111827" }} /> }
            ].map((c) => (
              <Paper key={c.label} style={{
                borderRadius: 12,
                padding: 12,
                border: "1px solid #E5EAF1",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 6px 16px rgba(2,6,23,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 8,
                minHeight: 110,
                width: 200,
                flex: "0 0 auto",
                background: "#ffffff"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, color: "#0F172A", whiteSpace: "nowrap" }}>{c.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#0F172A", whiteSpace: "nowrap" }}>{c.value}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "auto" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 10, background: "#F3F4F6",
                    display: "grid", placeItems: "center"
                  }}>
                    {c.icon}
                  </div>
                </div>
              </Paper>
            ))}
          </div>
        <TableContainer component={Paper} style={{ maxWidth: 1120, margin: "0 auto", padding: "0 16px", borderRadius: 12, border: "1px solid #E5EAF1", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 6px 16px rgba(2,6,23,0.06)" }}>
            <Table size="small">
            <TableHead>
                <TableRow>
                <TableCell style={{ width: "48%", padding: "8px 12px" }}>Produto</TableCell>
                <TableCell style={{ width: "22%", padding: "8px 12px" }}>Status</TableCell>
                <TableCell style={{ width: "15%", padding: "8px 12px" }}>Quantidade</TableCell>
                <TableCell style={{ width: "15%", padding: "8px 12px" }}>Preço</TableCell>
                <TableCell style={{ width: 88, padding: "8px 8px" }} align="right">Ações</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {data && data.length > 0 ? (
                    data.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell style={{ padding: "8px 12px" }}>{item.name}</TableCell>
                            <TableCell style={{ padding: "8px 12px" }}>{(() => {
                              const map = {
                                in_stock: "Em Estoque",
                                low_stock: "Estoque Baixo",
                                out_of_stock: "Sem Estoque",
                                ordered: "Pedido Efetuado"
                              };
                              return map[String(item.status || "").toLowerCase()] || item.status;
                            })()}</TableCell>
                            <TableCell style={{ padding: "8px 12px" }}>{item.quantity}</TableCell>
                            <TableCell style={{ padding: "8px 12px" }}>{typeof item.price === "number" ? `R$ ${item.price.toFixed(2)}` : item.price}</TableCell>
                            <TableCell style={{ padding: "8px 8px" }} align="right">
                              <IconButton size="small" onClick={() => onEdit(item)} aria-label="editar">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => onDelete(item)} aria-label="excluir" color="secondary">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} align="center" style={{ padding: "12px" }}>Nenhum produto encontrado</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </TableContainer>
        </div>
    );
};

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  content: {
    flex: 1,
    overflowY: "auto",
  },
  fab: {
    position: "fixed",
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    backgroundColor: "#131B2D",
    color: "#fff"
  },
  drawerPaper: {
    width: 420,
    maxWidth: "100%",
    padding: theme.spacing(2),
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
    borderRadius: "16px 0 0 16px",
  },
  drawerContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
  },
  drawerTitle: {
    fontWeight: 600,
  },
  drawerContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
  },
  drawerActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: theme.spacing(3),
    gap: theme.spacing(1),
  },
}));

const Inventory = () => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("list");
  const [searchParam, setSearchParam] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", quantity: 0, status: "in_stock" });
  const [inventoryState, setInventoryState] = useState([]);
  
  const { inventory, loading, count } = useInventory({
      pageNumber: 1,
      searchParam
  });
  useEffect(() => {
    setInventoryState(Array.isArray(inventory) ? inventory : []);
  }, [inventory]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: "Lista", value: "list", icon: <ListIcon /> },
    { label: "Quadro", value: "board", icon: <KanbanIcon /> },
  ];

  const handleOpen = (item) => {
    if (item) {
      setEditItem(item);
      setForm({
        name: item.name || "",
        price: item.price || "",
        quantity: item.quantity || 0,
        status: item.status || "in_stock"
      });
    } else {
      setEditItem(null);
      setForm({ name: "", price: "", quantity: 0, status: "in_stock" });
    }
    setOpenModal(true);
  };
  const handleClose = () => setOpenModal(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === "quantity" ? Number(value) : value }));
  };
  const handleSave = async () => {
    try {
      const normalizedPrice = (() => {
        const raw = String(form.price ?? "")
          .replace(/[^\d,.,,-]/g, "")
          .replace(/\s+/g, "");
        const canon = raw
          .replace(/\./g, "")
          .replace(",", ".");
        const n = parseFloat(canon);
        return Number.isFinite(n) ? n : 0;
      })();
      const payload = {
        name: form.name || "",
        price: normalizedPrice,
        quantity: Number(form.quantity || 0),
        status: form.status || undefined
      };
      if (editItem) {
        const saved = await inventoryService.update(editItem.id, payload);
        setInventoryState(prev => prev.map(i => i.id === saved.id ? saved : i));
        toast.success("Produto atualizado");
      } else {
        const created = await inventoryService.create(payload);
        setInventoryState(prev => [created, ...prev]);
        toast.success("Produto criado");
      }
      setOpenModal(false);
    } catch (err) {
      toast.error("Erro ao salvar");
    }
  };
  const handleDelete = async (item) => {
    try {
      await inventoryService.delete(item.id);
      setInventoryState(prev => prev.filter(i => i.id !== item.id));
      toast.success("Produto excluído");
    } catch (err) {
      toast.error("Erro ao excluir");
    }
  };
  const handleMove = async (id, from, to) => {
    try {
      const saved = await inventoryService.update(id, { status: to });
      setInventoryState(prev => prev.map(i => String(i.id) === String(id) ? saved : i));
    } catch (err) {
      toast.error("Erro ao mover");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "board":
        return (
          <KanbanBoard
            columns={[
              { id: "in_stock", title: "Em Estoque", color: "#10B981" },
              { id: "low_stock", title: "Estoque Baixo", color: "#F59E0B" },
              { id: "out_of_stock", title: "Sem Estoque", color: "#EF4444" },
              { id: "ordered", title: "Pedido Efetuado", color: "#3B82F6" }
            ]}
            statusResolver={(status) => {
              const s = String(status || "").toLowerCase();
              if (["in_stock","em estoque","estoque"].includes(s)) return "in_stock";
              if (["low_stock","estoque baixo","baixo"].includes(s)) return "low_stock";
              if (["out_of_stock","sem estoque","esgotado"].includes(s)) return "out_of_stock";
              if (["ordered","pedido efetuado","pedido"].includes(s)) return "ordered";
              return "in_stock";
            }}
            activities={(Array.isArray(inventoryState) ? inventoryState : []).map((i) => ({
              id: i.id,
              title: i.name || "Sem nome",
              description: `Qtd: ${i.quantity ?? 0}  •  R$ ${Number(i.price || 0).toFixed(2)}`,
              date: i.createdAt || i.updatedAt || null,
              status: String(i.status || "").toLowerCase()
            }))}
            onAdd={() => handleOpen(null)}
            onMove={(id, from, to) => handleMove(id, from, to)}
            onDelete={(activity) => {
              const item = inventoryState.find((x) => String(x.id) === String(activity.id));
              if (item) handleDelete(item);
            }}
          />
        );
      case "list":
        return <InventoryList data={inventoryState} loading={loading} onEdit={handleOpen} onDelete={handleDelete} />;
      default:
        return (
          <KanbanBoard
            columns={[
              { id: "in_stock", title: "Em Estoque", color: "#10B981" },
              { id: "low_stock", title: "Estoque Baixo", color: "#F59E0B" },
              { id: "out_of_stock", title: "Sem Estoque", color: "#EF4444" },
              { id: "ordered", title: "Pedido Efetuado", color: "#3B82F6" }
            ]}
            statusResolver={(status) => {
              const s = String(status || "").toLowerCase();
              if (["in_stock","em estoque","estoque"].includes(s)) return "in_stock";
              if (["low_stock","estoque baixo","baixo"].includes(s)) return "low_stock";
              if (["out_of_stock","sem estoque","esgotado"].includes(s)) return "out_of_stock";
              if (["ordered","pedido efetuado","pedido"].includes(s)) return "ordered";
              return "in_stock";
            }}
            activities={(Array.isArray(inventoryState) ? inventoryState : []).map((i) => ({
              id: i.id,
              title: i.name || "Sem nome",
              description: `Qtd: ${i.quantity ?? 0}  •  R$ ${Number(i.price || 0).toFixed(2)}`,
              date: i.createdAt || i.updatedAt || null,
              status: String(i.status || "").toLowerCase()
            }))}
            onAdd={() => handleOpen(null)}
            onMove={(id, from, to) => handleMove(id, from, to)}
            onDelete={(activity) => {
              const item = inventoryState.find((x) => String(x.id) === String(activity.id));
              if (item) handleDelete(item);
            }}
          />
        );
    }
  };

  return (
    <MainContainer>
      <ActivitiesStyleLayout
        viewModes={tabs}
        currentViewMode={activeTab}
        onViewModeChange={setActiveTab}
        disableFilterBar={false}
        hideDefaultRightFilters
        hideLeftIcon
        searchPlaceholder="Buscar..."
        searchValue={searchParam}
        onSearchChange={setSearchParam}
        onCreateClick={() => handleOpen(null)}
      >
        <div className={classes.content}>
          {renderContent()}
        </div>
      </ActivitiesStyleLayout>

      <Drawer
        anchor="right"
        open={openModal}
        onClose={handleClose}
        classes={{ paper: classes.drawerPaper }}
      >
        <div className={classes.drawerContainer}>
          <div className={classes.drawerHeader}>
            <Typography variant="h6" className={classes.drawerTitle}>
              {editItem ? "Editar Produto" : "Novo Produto"}
            </Typography>
            <IconButton onClick={handleClose} aria-label="fechar">
              <CloseIcon />
            </IconButton>
          </div>

          <div className={classes.drawerContent}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Nome" name="name" value={form.name} onChange={handleChange} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Preço" name="price" value={form.price} onChange={handleChange} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Quantidade" name="quantity" value={form.quantity} onChange={handleChange} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" name="status" value={form.status} onChange={handleChange}>
                    <MenuItem value="in_stock">Em Estoque</MenuItem>
                    <MenuItem value="low_stock">Estoque Baixo</MenuItem>
                    <MenuItem value="out_of_stock">Sem Estoque</MenuItem>
                    <MenuItem value="ordered">Pedido Efetuado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </div>

          <div className={classes.drawerActions}>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button color="primary" variant="contained" onClick={handleSave}>
              {editItem ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </Drawer>
    </MainContainer>
  );
};

export default Inventory;
