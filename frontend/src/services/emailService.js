import api from "./api";

const emailService = {
  list: async (params) => {
    // MOCK DATA
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                emails: [
                    { id: 1, subject: "Bem-vindo", from: "contato@empresa.com", date: "2023-10-01" },
                    { id: 2, subject: "Fatura", from: "financeiro@empresa.com", date: "2023-10-02" },
                    { id: 3, subject: "Suporte", from: "suporte@empresa.com", date: "2023-10-03" },
                ],
                hasMore: false,
                count: 3
            });
        }, 500);
    });
  },
  send: async (data) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ id: Math.random(), ...data });
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

export default emailService;
