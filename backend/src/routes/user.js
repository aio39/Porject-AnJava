import { Router } from 'express';
// import userModel from '../models/User';
import { postLogin, postSign } from '../controllers/userControllers';
import routes from '../routes';

const userRouter = Router();

userRouter.post('/', postLogin);

userRouter.post(routes.userSign, postSign);

export default userRouter;
