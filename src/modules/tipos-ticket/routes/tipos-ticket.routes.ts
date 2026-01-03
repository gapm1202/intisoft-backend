import { Router } from 'express';
import controller from '../controllers/tipos-ticket.controller';
import { authenticate } from '../../../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, controller.list.bind(controller));
router.post('/', authenticate, controller.create.bind(controller));
router.put('/:id', authenticate, controller.update.bind(controller));
router.patch('/:id/toggle', authenticate, controller.toggle.bind(controller));

export default router;
