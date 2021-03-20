import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  return res.send('안녕');
});

router.get('/:userId', (req, res) => {
  const {
    params: { userId },
  } = req;
  return res.send(userId);
});

export default router;
