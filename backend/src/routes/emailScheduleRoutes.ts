import express from "express";
import isAuth from "../middleware/isAuth";
import * as EmailScheduleController from "../controllers/EmailScheduleController";

const routes = express.Router();

routes.get("/email/schedules", isAuth, EmailScheduleController.index);

export default routes;
