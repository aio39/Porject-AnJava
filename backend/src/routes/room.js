import { Router } from 'express';
import routes from '../routes';
import {
  getAllRooms,
  postNewRoom,
  getOneRoom,
  postReserveRoom,
  deleteReserveRoom,
} from '../controllers/roomControllers';

const router = Router();

router.get('/', getAllRooms);
router.post('/', postNewRoom);
router.get(routes.roomOne, getOneRoom);
router.post(routes.reserveRoom, postReserveRoom);
router.delete(routes.reserveRoom, deleteReserveRoom);

export default router;
