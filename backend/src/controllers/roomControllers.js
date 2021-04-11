import roomModel from '../models/Room';
import userModel from '../models/User';
import apiResponse from '../helpers/apiResponse';
import { resetAndRegisterNewReset } from '../helpers/utility';

const createNewSitData = (
  sitReserveData,
  row,
  column,
  rowBlankLine,
  columnBlankLine,
) => {
  const rowLength = row + rowBlankLine.length;
  const columnLength = column + columnBlankLine.length;
  let sitCount = 1;
  const newSitData = [];
  for (let r = 1; r <= rowLength; r++) {
    for (let c = 1; c <= columnLength; c++) {
      if (rowBlankLine.includes(r) || columnBlankLine.includes(c)) {
        newSitData.push({ sitNum: 0, userId: null });
        continue;
      }
      newSitData.push({
        sitNum: sitCount,
        userId: sitReserveData[sitCount] || 'yet',
      });
      sitCount++;
      continue;
    }
  }
  return newSitData;
};

export const resetRoomReserve = async roomNum => {
  try {
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

//  *  route controller function

export const patchResetDateRoom = async (req, res) => {
  const {
    body: { resetDate: resetDateString, roomNum },
  } = req;
  const resetDate = new Date(resetDateString);

  try {
    roomModel
      .findOneAndUpdate({ roomNum }, { $set: { resetDate } })
      .exec()
      .then(docs => {
        resetAndRegisterNewReset();
        return apiResponse.successResponse(
          res,
          `${roomNum} 방에 ${resetDate.toString()} 리셋 시간 등록 성공`,
        );
      });
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

/**
 * @openapi
 *  /room:
 *    get:
 *      summary: 모든 방의 정보를 조회
 *      tags:
 *      - room
 *      description: 모든 방에 대해 정보를 얻습니다.
 *      produces:
 *      - application/json
 *      parameters:
 *        - in: query
 *          name: category
 *          required: false
 *          schema:
 *            type: integer
 *            description: 카테고리
 *      responses:
 *       200:
 *        description: 모든 방에 대한 정보를 얻었습니다.
 *       401:
 *        description: 방이 존재 하지 않습니다.
 */
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await roomModel.find({}).exec();

    const roomsData = rooms.map(room => {
      const { roomNum } = room;
      const maxSit = room.row * room.column;
      return { roomNum, maxSit };
    });
    return apiResponse.successResponseWithData(res, `모든 방 리스트입니다.`, {
      roomsData,
    });
  } catch (error) {
    console.error(error);
    return apiResponse.notFoundResponse(res, error);
  }
};

/**
 * @openapi
 *  /room/{roomId}:
 *    get:
 *      summary: 방 하나에 대해 상세한 정보를 조회합니다.
 *      tags:
 *      - room
 *      parameters:
 *        - in: path
 *          name: roomId
 *          required: true
 *          schema:
 *            type: integer
 *            description: 조회할 방의 번호 입니다.
 *      responses:
 *       200:
 *        description: 리턴 값입니다.
 *       404:
 *        description: 방이 존재 하지 않습니다.
 */
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

    const sitReserveData = {};
    room.reservedData.forEach(data => {
      sitReserveData[data.sitNum] = data.user.userId;
    });

    const newSitData = createNewSitData(
      sitReserveData,
      room.row,
      room.column,
      room.rowBlankLine,
      room.columnBlankLine,
    );

    const roomData = {
      totalRow: room.totalRow,
      totalColumn: room.totalColumn,
      maxSitIncludeBlank: room.maxSitIncludeBlank,
      resetDate: room.resetDate || '',
      reservedData: newSitData,
    };

    return apiResponse.successResponseWithData(res, `${id} 방의 정보`, {
      roomData,
    });
  } catch (error) {
    console.error(error);
    return apiResponse.notFoundResponse(res, error);
  }
};

