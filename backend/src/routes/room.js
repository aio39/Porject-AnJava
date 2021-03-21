import { Router } from 'express';
import routes from '../routes';
import {
  getAllRooms,
  postNewRoom,
  getOneRoom,
} from '../controllers/roomControllers';

const router = Router();

router.get('/', getAllRooms);
router.post('/', postNewRoom);
router.get(routes.roomOne, getOneRoom);

export default router;
