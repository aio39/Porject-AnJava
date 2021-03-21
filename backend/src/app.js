import express from 'express';
import morgan from 'morgan';
import routes from './routes';
import userRouter from './routes/user';
import roomRouter from './routes/room';
// import apiRouter from './routers/apiRouter';

// import routes from '../../example/node-express-server-rest-api-master/src/routes';
// import mongoose from 'mongoose';
// import path from 'path';

const app = express();

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(routes.users, userRouter);
app.use(routes.room, roomRouter);

export default app;
