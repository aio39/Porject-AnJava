// import randToken from 'rand-token';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN_EXPIRED = -3;
const TOKEN_INVALID = -2;

const JWT_SET = {
  secretKey: process.env.JWT_SECRET_KEY, //
  option: {
    algorithm: process.env.JWT_ALGORITHM,
    expiresIn: process.env.JWT_EXPIRESIN,
    issuer: process.env.JWT_ISSUER,
  },
};

const jwtFunc = {
  sign: async user => {
    const payload = {
      userId: user.userId,
      isAdmin: user.isAdmin,
    };
    const token = jwt.sign(payload, JWT_SET.secretKey, JWT_SET.options);
    //   refreshToken: randToken.uid(256),
    return token;
  },
  verify: async token => {
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SET.secretKey);
    } catch (err) {
      if (err.message === 'jwt expired') {
        console.log('expired token');
        return TOKEN_EXPIRED;
      } else if (err.message === 'invalid token') {
        console.log('invalid token');
        console.log(TOKEN_INVALID);
        return TOKEN_INVALID;
      } else {
        console.log('invalid token');
        return TOKEN_INVALID;
      }
    }
    return decoded;
  },
};

export default jwtFunc;
