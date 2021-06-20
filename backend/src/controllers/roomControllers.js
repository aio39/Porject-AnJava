import roomModel from '../models/Room';
import userModel from '../models/User';
import apiResponse from '../helpers/apiResponse';
import { resetAndRegisterNewReset } from '../helpers/utility';
import roomUtility from '../helpers/roomUtility';
import userUtility from '../helpers/userUtility';
import dayjs from 'dayjs';
import { forbiddenObjectId } from '../db';
// * function
export const resetRoomReserve = async (
  roomNum,
  isPatch = false,
  isFromShuffle = false,
) => {
  try {
    let foundRoom = await roomModel.findOne({ roomNum }).exec();
    if (!isFromShuffle && foundRoom.isShuffle === true)
      return await shuffleRoom(roomNum, true);
    await resetUsersRoomReserve(roomNum);
    foundRoom = await roomModel.findOne({ roomNum }).exec();
    // foundRoom.reservedData = foundRoom.reservedData.filter(r => {
    //   if (r._user == forbiddenObjectId) return true;
    //   return false;
    // });

    // isPatch가 true일 경우에는 리셋 날짜가 되어서 실행되는 것이 아닌
    // row, col 변경으로 예약 정보만 초기화 후 방의 리셋 정보는 보존된다.
    if (!isPatch) {
      if (foundRoom.openDeffer) {
        foundRoom.acceptDate = roomUtility.getDeferredAcceptDate(
          foundRoom.resetDate,
          foundRoom.openDeffer,
        );
      } else {
        foundRoom.acceptDate = undefined;
      }
      if (!foundRoom.isShuffle) {
        foundRoom.reservedData = [];
      }
      if ([0, 1].includes(foundRoom.measure)) {
        // if (foundRoom.openDeffer) {
        //   foundRoom.acceptDate = roomUtility.getDeferredAcceptDate(foundRoom.resetDate,foundRoom.openDeffer)
        // } else {
        //   foundRoom.acceptDate = undefined;
        // }
        if (foundRoom.measure === 0) {
          foundRoom.resetDate = dayjs(foundRoom.resetDate).add(
            foundRoom.weekendInterval,
            'week',
          );
        }
        if (foundRoom.measure === 1) {
          const correctionValue =
            dayjs(foundRoom.resetDate).add(1, 'month').date(1).get('day') >
            foundRoom.day;

          const addWeek = correctionValue
            ? foundRoom.weekNth
            : foundRoom.weekNth - 1;
          foundRoom.resetDate = dayjs(foundRoom.resetDate)
            .add(1, 'month')
            .date(1)
            .day(foundRoom.day)
            .add(addWeek, 'week')
            .toISOString();
        }
        foundRoom.acceptDateAfterReset = undefined;
        console.info(
          `resetRoomReserve - 방 ${roomNum}의 주기적 다음 리셋 날짜를 등록함. 방법: ${foundRoom.measure}`,
        );
      } else {
        //  measure이 등록 되어 있지 않을 경우
        foundRoom.resetDate = undefined;
        // foundRoom.acceptDate = foundRoom.acceptDateAfterReset;
        // foundRoom.acceptDateAfterReset = undefined;
      }
    } else {
      //  isPatch가 true라면 방의 resetDate 설정은 변화가 없어야하지만
      //  resetDate가 이미 지났다면 resetDate를 최신화한다.
      if (foundRoom.resetDate < Date.now()) {
        foundRoom.resetDate = undefined;
        // foundRoom.acceptDate = foundRoom.acceptDateAfterReset;
        // foundRoom.acceptDateAfterReset = undefined;
        if (foundRoom.openDeffer) {
          foundRoom.acceptDate = roomUtility.getDeferredAcceptDate(
            foundRoom.resetDate,
            foundRoom.openDeffer,
          );
        } else {
          foundRoom.acceptDate = undefined;
        }
      }
    }

    await foundRoom.save();
    console.info(`resetRoomReserve - 방 ${roomNum} 리셋됨`);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const resetUsersRoomReserve = async roomNum => {
  try {
    const { reservedData } = await roomModel
      .findOne({ roomNum }, 'reservedData')
      .populate('reservedData.user', 'userId')
      .exec();

    if (reservedData.length > 0) {
      await Promise.all(
        reservedData.map(a => {
          return userModel
            .updateOne(
              { _id: a.user._id },
              { $pull: { reservedRooms: { roomNum: parseInt(roomNum) } } },
            )
            .exec();
        }),
      );
    }
    console.info(
      `resetUsersRoomReserve => 방 ${roomNum} 관련 유저들의 예약을 전부 삭제함.`,
    );
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const changeUsersRoomReserveRoomNumber = async (
  oldRoomNum,
  newRoomNum,
) => {
  try {
    const { reservedData } = await roomModel
      .findOne({ roomNum: oldRoomNum }, 'reservedData')
      .populate('reservedData.user', 'userId')
      .exec();

    if (reservedData.length > 0) {
      await Promise.all(
        reservedData.map(a => {
          return userModel
            .updateOne(
              { _id: a.user._id, 'reservedRooms.roomNum': oldRoomNum },
              { $set: { reservedRooms: { roomNum: newRoomNum } } },
            )
            .exec();
        }),
      );
    }
    console.info(
      `changeUsersRoomReserveRoomNumber => 유저들의 예약 방 번호를 ${oldRoomNum}에서 ${newRoomNum}로 변경 `,
    );
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const shuffleRoom = async (roomNum, isReset = false) => {
  const userObjectIdArr = [];
  let foundRoom;
  try {
    foundRoom = await roomModel.findOne({ roomNum }).exec();
    foundRoom.reservedData.forEach(r => userObjectIdArr.push(r.user));
    if (isReset) {
      await resetRoomReserve(roomNum, false, true); // Reset 갱신하며 좌석도 초기화
    } else {
      await resetRoomReserve(roomNum, true, true); // Reset데이터는 수정하지  않고 좌석 정보만 초기화
    }
    foundRoom = await roomModel.findOne({ roomNum }).exec();
  } catch (error) {
    return false;
  }

  const randomNumberArr = roomUtility.generateShuffledNumber(
    foundRoom.maxSit,
    userObjectIdArr.length,
  );

  try {
    Promise.all(
      userObjectIdArr.map((userObjectId, index) => {
        foundRoom.reservedData[index] = {
          user: userObjectId,
          sitNum: randomNumberArr[index],
        };
        return userModel
          .findByIdAndUpdate(
            userObjectId,
            {
              $addToSet: {
                reservedRooms: [{ sitNum: randomNumberArr[index], roomNum }],
              },
            },
            { runValidators: true, context: 'query' },
          )
          .exec();
      }),
    );
    foundRoom.save();
    console.info(`shuffleRoom => 방 ${roomNum}의 좌석 셔플`);
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
    resetAndRegisterNewReset();
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

    const {
      row,
      column,
      rowBlankLine,
      columnBlankLine,
      resetDate,
      acceptDate,
      maxSit,
      measure,
      weekendInterval,
      weekNth,
      day,
      openDeffer,
      isShuffle,
    } = room;
    const remainSit = maxSit - room.reservedData.length;

    const roomData = {
      row,
      column,
      rowBlankLine,
      columnBlankLine,
      resetDate,
      acceptDate,
      maxSit,
      remainSit,
      reservedData,
      measure,
      weekendInterval,
      weekNth,
      day,
      openDeffer,
      isShuffle,
    };

    return apiResponse.successResponseWithData(res, `${id} 방의 정보`, {
      roomData,
    });
  } catch (error) {
    console.error(error);
    return apiResponse.notFoundResponse(res, error);
  }
};

export const patchRoom = async (req, res) => {
  const {
    params: { id: oldRoomNum },
    body: { column, row, roomNum: newRoomNum },
  } = req;
  const { isAdmin, userId, ...updateData } = req.body;
  try {
    const foundRoom = await roomModel.findOne({ roomNum: oldRoomNum }).exec();
    if (column !== foundRoom.column || row !== foundRoom.row) {
      await resetRoomReserve(oldRoomNum, true);
    } else {
      // colum 또는 row가 수정되었다면 예약이 초기화 되어 아래 함수는 실행될 필요가 없다.
      if (newRoomNum !== oldRoomNum)
        await changeUsersRoomReserveRoomNumber(oldRoomNum, newRoomNum);
    }
    for (let [key, value] of Object.entries(updateData)) {
      console.log(key, value);
      foundRoom[key] = value;
    }
    if (updateData.measure === 0) {
      foundRoom.day = undefined;
      foundRoom.weekNth = undefined;
    }
    if (updateData.measure === 1) {
      foundRoom.weekendInterval = undefined;
    }
    if (updateData.measure === -1) {
      foundRoom.measure = undefined;
      foundRoom.day = undefined;
      foundRoom.weekNth = undefined;
      foundRoom.weekendInterval = undefined;
    }
    await foundRoom.save();
    resetAndRegisterNewReset();
    return apiResponse.successResponseWithData(res, '방 정보 업데이트 성공', {
      foundRoom,
    });
  } catch (error) {
    console.error(error);
    return apiResponse.parmaNotSatisfyResponse(res, error.message);
  }
};

export const deleteRoom = async (req, res) => {
  const {
    params: { id: roomNum },
  } = req;
  try {
    await resetUsersRoomReserve(roomNum);
    await roomModel.findOneAndDelete({ roomNum }).exec();
    resetAndRegisterNewReset();
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

// * 금지 좌석 라우팅
export const patchRoomForbiddenSit = async (req, res) => {
  const {
    body: { sitNum },
    params: { id: roomNum },
  } = req;

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
        { $addToSet: { reservedData: [{ sitNum, user: forbiddenObjectId }] } },
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
      forbiddenObjectId,
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

export const patchRoomShuffle = async (req, res) => {
  const {
    params: { id: roomNum },
  } = req;

  const result = await shuffleRoom(roomNum);
  if (result) {
    return apiResponse.successResponse(res, '좌석을 셔플하였습니다..');
  }
  return apiResponse.unauthorizedResponse(res, '셔플에 실패했습니다..');
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
