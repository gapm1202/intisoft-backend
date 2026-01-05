import { Router } from 'express';
import * as usuarioEmpresaController from '../controllers/usuario-empresa.controller';
import { authenticate } from '../../../middlewares/auth.middleware';

const router = Router({ mergeParams: true }); // mergeParams para acceder a :empresaId

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// GET /api/empresas/:empresaId/usuarios - Listar usuarios de la empresa
router.get('/', usuarioEmpresaController.getAllByEmpresa);

// GET /api/empresas/:empresaId/usuarios/:usuarioId - Obtener usuario por ID
router.get('/:usuarioId', usuarioEmpresaController.getById);

// POST /api/empresas/:empresaId/usuarios - Crear usuario
router.post('/', usuarioEmpresaController.create);

// PUT /api/empresas/:empresaId/usuarios/:usuarioId - Actualizar usuario
router.put('/:usuarioId', usuarioEmpresaController.update);

// DELETE /api/empresas/:empresaId/usuarios/:usuarioId - Eliminar usuario (soft delete)
router.delete('/:usuarioId', usuarioEmpresaController.remove);

export default router;
