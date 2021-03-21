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
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
});

const roomModel = mongoose.model('Room', RoomSchema);

export default roomModel;
