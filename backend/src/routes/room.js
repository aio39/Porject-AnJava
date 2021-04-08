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
  getResetTest,
} from '../controllers/roomControllers';
import jwtAuth from '../helpers/jwtAuthMiddle';

const router = Router();

router.get('/resettest', getResetTest);
router.get('/', getAllRooms);
router.post('/', jwtAuth.checkToken, postNewRoom);
router.get(routes.roomOne, getOneRoom);
router.post(routes.reserveRoom, postReserveRoom);
router.delete(routes.reserveRoom, deleteReserveRoom);
router.patch(routes.resetDateRoom, patchResetDateRoom);
router.get(routes.resetDateRoom, getTestResetDateRoom);

export default router;
