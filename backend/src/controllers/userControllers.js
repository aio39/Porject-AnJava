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
