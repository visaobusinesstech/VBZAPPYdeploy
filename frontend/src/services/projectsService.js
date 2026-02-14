import api from "./api";

const projectsService = {
  list: async (params) => {
    // MOCK DATA
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                projects: [
                    { id: 1, name: "Projeto Site", status: "Em andamento", progress: 50 },
                    { id: 2, name: "Projeto App", status: "Planejamento", progress: 0 },
                    { id: 3, name: "Projeto Marketing", status: "Concluído", progress: 100 },
                ],
                hasMore: false,
                count: 3
            });
        }, 500);
    });
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

export default projectsService;
