import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

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
