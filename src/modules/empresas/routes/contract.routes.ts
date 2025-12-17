import { Router } from "express";
import { authenticate, authorizeRole } from "../../../middlewares/auth.middleware";
import * as controller from "../controllers/contract.controller";

const router = Router({ mergeParams: true });

// List and get contract with details
router.get("/", authenticate, controller.list);
router.get("/activo", authenticate, controller.getActive);
router.get("/:contractId", authenticate, controller.getOne);

// Create contract (admin only)
router.post("/", authenticate, authorizeRole(["administrador"]), controller.create);

// Update estado (admin only)
router.patch("/:contractId/estado", authenticate, authorizeRole(["administrador"]), controller.updateEstado);

// Update general data
router.patch("/:contractId", authenticate, authorizeRole(["administrador"]), controller.updateGeneral);

// Update services
router.patch("/:contractId/servicios", authenticate, authorizeRole(["administrador"]), controller.updateServices);

// Update preventive policy
router.patch("/:contractId/preventivo", authenticate, authorizeRole(["administrador"]), controller.updatePreventive);

// Update economics
router.patch("/:contractId/economicos", authenticate, authorizeRole(["administrador"]), controller.updateEconomics);

// Upload documents (multipart)
router.post("/:contractId/documentos", authenticate, authorizeRole(["administrador"]), controller.uploadDocs.any(), controller.uploadDocuments);

// Delete document
router.delete("/:contractId/documentos/:docId", authenticate, authorizeRole(["administrador"]), controller.deleteDocument);

// Renew contract
router.post("/:contractId/renovar", authenticate, authorizeRole(["administrador"]), controller.renew);

// BLOQUEADO: El historial se gestiona SOLO internamente, no desde frontend
// Endpoint de lectura de historial
router.get("/:contractId/historial", authenticate, controller.getHistory);

export default router;
