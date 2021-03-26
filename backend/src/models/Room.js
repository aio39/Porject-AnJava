import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  roomNum: Number,
  column: Number,
  row: Number,
  columnBlankLine: [Number],
  rowBlankLine: [Number],
  maxSit: Number,
  resetDate: Number,
  reservedData: [
    {
      sitNum: Number,
    },
  ],
});

// user: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: 'User',
// },
RoomSchema.statics.checkRoomOverlap = async function (roomNum) {
  const isUnique = await this.findOne({ roomNum }, (err, docs) => {
    if (err) return err;
    return docs;
  });
  if (isUnique == null) return [true, roomNum];
  return [false, roomNum];
};

RoomSchema.statics.createRoom = async function (
  roomNum,
  column,
  row,
  columnBlankLine = [],
  rowBlankLine = [],
  resetDate = null,
) {
  const that = this;

  const isSuccess = await this.checkRoomOverlap(roomNum).then(result => {
    if (result[0] !== true) return [false, '이미 존재합니다.'];
    try {
      that.create({
        roomNum,
        column,
        row,
        columnBlankLine,
        rowBlankLine,
        resetDate,
      });
      return [true, `${roomNum}방이 만들어 졌습니다.`];
    } catch (err) {
      console.log(err);
      return [false, `에러가 발생 했습니다. ${err}`];
    }
  });

  return isSuccess;
};

RoomSchema.methods.checkReserve = sitNum => {
  this.findOne({ reservedData: { sitNum } });
};

const roomModel = mongoose.model('Room', RoomSchema);

export default roomModel;
