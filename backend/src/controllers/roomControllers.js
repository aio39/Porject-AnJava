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

export const getOneRoom = (req, res) => {};

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
  const userData = await userModel
    .findOne()
    .where('userId')
    .equals(userId)
    .select('userId _id');
  console.log(userData._id);
  const reserveData = {};
  const update = await roomModel.findOneAndUpdate(
    { roomNum },
    { $push: { reserveData: sitNum } },
    { new: true },
    (err, desc) => {
      return desc;
    },
  );
  console.log(update);
  //   roomModel.update(
  //     { roomNum },
  //     { reservedData: { sitNum, user: userData['_id'] } },
  //   );
};
