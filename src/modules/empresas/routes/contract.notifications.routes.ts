import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware";
import * as controller from "../controllers/contract.notifications.controller";

const router = Router();

router.get("/proximos-a-vencer", authenticate, controller.getProximosAVencer);

export default router;
