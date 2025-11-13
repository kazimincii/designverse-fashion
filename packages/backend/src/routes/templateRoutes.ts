import { Router } from 'express';
import { getAllTemplates, getTemplateById, fillTemplate } from '../controllers/templateController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/templates', optionalAuth, getAllTemplates);
router.get('/templates/:id', optionalAuth, getTemplateById);
router.post('/templates/:id/fill', authenticate, fillTemplate);

export default router;
