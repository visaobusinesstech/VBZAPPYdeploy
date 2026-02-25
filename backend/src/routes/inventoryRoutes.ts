import express from "express";
import isAuth from "../middleware/isAuth";
import * as InventoryController from "../controllers/InventoryController";

const routes = express.Router();

routes.get("/inventory", isAuth, InventoryController.index);
routes.get("/inventory/:id", isAuth, InventoryController.show);
routes.post("/inventory", isAuth, InventoryController.store);
routes.put("/inventory/:id", isAuth, InventoryController.update);
routes.delete("/inventory/:id", isAuth, InventoryController.remove);

export default routes;
