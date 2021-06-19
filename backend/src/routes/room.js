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
  deleteRoom,
  patchRoom,
  patchAcceptDateRoom,
  patchRoomForbiddenSit,
} from '../controllers/roomControllers';
import jwtAuth from '../helpers/jwtAuthMiddle';
import { checkIsRoom } from '../helpers/middleware';

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
  .all(checkIsRoom)
  .get(getOneRoom)
  .patch(jwtAuth.adminCheck, patchRoom) // todo
  .delete(jwtAuth.adminCheck, deleteRoom);

// * 방 에약 관련 라우터
roomRouter
  .route(routes.reserveRoom)
  .all(checkIsRoom)
  .post(postReserveRoom)
  .delete(deleteReserveRoom);

roomRouter
  .route(routes.forbiddenRoomSit)
  .all(checkIsRoom, jwtAuth.adminCheck)
  .patch(patchRoomForbiddenSit);

// * 방 리셋 관련 라우터
roomRouter
  .route(routes.resetDateRoom)
  .all(checkIsRoom)
  .patch(jwtAuth.adminCheck, patchResetDateRoom)
  .get(getTestResetDateRoom);

// * 방 접수 시작 시간 관련 라우터
roomRouter
  .route(routes.acceptDateRoom)
  .all(checkIsRoom)
  .patch(jwtAuth.adminCheck, patchAcceptDateRoom);

export default roomRouter;
