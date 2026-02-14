import api from "./api";

const activitiesService = {
  list: async (params) => {
    // MOCK DATA
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                activities: [
                    { id: 1, title: "Ligar para cliente", type: "call", date: "2023-10-01", status: "pending" },
                    { id: 2, title: "Enviar proposta", type: "email", date: "2023-10-02", status: "completed" },
                    { id: 3, title: "Reunião de alinhamento", type: "meeting", date: "2023-10-03", status: "pending" },
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

export default activitiesService;
