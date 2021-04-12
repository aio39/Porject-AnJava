import jwtFunc from './jwt';
import apiResponse from './apiResponse';

const TOKEN_EXPIRED = -3;
const TOKEN_INVALID = -2;

const jwtAuth = {
  checkToken: async (req, res, next) => {
    var token = req.headers.authorization;
    if (!token)
      return apiResponse.unauthorizedResponse(res, '옳바르지 않은 토큰입니다.');
    const decodedResult = await jwtFunc.verify(token);
    if (decodedResult === TOKEN_EXPIRED)
      return res.json({ error: '토큰 에러1' });
    if (decodedResult === TOKEN_INVALID)
      return res.json({ error: '토큰 에러2' });
    if (decodedResult.userId === undefined)
      return res.json({ error: '토큰 에러3' });
    console.log(decodedResult);
    req.body.userId = decodedResult.userId;
    req.body.isAdmin = decodedResult.isAdmin;
    next();
  },
  adminCheck: (req, res, next) => {
    if (req.body.isAdmin) return next();
    return apiResponse.unauthorizedResponse(
      res,
      `${req.body.userId}님은 관리자 권한이 없습니다.`,
    );
  },
};

export default jwtAuth;