/**
 * @openapi
 *  /room/:
 *    get:
 *      summary: 새로운 방을 하나 만듭니다.
 *      tags:
 *      - room
 *      parameters:
 *        - in: path
 *          name: roomId
 *          required: true
 *          schema:
 *            type: integer
 *            description: 조회할 방의 번호 입니다.
 *      requestBody:
 *        description:
 *        content:
 *          application/json:
 *             schema:
 *              type: object
 *              properties:
 *                roomNum:
 *                  type: number
 *                column:
 *                  type: number
 *                row:
 *                  type: number
 *                columnBlankLine:
 *                  type: number
 *                rowBlankLine:
 *                  type: number
 *                resetDate:
 *                  type: number
 *      responses:
 *       201:
 *        description: 성공적으로 방이 만들어졌습니다.
 *       401:
 *        description: 방을 만드는데 실패했습니다.
 */
export const postNewRoom = async (req, res) => {
  const {
    body: { roomNum, column, row, columnBlankLine, rowBlankLine, resetDate },
  } = req;
  try {
    const result = await roomModel.createRoom(
      roomNum,
      column,
      row,
      columnBlankLine,
      rowBlankLine,
      resetDate,
    );
    return apiResponse.successResponse(res, `${roomNum} 방이 만들어 졌습니다.`);
  } catch (error) {
    return apiResponse.parmaNotSatisfyResponse(res, error);
  }
};

export const deleteReserveRoom = async (req, res) => {
  const {
    body: { userId, roomNum, sitNum },
  } = req;

  try {
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
      );
      return apiResponse.successResponse(res, '성공적으로 취소 했습니다.');
    } else {
      return apiResponse.notFoundResponse(
        res,
        `${userId}님은 ${roomNum} 방의 ${sitNum} 좌석을 예약한 이력이 없습니다.`,
      );
    }
  } catch (error) {
    console.error(error);
    return apiResponse.notFoundResponse(res, error);
  }
};

export const postReserveRoom = async (req, res) => {
  const {
    body: { userId, roomNum, sitNum },
  } = req;
  let isReserve;
  let userObjectId;
  let isUserHaveReserve;

  try {
    // todo exist로 유무 판단?
    //  * 1) 현재 좌석이 예약 되었는지 확인합니다.
    isReserve = await roomModel
      .exists({
        roomNum,
        reservedData: { $elemMatch: { sitNum } },
      })
      .then(docs => {
        console.log(docs);
        if (docs) return true;
        return false;
      });
  } catch (error) {
    console.error(error);
    return apiResponse.notFoundResponse(res, error.message);
  }

  try {
    userObjectId = await userModel
      .findOne({ userId })
      .exec()
      .then(user => {
        return user._id;
      });
  } catch (error) {
    console.error(error);
    return apiResponse.notFoundResponse(
      res,
      `${userId}님은 존재하지 않습니다.`,
    );
  }

  try {
    isUserHaveReserve = await roomModel
      .exists({
        roomNum,
        'reservedData.user': userObjectId,
      })
      .then(exist => {
        if (exist) return true;
        return false;
      });
  } catch (error) {
    console.error(error);
    return apiResponse.notFoundResponse(res, error);
  }

  console.log(isReserve, userObjectId, isUserHaveReserve);

  if (isReserve) {
    console.log(isReserve);
    return apiResponse.notFoundResponse(
      res,
      `${sitNum}번 좌석은 이미 예약된 좌석 입니다.`,
    );
  } else if (isUserHaveReserve) {
    return apiResponse.notFoundResponse(
      res,
      `${userId}님은 이미 예약한 상태입니다.`,
    );
  } else {
    try {
      // const userData = await .findOne().where('userId').equals(userId);
      const updateResult = await roomModel
        .updateOne(
          { roomNum },
          { $addToSet: { reservedData: [{ sitNum, user: userObjectId }] } },
        )
        .exec();
      if (updateResult.nModified === 0)
        return apiResponse.notFoundResponse(
          res,
          `${roomNum}가 존재하지 않아 예약에 실패 했습니다.`,
        );
      return apiResponse.successCreateResponse(res, '예약이 성공 했습니다.');
    } catch (error) {
      return apiResponse.notFoundResponse(res, error);
    }
  }
};
