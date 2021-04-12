/* eslint-disable prettier/prettier */
/* eslint-disable no-console */
import mongoose from 'mongoose';
import CryptoJS from 'crypto-js';

const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    min: 4,
    max: 12,
    unique: true,
    trim: true,
    required: true,
  },
  name: { type: String, min: 2, max: 5, trim: true, required: true },
  password: { type: String, required: true },
  email: { type: String, trim: true, required: true },
  isAdmin: { type: Boolean, default: false },
  yjuNum: { type: Number, length: 7, unique: true, required: true },
  reservedRooms: [
    {
      room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
      },
      roomNum: { type: Number },
      reserveDate: {
        type: Date,
        default: Date.now,
      },
      sitNum: { type: Number },
    },
  ],
});

UserSchema.pre;

UserSchema.statics.checkUnique = async function (key, value) {
  const isUnique = await this.findOne({ [key]: value }, (err, docs) => {
    return docs;
  });
  if (isUnique == null) return [true, key];
  return [false, key];
};

UserSchema.statics.handlePassword = async function (password) {
  if (password.length > 7) return [true, 'password'];
  return [false, 'password'];
};

UserSchema.statics.createAccount = async function (
  userId,
  name,
  password,
  email,
  yjuNum,
  isAdmin,
) {
  let signSuccess = true;
  let errorMsg = '';
  const that = this;

  function checkFinish() {
    return Promise.all([
      that.checkUnique('userId', userId),
      that.checkUnique('email', email),
      that.checkUnique('yjuNum', yjuNum),
      that.handlePassword(password),
    ]).then(results => {
      if (!emailRegexp.test(email)) {
        signSuccess = false;
        errorMsg += '이메일 형식이 옳바르지 않습니다.';
      }
      results.forEach(result => {
        if (result[0] === false) {
          signSuccess = false;
          if (result[1] === 'password') {
            errorMsg += `비밀번호가 너무 짧습니다.`;
          } else {
            errorMsg += `${result[1]}은 이미 존재합니다.`;
          }
        }
      });
    });
  }

  return checkFinish().then(() => {
    if (signSuccess === true) {
      try {
        const encryptedPass = CryptoJS.AES.encrypt(
          password,
          process.env.CRYPTO_SECRET_KEY,
        ).toString();
        console.log(encryptedPass);
        that.create({
          userId,
          name,
          password: encryptedPass,
          email,
          yjuNum,
          isAdmin,
        });
      } catch (error) {
        console.log(`DB 등록에 실패하였습니다. ${error}`);
        errorMsg += '서버에 문제가 있었습니다. 다시 시도해 주십시오.';
      }
    }
    console.log(signSuccess, errorMsg);
    return { signSuccess, errorMsg };
  });
};

UserSchema.statics.checkPassword = async function (userId, password) {
  const encryptedUserPass = await this.findOne()
    .where('userId')
    .equals(userId)
    .then(result => {
      return result.password;
    });
  const bytes = CryptoJS.AES.decrypt(
    encryptedUserPass,
    process.env.CRYPTO_SECRET_KEY,
  );
  const decryptedUserPass = bytes.toString(CryptoJS.enc.Utf8);
  if (password.toString() === decryptedUserPass.toString()) {
    return true;
  }
  return false;
};

UserSchema.statics.isAdmin = async function (userId) {
  let isAdmin;
  try {
    isAdmin = await this.findOne({ userId, isAdmin: true }, { isAdmin: true })
      .exec()
      .then(docs => (docs ? true : false));
  } catch (error) {
    throw error;
  }

  if (isAdmin) return true;
  return false;
};

const userModel = mongoose.model('User', UserSchema);

export default userModel;
