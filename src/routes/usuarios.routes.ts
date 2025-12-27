import { Router } from "express";
import { listAdministrativos } from "../controllers/usuarios.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// GET /api/usuarios/administrativos
router.get("/administrativos", authenticate, listAdministrativos);

export default router;
