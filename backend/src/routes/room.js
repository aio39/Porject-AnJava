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
  deleteResetDateRoom,
  deleteRoom,
  patchRoom,
  // getResetTest,
} from '../controllers/roomControllers';
import jwtAuth from '../helpers/jwtAuthMiddle';

const roomRouter = Router();

// * room/ 은 반드시 jwt가 있어야함.
roomRouter.use(jwtAuth.checkToken);

// * 방 CRUD
roomRouter
  .route('/')
  .get(getAllRooms) //
  .post(jwtAuth.adminCheck, postCreateRoom);

roomRouter
  .route(routes.roomOne)
  .get(getOneRoom)
  .patch(jwtAuth.adminCheck, patchRoom) // todo
  .delete(jwtAuth.adminCheck, deleteRoom); // todo;

// * 방 에약 관련 라우터
roomRouter
  .route(routes.reserveRoom)
  .post(postReserveRoom)
  .delete(deleteReserveRoom);

// * 방 리셋 관련 라우터
roomRouter
  .route(routes.resetDateRoom)
  .patch(jwtAuth.adminCheck, patchResetDateRoom)
  .delete(jwtAuth.adminCheck, deleteResetDateRoom) // todo
  .get(getTestResetDateRoom);

export default roomRouter;
