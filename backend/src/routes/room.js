import { Router } from 'express';
import routes from '../routes';
import {
  getAllRooms,
  postCreateRoom,
  getOneRoom,
  postReserveRoom,
  deleteReserveRoom,
  patchResetDateRoom,
  getTestResetDateRoom,
  // getResetTest,
} from '../controllers/roomControllers';
import jwtAuth from '../helpers/jwtAuthMiddle';

const roomRouter = Router();

roomRouter.use(jwtAuth.checkToken);

roomRouter.route('/').get(getAllRooms).post(jwtAuth.adminCheck, postCreateRoom);

roomRouter.route(routes.roomOne).get(getOneRoom);

// * 방 에약 관련 라우터
roomRouter
  .route(routes.reserveRoom)
  .post(postReserveRoom)
  .delete(jwtAuth.adminCheck, deleteReserveRoom);

// * 방 리셋 관련 라우터
roomRouter
  .route(routes.resetDateRoom)
  .patch(jwtAuth.adminCheck, patchResetDateRoom)
  .get(getTestResetDateRoom);

export default roomRouter;
