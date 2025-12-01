import { Router } from "express";
import * as controller from "../controllers/historial.controller";
import { authenticate, authorizeRole } from "../../../middlewares/auth.middleware";

const router = Router({ mergeParams: true });

router.get("/", authenticate, authorizeRole(["administrador"]), controller.getHistorial);

export default router;
