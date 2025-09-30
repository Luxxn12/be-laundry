import { Router } from 'express';

const router = Router();

router.post('/', (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented' });
});

export default router;
