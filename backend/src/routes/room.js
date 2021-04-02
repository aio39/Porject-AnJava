import { Router } from 'express';
import routes from '../routes';
import {
  getAllRooms,
  postNewRoom,
  getOneRoom,
  postReserveRoom,
  deleteReserveRoom,
  patchResetDateRoom,
  getTestResetDateRoom,
} from '../controllers/roomControllers';

const router = Router();

router.get('/', getAllRooms);
router.post('/', postNewRoom);
router.get(routes.roomOne, getOneRoom);
router.post(routes.reserveRoom, postReserveRoom);
router.delete(routes.reserveRoom, deleteReserveRoom);
router.patch(routes.resetDateRoom, patchResetDateRoom);
router.get(routes.resetDateRoom, getTestResetDateRoom);

export default router;
