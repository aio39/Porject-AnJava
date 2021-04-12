import userModel from '../models/User';
import jwt from '../helpers/jwt';
import apiResponse from '../helpers/apiResponse';

export const postLogin = async (req, res) => {
  const {
    body: { userId, password },
  } = req;

  try {
    const user = { userId, password };
    if (await userModel.checkPassword(userId, password)) {
      const token = await jwt.sign(user);
      const isAdmin = await userModel.isAdmin(userId);

      apiResponse.successResponseWithData(res, `${userId}님 로그인 성공`, {
        token,
        isAdmin,
      });
    } else {
      apiResponse.unauthorizedResponse(res, 'password or username wrong');
    }
  } catch (error) {
    apiResponse.unauthorizedResponse(res, 'password or username wrong');
  }
};

export const postSign = async (req, res) => {
  const {
    body: { userId, name, password, email, yjuNum },
  } = req;
  const result = await userModel.createAccount(
    userId,
    name,
    password,
    email,
    yjuNum,
    false,
  );
  if (result.signSuccess) {
    apiResponse.successCreateResponse(
      res,
      `${userId}님의 계정이 생성 되었습니다.`,
    );
  } else {
    apiResponse.parmaNotSatisfyResponse(res, result.errorMsg);
  }
};

export const getUserDetail = async (req, res) => {
  const {
    params: { id },
  } = req;
  try {
    const user = await userModel
      .findOne(
        { userId: id },
        {
          isAdmin: 1,
          userId: 1,
          name: 1,
          email: 1,
          yjuNum: 1,
          'reservedRooms.sitNum': 1,
          'reservedRooms.roomNum': 1,
          'reservedRooms.reservedDate': 1,
        },
      )
      .exec()
      .then(docs => docs);
    console.log(user);
    const { isAdmin, userId, name, email, yjuNum, reservedRooms } = user;
    apiResponse.successResponseWithData(res, `${userId}님의 정보 입니다.`, {
      isAdmin,
      userId,
      name,
      email,
      yjuNum,
      reservedRooms,
    });
  } catch (error) {
    console.error(error);
    apiResponse.notFoundResponse(res, `정보를 찾지 못 했습니다.`);
  }
};
