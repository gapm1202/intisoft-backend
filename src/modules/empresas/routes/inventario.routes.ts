import { Router } from "express";
import * as controller from "../controllers/inventario.controller";
import * as codigoController from "../controllers/activos_codigo.controller";
import { authenticate, authorizeRole } from "../../../middlewares/auth.middleware";
import multer from 'multer';
import path from 'path';

// Configure multer to store files with a predictable filename (preserve original name with timestamp)
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.resolve(process.cwd(), 'uploads'));
	},
	filename: (req, file, cb) => {
		const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9.\-_]/g, '_');
		const uniqueName = `${Date.now()}-${safe}`;
		cb(null, uniqueName);
	}
});

const upload = multer({ storage });

const router = Router({ mergeParams: true });

// Middleware: autenticación obligatoria para todas las rutas
router.use(authenticate);

// ===== CATEGORIAS (por empresa) =====
router.post("/categorias", authorizeRole(["administrador"]), controller.createCategoria);
router.get("/categorias", controller.listCategorias);

// ===== AREAS =====
router.post("/areas", authorizeRole(["administrador"]), controller.createArea);
router.get("/areas", controller.listAreas);

// ===== INVENTARIO (por empresa) =====
// Accept any file field name for create endpoints to be tolerant with frontend field naming
router.post("/inventario", authorizeRole(["administrador"]), upload.any(), controller.createInventario);
router.get("/inventario", controller.listInventarioEmpresa);
router.get("/inventario/:id", controller.getInventario);

// ===== INVENTARIO (por sede) =====
// Accept any file field name for create endpoints to be tolerant with frontend field naming
router.post("/sedes/:sedeId/inventario", authorizeRole(["administrador"]), upload.any(), controller.createInventarioSede);
router.get("/sedes/:sedeId/inventario", controller.listInventarioSede);
// Editar inventario en una sede (acepta JSON o multipart/form-data con fotos)
// Use upload.any() to accept files coming with different field names (e.g. 'fotos' or 'fotosFiles')
router.put("/sedes/:sedeId/inventario/:activoId", authorizeRole(["administrador"]), upload.any(), controller.updateInventarioSede);

// ===== FOTOS =====
router.post("/inventario/:inventarioId/fotos", authorizeRole(["administrador"]), controller.uploadFoto);

// ===== ACTIVOS CODIGO =====
// GET /api/empresas/:empresaId/activos/next-code?categoria=<categoriaId>
// Reserve the next available asset code with transactional lock
router.get("/activos/next-code", codigoController.getNextCode);
router.post("/activos/next-code", codigoController.postNextCode);

export default router;
