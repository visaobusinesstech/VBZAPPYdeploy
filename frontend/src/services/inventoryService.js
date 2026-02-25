import api from "./api";

const inventoryService = {
  list: async ({ searchParam, pageNumber }) => {
    const { data } = await api.get("/inventory", {
      params: { searchParam, pageNumber }
    });
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/inventory", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/inventory/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/inventory/${id}`);
    return data;
  },
};

export default inventoryService;
