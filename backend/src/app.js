import express from 'express';
import morgan from 'morgan';
import routes from './routes';
import userRouter from './routes/user';
import roomRouter from './routes/room';
import testRouter from './routes/test';
import { notFoundResponse, unauthorizedResponse } from './helpers/apiResponse';
import {
  getNextResetScheduleData,
  registerResetRoomScheduleJob,
} from './helpers/utility';
process.env.NODE_ENV = process.env.NODE_ENV
  ? process.env.NODE_ENV
  : 'production';

const app = express();

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(routes.users, userRouter);
app.use(routes.room, roomRouter);

export let nextResetScheduleData;

(async function () {
  try {
    //  nextResetScheduleData = await getNextResetScheduleData();

    nextResetScheduleData = {
      date: new Date(Date.now() + 4000),
      nextResetRoom: [202, 201],
    };
    registerResetRoomScheduleJob();
  } catch (error) {
    console.log(error);
  }
})();

if (process.env.NODE_ENV === 'develope') app.use('/test', testRouter);

// app.use((req, res, next) => {
//   const error = `${req.method} ${req.url} 라우터가 없습니다.`;
//   res.status(500);
//   res.send({ error: error });
// });

// * 잘못 된 라우터에 접근
app.all('*', (req, res) => {
  return notFoundResponse(res, 'Page not found');
});

app.use((err, req, res, next) => {
  console.error(err);
  return unauthorizedResponse(res, err.message);
});

process.on('uncaughtException', err => {
  console.log('uncaughtException' + err);
});

export default app;
