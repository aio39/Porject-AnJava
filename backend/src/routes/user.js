import { Router } from 'express';
import User from '../models/User';
const router = Router();

router.get('/', (req, res) => {
  return res.send('안녕');
});

router.get('/:userId', async (req, res) => {
  const {
    params: { userId },
  } = req;
  await User.create(
    userId,
    'aio2',
    'password',
    'aiodev2.js@gmail.com',
    2109998,
  );
  await User.findOne({ userId: 'aio' }).then(user =>
    console.log(`찾은 유저의 정보는 ${user}`),
  );
  return res.send(userId);
});

export default router;
