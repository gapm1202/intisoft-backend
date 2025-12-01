import { Router } from "express";
import * as controller from "../controllers/inventario.controller";
import { authenticate, authorizeRole } from "../../../middlewares/auth.middleware";

const router = Router();

// ===== CATEGORIAS GLOBALES (sin empresa) =====
router.post("/", authenticate, authorizeRole(["administrador"]), controller.createCategoriaGlobal);
router.get("/", authenticate, controller.listCategoriasGlobales);
router.put("/:id", authenticate, authorizeRole(["administrador"]), controller.updateCategoriaGlobal);
router.delete("/:id", authenticate, authorizeRole(["administrador"]), controller.deleteCategoriaGlobal);

export default router;
