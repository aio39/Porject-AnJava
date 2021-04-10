import { Router } from 'express';
// import userModel from '../models/User';
import { postLogin, postSign } from '../controllers/userControllers';
import routes from '../routes';

const userRouter = Router();

userRouter.route('/').post(postLogin);

userRouter.route(routes.userSign).post(postSign);

export default userRouter;
