import express from "express";
import isAuth from "../middleware/isAuth";
import * as UserController from "../controllers/UserController";
import * as SessionController from "../controllers/SessionController";
import * as PaymentConfirmationController from "../controllers/PaymentConfirmationController";

const authRoutes = express.Router();

authRoutes.post("/signup", UserController.store);
authRoutes.post("/login", SessionController.store);
authRoutes.post("/refresh_token", SessionController.update);
authRoutes.delete("/logout", isAuth, SessionController.remove);
authRoutes.get("/me", isAuth, SessionController.me);
authRoutes.post("/validate-cnpj", UserController.validateCnpj);
authRoutes.get("/confirm/by-email", PaymentConfirmationController.byEmail);
authRoutes.get("/confirm/:token", PaymentConfirmationController.show);
authRoutes.post("/confirm/:token", PaymentConfirmationController.consume);

export default authRoutes;
