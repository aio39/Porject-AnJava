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
  // getResetTest,
} from '../controllers/roomControllers';
import jwtAuth from '../helpers/jwtAuthMiddle';

const roomRouter = Router();

roomRouter
  .route('/')
  .get(getAllRooms)
  .post(jwtAuth.checkToken, jwtAuth.adminCheck, postNewRoom);

roomRouter.route(routes.roomOne).get(getOneRoom);

// * 방 에약 관련 라우터
roomRouter
  .route(routes.reserveRoom)
  .post(postReserveRoom)
  .delete(deleteReserveRoom);

// * 방 리셋 관련 라우터
roomRouter
  .route(routes.resetDateRoom)
  .patch(patchResetDateRoom)
  .get(getTestResetDateRoom);

// roomRouter.get('/resettest', getResetTest);

export default roomRouter;
