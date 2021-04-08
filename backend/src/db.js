import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { testPatchResetDate } from './helpers/utility';

dotenv.config();

mongoose.set('debug', true);

const connectToDB = () => {
  mongoose
    .connect(process.env.MONGO_URL_ATLAS, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => console.log('✅  Connected to DB'))
    .catch(error => console.log(`❌ Error on DB Connection:${error}`));
};

connectToDB();

// const db = mongoose.connection;
// db.once('open', handleOpen);
// db.on('error', setInterval(connectToDB, 3000));

mongoose.connection.on('disconnected', connectToDB);
// todo db에 연결 && Dev 모드일때 fake db 넣주게 하자 .

if (process.env.NODE_ENV === 'develope')
  mongoose.connection.on('connected', testPatchResetDate);
