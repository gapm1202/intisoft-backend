import { Router } from "express";
import * as controller from "../controllers/sede.controller";
import { authenticate, authorizeRole } from "../../../middlewares/auth.middleware";

const router = Router({ mergeParams: true });

router.get("/", authenticate, controller.list);
router.post("/", authenticate, authorizeRole(["administrador"]), controller.create);
router.put("/:sedeId", authenticate, authorizeRole(["administrador"]), controller.update);
router.delete("/:sedeId", authenticate, authorizeRole(["administrador"]), controller.remove);

export default router;
