import api from "./api";

const inventoryService = {
  list: async (params) => {
    // MOCK DATA
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                inventory: [
                    { id: 1, name: "Produto 1", quantity: 10, price: 100 },
                    { id: 2, name: "Produto 2", quantity: 5, price: 200 },
                    { id: 3, name: "Produto 3", quantity: 0, price: 300 },
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

export default inventoryService;
