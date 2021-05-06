import roomModel from '../models/Room';
import apiResponse from './apiResponse';

export const checkIsRoom = async (req, res, next) => {
  try {
    const result = await roomModel
      .findOne({ roomNum: req.params.id })
      .exec()
      .then(room => {
        if (!room) return false;
        return true;
      });

    if (result) return next();
    return apiResponse.notFoundResponse(res, `${req.params.id}방은 없습니다.`);
  } catch (error) {
    apiResponse.parmaNotSatisfyResponse(res, error.message);
  }
};
