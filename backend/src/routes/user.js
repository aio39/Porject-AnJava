import { Router } from 'express';
// import userModel from '../models/User';
import {
  postLogin,
  postSign,
  getUserDetail,
} from '../controllers/userControllers';
import routes from '../routes';
import jwtAuth from '../helpers/jwtAuthMiddle';

const userRouter = Router();

// * 회원 가입
userRouter.route('/').post(postLogin);

// * 로그인
userRouter.route(routes.userSign).post(postSign);

// * 현재 유저의 정보와 예약 정보 등
userRouter
  .route(routes.user)
  .get(jwtAuth.checkToken, getUserDetail)
  .patch(jwtAuth.checkToken, patchUser)
  .delete(jwtAuth.checkToken, deleteUser);

export default userRouter;
