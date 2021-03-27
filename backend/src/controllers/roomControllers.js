import roomModel from '../models/Room';
import userModel from '../models/User';

export const getAllRooms = async (req, res) => {
  roomModel.find({}, (err, rooms) => {
    if (err) res.send(err);
    const roomsInfo = rooms.map(room => {
      const { roomNum } = room;
      const maxSit = room.row * room.column;
      return { roomNum, maxSit };
    });
    res.send(roomsInfo);
  });
};

export const getOneRoom = (req, res) => {
  const {
    params: { id },
  } = req;
  roomModel
    .findOne({ roomNum: id })
    .populate('reservedData.user', 'userId')
    .exec((err, room) => {
      if (err) return res.status(400).send(err);
      const sitReserveData = {};
      room.reservedData.forEach(data => {
        sitReserveData[data.sitNum] = data.user.userId;
      });
      const dataJson = {
        row: room.row,
        column: room.column,
        columnBlankLine: room.columnBlankLine || [],
        rowBlankLine: room.rowBlankLine || [],
        maxSit: room.row * room.column,
        resetDate: room.resetDate || '',
        reservedData: sitReserveData,
      };
      return res.send(dataJson);
    });
};

export const postNewRoom = async (req, res) => {
  const {
    body: { roomNum, column, row, columnBlankLine, rowBlankLine, resetDate },
  } = req;
  const result = await roomModel.createRoom(
    roomNum,
    column,
    row,
    columnBlankLine,
    rowBlankLine,
    resetDate,
  );
  res.send(result);
};

export const postReserveRoom = async (req, res) => {
  const {
    body: { userId, roomNum, sitNum },
  } = req;
  const isReserve = await roomModel
    .findOne(
      {
        roomNum,
      },
      {
        reservedData: { $elemMatch: { sitNum } },
      },
    )
    .then(docs => {
      if (docs.reservedData.length > 0) return true;
      return false;
    });
  if (isReserve) {
    res.send({ isSuccess: false, errMsg: '이미 예약된 좌석' });
  } else {
    const userData = await userModel.findOne().where('userId').equals(userId);
    const update = await roomModel.updateOne(
      { roomNum },
      { $push: { reservedData: [{ sitNum, user: userData._id }] } },
      { new: true },
      function (err, model) {
        if (err) {
          res.send({ isSuccess: false, errMsg: '에러가 발생했습니다.' });
          return;
        }
        res.send({ isSuccess: true, errMsg: '' });
      },
    );
  }
};
