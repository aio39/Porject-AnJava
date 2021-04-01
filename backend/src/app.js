import express from 'express';
import morgan from 'morgan';
import routes from './routes';
import userRouter from './routes/user';
import roomRouter from './routes/room';
import { notFoundResponse, unauthorizedResponse } from './helpers/apiResponse';

const app = express();

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(routes.users, userRouter);
app.use(routes.room, roomRouter);

// app.use((req, res, next) => {
//   const error = `${req.method} ${req.url} 라우터가 없습니다.`;
//   res.status(500);
//   res.send({ error: error });
// });

// * 잘못 된 라우터에 접근
app.all('*', (req, res) => {
  return notFoundResponse(res, 'Page not found');
});

app.use((err, req, res) => {
  if (err.name === 'UnauthorizedError') {
    console.error(err);
    return unauthorizedResponse(res, err.message);
  }
});

export default app;
