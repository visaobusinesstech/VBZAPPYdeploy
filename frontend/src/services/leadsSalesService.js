import api from "./api";

const leadsSalesService = {
  list: async (params) => {
    // MOCK DATA
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                leadsSales: [
                    { id: 1, name: "Lead 1", status: "Novo", value: 1000 },
                    { id: 2, name: "Lead 2", status: "Em andamento", value: 2000 },
                    { id: 3, name: "Lead 3", status: "Fechado", value: 3000 },
                ],
                hasMore: false,
                count: 3
            });
        }, 500);
    });
    // REAL API CALL (commented out until backend is ready)
    // const { data } = await api.get("/leads-sales", { params });
    // return data;
  },
  create: async (data) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ id: Math.random(), ...data });
        }, 500);
    });
  },
  update: async (id, data) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ id, ...data });
        }, 500);
    });
  },
  delete: async (id) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ message: "Deleted" });
        }, 500);
    });
  },
};

export default leadsSalesService;
