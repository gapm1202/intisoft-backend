import { Router } from "express";
import * as controller from "../controllers/empresa.controller";
import sedesRouter from "./sede.routes";
import historialRouter from "./historial.routes";
import inventarioRouter from "./inventario.routes";
import contratosRouter from "./contract.routes";
import { authenticate, authorizeRole } from "../../../middlewares/auth.middleware";

const router = Router();

// Public: allow GETs for authenticated users
router.get("/", authenticate, controller.list);
router.get("/:id", authenticate, controller.getOne);

// Protected: only administradores can create/update/delete
router.post("/", authenticate, authorizeRole(["administrador"]), controller.create);
router.put("/:id", authenticate, authorizeRole(["administrador"]), controller.update);
router.delete("/:id", authenticate, authorizeRole(["administrador"]), controller.remove);

// Nested sedes routes: /api/empresas/:empresaId/sedes
router.use("/:id/sedes", sedesRouter);

// Nested historial routes: /api/empresas/:empresaId/historial
router.use("/:id/historial", historialRouter);

// Nested inventario routes: /api/empresas/:empresaId/inventario
router.use("/:empresaId", inventarioRouter);

// Nested contratos routes: /api/empresas/:id/contratos
router.use("/:id/contratos", contratosRouter);

export default router;
