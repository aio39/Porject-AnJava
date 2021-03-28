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

app.use((req, res, next) => {
  const error = `${req.method} ${req.url} 라우터가 없습니다.`;
  res.status(500);
  res.send({ error: error });
});

app;

export default app;
