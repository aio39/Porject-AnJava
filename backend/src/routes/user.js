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

userRouter.route('/').post(postLogin);

userRouter.route(routes.userSign).post(postSign);
userRouter.route(routes.userDetail).get(jwtAuth.checkToken, getUserDetail);

export default userRouter;
