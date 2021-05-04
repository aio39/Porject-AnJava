import userModel from '../models/User';
import jwt from '../helpers/jwt';
import apiResponse from '../helpers/apiResponse';

// * 회원 가입
export const postLogin = async (req, res) => {
  const {
    body: { userId, password },
  } = req;

  try {
    const isAdmin = await userModel.isAdmin(userId);
    console.log(isAdmin);
    const user = { userId, isAdmin };
    if (await userModel.checkPassword(userId, password)) {
      const token = await jwt.sign(user);

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

// * 로그인
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

// * 현재 유저의 정보와 예약 정보 등
export const getUserDetail = async (req, res) => {
  const {
    params: { id },
  } = req;
  if (!req.body.isAdmin && id !== req.body.userId)
    return apiResponse.unauthorizedResponse(res, '권한이 없습니다.');

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
          'reservedRooms.reserveDate': 1,
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

export const patchUser = async (req, res) => {};

export const deleteUser = async (req, res) => {
  const {
    params: { id },
  } = req;
  if (!req.body.isAdmin && id !== req.body.userId)
    return apiResponse.unauthorizedResponse(res, '권한이 없습니다.');

  try {
    await userModel.deleteOne({ userId });
  } catch (error) {
    console.error(error);

    return apiResponse.notFoundResponse(res, `${userId}를 찾지 못 했습니다`);
  }

  return apiResponse.successResponse(res, `${userId}가 삭제되었습니다.`);
};
