import express from 'express';
import morgan from 'morgan';
import routes from './routes';
import userRouter from './routes/user';
import roomRouter from './routes/room';
import testRouter from './routes/test';
import apiResponse from './helpers/apiResponse';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerDocument from './swagger.json';

process.env.NODE_ENV = process.env.NODE_ENV
  ? process.env.NODE_ENV
  : 'production';

const specs = await swaggerJsdoc(swaggerDocument);

const app = express();
if (process.env.NODE_ENV === 'develope') {
  app.use(morgan('dev'));
}

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(routes.users, userRouter);
app.use(routes.room, roomRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// * 잘못 된 라우터에 접근
app.all('*', (req, res) => {
  return apiResponse.notFoundResponse(res, 'Page not found');
});

app.use((err, req, res, next) => {
  console.error(err);
  return apiResponse.unauthorizedResponse(res, err.message);
});

process.on('uncaughtException', err => {
  console.log('uncaughtException' + err);
});

export let nextResetScheduleData = {
  date: null,
  nextResetRoom: [],
};

export default app;
