import express from "express";
import isAuth from "../middleware/isAuth";
import multer from "multer";
import uploadConfig from "../config/upload";
import * as EmailTemplateController from "../controllers/EmailTemplateController";

const routes = express.Router();

routes.get("/email/templates", isAuth, EmailTemplateController.index);
routes.post("/email/templates", isAuth, EmailTemplateController.store);
routes.put("/email/templates/:id", isAuth, EmailTemplateController.update);
routes.delete("/email/templates/:id", isAuth, EmailTemplateController.remove);
routes.get("/email/templates/:id/attachments", isAuth, EmailTemplateController.listAttachments);

const upload = multer(uploadConfig);
routes.post("/email/templates/:id/attachments", isAuth, upload.array("files"), EmailTemplateController.uploadAttachments);
routes.post("/email/templates/:id/signature-image", isAuth, upload.array("file"), EmailTemplateController.uploadSignatureImage);

export default routes;
