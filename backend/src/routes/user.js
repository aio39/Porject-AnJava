import { Router } from 'express';
// import userModel from '../models/User';
import {
  postLogin,
  postSign,
  getUserDetail,
} from '../controllers/userControllers';
import routes from '../routes';

const userRouter = Router();

userRouter.route('/').post(postLogin);

userRouter.route(routes.userSign).post(postSign);
userRouter.route(routes.userDetail).get(getUserDetail);

export default userRouter;
