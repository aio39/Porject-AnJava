import { Router } from 'express';
// import userModel from '../models/User';
import {
  postLogin,
  postSign,
  getUserDetail,
  patchUser,
  deleteUser,
  patchGrantAdmin,
} from '../controllers/userControllers';
import routes from '../routes';
import jwtAuth from '../helpers/jwtAuthMiddle';

const userRouter = Router();

// * 로그인
userRouter.route('/').post(postLogin);

// * 회원 가입
userRouter.route(routes.userSign).post(postSign);
userRouter
  .route('/createAdmin')
  .post(jwtAuth.checkToken, jwtAuth.adminCheck, postSign);

userRouter
  .route('/grantAdmin')
  .patch(jwtAuth.checkToken, jwtAuth.adminCheck, patchGrantAdmin);

// * 현재 유저의 정보와 예약 정보 등
userRouter
  .route(routes.user)
  .get(jwtAuth.checkToken, getUserDetail)
  .patch(jwtAuth.checkToken, patchUser) // todo
  .delete(jwtAuth.checkToken, deleteUser); // todo

export default userRouter;
