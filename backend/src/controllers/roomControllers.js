import roomModel from '../models/Room';
import userModel from '../models/User';
import apiResponse from '../helpers/apiResponse';
import { resetAndRegisterNewReset } from '../helpers/utility';
import roomUtility from '../helpers/roomUtility';
import userUtility from '../helpers/userUtility';

// * function
export const resetRoomReserve = async roomNum => {
  try {
    await resetUsersRoomReserve(roomNum);
    await roomModel.updateOne(
      { roomNum },
      { $set: { reservedData: [], resetDate: undefined } },
    );
    console.log(`방 ${roomNum} 리셋됨`);
    return true;
  } catch (error) {
    return false;
  }
};

export const resetUsersRoomReserve = async roomNum => {
  try {
    const { reservedData } = await roomModel
      .findOne({ roomNum }, 'reserveData')
      .populate('reservedData.user', 'userId')
      .exec();
    if (reservedData.length > 0)
      await Promise.all(
        reservedData.forEach(async a => {
          await userModel
            .updateOne(
              { _id: a.user._id },
              { $pull: { reservedRooms: { roomNum } } },
            )
            .exec();
        }),
      );
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// * 방 CRUD
export const getAllRooms = async (req, res) => {
  const {
    body: { userId },
  } = req;

  try {
    const rooms = await roomModel.find({}).exec();
    const { _id: user_id } = await userModel.findOne({ userId }, '_id').exec();

    const roomsData = rooms.map(room => {
      const { roomNum, maxSit, resetDate, reservedData, acceptDate } = room;
      const remainSit = maxSit - reservedData.length;
      let isUserIncluded;
      if (
        reservedData.find(reserve => {
          return reserve.user.toString() === user_id.toString();
        })
      ) {
        isUserIncluded = true;
      } else {
        isUserIncluded = false;
      }
      return {
        roomNum,
        maxSit,
        resetDate,
        remainSit,
        isUserIncluded,
        acceptDate,
      };
    });
    return apiResponse.successResponseWithData(res, `모든 방 리스트입니다.`, {
      roomsData,
    });
  } catch (error) {
    console.error(error);
    return apiResponse.notFoundResponse(res, error);
  }
};
export const postCreateRoom = async (req, res) => {
  const { body } = req;
  try {
    const room = new roomModel({
      ...body,
    });
    await room.save();

    return apiResponse.successResponse(res, '새로운 방이 만들어졌습니다. ');
  } catch (error) {
    console.error(error);
    return apiResponse.parmaNotSatisfyResponse(res, error.message);
  }
};

export const getOneRoom = async (req, res) => {
  const {
    params: { id },
  } = req;

  try {
    const room = await roomModel
      .findOne({ roomNum: id })
      .populate('reservedData.user', 'userId')
      .sort({ 'reservedData.sitNum': 1 })
      .exec();

    const reservedData = {};
    room.reservedData.forEach(data => {
      reservedData[data.sitNum] = data.user.userId;
    });

    const remainSit = room.maxSit - room.reservedData.length;

    const roomData = {
      row: room.row,
      column: room.column,
      rowBlankLine: room.rowBlankLine,
      columnBlankLine: room.columnBlankLine,
      resetDate: room.resetDate || '',
      acceptDate: room.resetDate || '',
      maxSit: room.maxSit,
      remainSit,
      reservedData,
    };

    return apiResponse.successResponseWithData(res, `${id} 방의 정보`, {
      roomData,
    });
  } catch (error) {
    console.error(error);
    return apiResponse.notFoundResponse(res, error);
  }
};

export const patchRoom = async (req, res) => {};

export const deleteRoom = async (req, res) => {
  const {
    params: { id: roomNum },
  } = req;
  try {
    await resetUsersRoomReserve(roomNum);
    await roomModel.findOneAndDelete({ roomNum }).exec();
    return apiResponse.successResponse(res, '방과 유저들의 예약 초기화 성공');
  } catch (error) {
    return apiResponse.notFoundResponse(res, error.message);
  }
};

// * 방 에약 관련 라우터
export const postReserveRoom = async (req, res) => {
  const {
    body: { userId, sitNum },
    params: { id: roomNum },
  } = req;

  let isReserve;
  let userObjectId;
  let isUserHaveReserve;

  try {
    const isAccepting = await roomUtility.checkIsRoomStartAccept(roomNum);
    if (!isAccepting)
      return apiResponse.unauthorizedResponse(res, '접수 시작 전 입니다.');
  } catch (error) {
    console.error(error);
    return apiResponse.notFoundResponse(res, error.message);
  }

  try {
    isReserve = await roomUtility.checkReserveOverlap(roomNum, sitNum);
  } catch (error) {
    console.error(error);
    return apiResponse.notFoundResponse(res, error.message);
  }

  try {
    userObjectId = await userUtility.checkUserExists(userId);
  } catch (error) {
    console.error(error);
    return apiResponse.notFoundResponse(
      res,
      `${userId}님은 존재하지 않습니다.`,
    );
  }

  try {
    isUserHaveReserve = await roomUtility.checkThisUserHaveAnotherReserve(
      roomNum,
      userObjectId,
    );
  } catch (error) {
    console.error(error);
    return apiResponse.notFoundResponse(res, error.message);
  }

  if (isReserve)
    return apiResponse.notFoundResponse(
      res,
      `${sitNum}번 좌석은 이미 예약된 좌석 입니다.`,
    );
  if (isUserHaveReserve)
    return apiResponse.notFoundResponse(
      res,
      `${userId}님은 이미 예약한 상태입니다.`,
    );

  // * MaxSit와 비교 합니다.
  const { maxSit } = await roomModel.findOne({ roomNum }, 'maxSit').exec();
  if (maxSit < sitNum)
    return apiResponse.notFoundResponse(
      res,
      `${sitNum}번은 존재하지 않는 좌석입니다.`,
    );

  try {
    // * 방의 예약 정보를 갱신합니다.
    const updateRoomResult = await roomModel
      .updateOne(
        { roomNum },
        { $addToSet: { reservedData: [{ sitNum, user: userObjectId }] } },
        { runValidators: true, context: 'query' },
      )
      .exec();
    if (updateRoomResult.nModified === 0)
      return apiResponse.notFoundResponse(
        res,
        `${roomNum}가 존재하지 않아 예약에 실패 했습니다.`,
      );

    // * 유저의 예약 정보를 갱신합니다.
    const updateUserResult = await userModel.findByIdAndUpdate(
      userObjectId,
      {
        $addToSet: { reservedRooms: [{ sitNum, roomNum }] },
      },
      { runValidators: true, context: 'query' },
    );

    return apiResponse.successCreateResponse(res, '예약이 성공 했습니다.');
  } catch (error) {
    return apiResponse.notFoundResponse(res, error);
  }
};

export const deleteReserveRoom = async (req, res) => {
  const {
    body: { userId, sitNum },
    params: { id: roomNum },
  } = req;

  try {
    if (sitNum) {
      const isReserve = await roomModel
        .findOne(
          {
            roomNum,
            'reservedData.sitNum': sitNum,
          },
          {
            reservedData: { $elemMatch: { sitNum } },
          },
        )
        .exec()
        .then(docs => {
          if (docs) return true;
          return false;
        });
      if (isReserve) {
        await roomModel.updateOne(
          { roomNum },
          { $pull: { reservedData: { sitNum } } },
          { runValidators: true, context: 'query' },
        );
        await userModel.updateOne(
          { userId },
          { $pull: { reservedRooms: { roomNum } } },
          { runValidators: true, context: 'query' },
        );
        return apiResponse.successResponse(res, '성공적으로 취소 했습니다.');
      } else {
        return apiResponse.notFoundResponse(
          res,
          `${roomNum} 방의 ${sitNum} 좌석을 예약한 이력이 없습니다.`,
        );
      }
    } else {
      const userObjectId = await userModel
        .findOne({ userId })
        .exec()
        .then(user => user._id)
        .catch(err => {
          throw new Error('유저가 존재하지 않습니다.');
        });
      const isReserve = await roomModel
        .findOne(
          {
            roomNum,
            'reservedData.user': userObjectId,
          },
          {
            reservedData: { $elemMatch: { user: userObjectId } },
          },
        )
        .exec()
        .then(docs => {
          if (docs) return true;
          return false;
        });
      if (isReserve) {
        await roomModel.updateOne(
          { roomNum },
          { $pull: { reservedData: { user: userObjectId } } },
          { runValidators: true, context: 'query' },
        );
        await userModel.updateOne(
          { userId },
          { $pull: { reservedRooms: { roomNum } } },
          { runValidators: true, context: 'query' },
        );
        return apiResponse.successResponse(res, '성공적으로 취소 했습니다.');
      } else {
        return apiResponse.notFoundResponse(
          res,
          `${userId}님은 ${roomNum} 방의 좌석을 예약한 이력이 없습니다.`,
        );
      }
    }
  } catch (error) {
    console.error(error);
    return apiResponse.notFoundResponse(res, error);
  }
};

// * 방 리셋 관련 라우터
export const patchResetDateRoom = async (req, res) => {
  const {
    body: { resetDate: resetDateString, repeatOption },
    params: { id: roomNum },
  } = req;
  console.log(repeatOption);
  try {
    if (resetDateString) {
      const resetDate = new Date(resetDateString);
      await roomModel
        .findOneAndUpdate(
          { roomNum },
          { $set: { resetDate, repeatOption } },
          { runValidators: true, context: 'query' },
        )
        .exec();
      apiResponse.successResponse(
        res,
        `${roomNum}번 방에 ${resetDate.toString()} 리셋 시간 등록 성공`,
      );
    } else {
      await roomModel
        .findOneAndUpdate(
          { roomNum },
          { $unset: { resetDate: '' } },
          { runValidators: true, context: 'query' },
        )
        .exec();
      apiResponse.successResponse(res, `${roomNum} 방의 리셋 시간 삭제됨.`);
    }

    resetAndRegisterNewReset();
    return;
  } catch (error) {
    return apiResponse.parmaNotSatisfyResponse(res, error);
  }
};

export const getTestResetDateRoom = async (req, res) => {
  const {
    params: { id },
  } = req;
  try {
    roomModel
      .findOne({ roomNum: id })
      .exec()
      .then(docs => {
        const { resetDate } = docs;
        return apiResponse.successResponseWithData(res, '방 리셋 정보 얻기', {
          date,
        });
      });
  } catch (error) {
    return apiResponse.notFoundResponse(res, error.message);
  }
};

export const patchAcceptDateRoom = async (req, res) => {
  const {
    body: { acceptDate: acceptDateString },
    params: { id: roomNum },
  } = req;
  try {
    if (acceptDateString) {
      const acceptDate = new Date(acceptDateString);
      await roomModel
        .findOneAndUpdate(
          { roomNum },
          { $set: { acceptDate } },
          { runValidators: true, context: 'query' },
        )
        .exec();
      apiResponse.successResponse(
        res,
        `${roomNum}번 방에 ${acceptDate.toString()} 접수 시작 시간 등록 성공`,
      );
    } else {
      await roomModel
        .findOneAndUpdate(
          { roomNum },
          { $unset: { acceptDate: '' } },
          { runValidators: true, context: 'query' },
        )
        .exec();
      apiResponse.successResponse(
        res,
        `${roomNum} 방의 접수 시작 시간 삭제됨.`,
      );
    }

    return;
  } catch (error) {
    return apiResponse.parmaNotSatisfyResponse(res, error);
  }
};
