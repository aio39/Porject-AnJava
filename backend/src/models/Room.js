import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  roomNum: {
    type: Number,
    min: 1,
    max: 10000,
    unique: true,
  },
  column: { type: Number, min: 1, max: 20 },
  row: { type: Number, min: 1, max: 20 },
  columnBlankLine: [Number],
  rowBlankLine: [Number],
  maxSit: Number,
  resetDate: {
    type: Date,
    validate: {
      validator: function (v) {
        return new Date(v) > Date.now();
      },
    },
  },
  reservedData: [
    {
      sitNum: Number,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
  repeatOption: {
    measure: {
      type: Number,
      validate: {
        validator: function (v) {
          return [0, 1].includes(v); // 0 - 몇 주 단위로 1 - 매달  첫째주  무슨 요일
        },
      },
    },
    cycle: {
      type: Number,
      validate: {
        validator: function (v) {
          if (!(Math.round(v) === v)) return false;
          // if (this.repeatOption.measure === 0) return v >= 1 && v <= 4;
          // if (this.repeatOption.measure === 1) return v >= 0 && v <= 6;
          return true;
        },
      },
    },
    way: {
      type: Number,
      validate: {
        validator: function (v) {
          return [0, 1, 2].includes(v); //  0 - 완전초기화 1- 랜덤 배치 2- 앞으로 전진
        },
      },
    },
  },
});

RoomSchema.methods.checkReserve = sitNum => {
  this.findOne({ reservedData: [{ sitNum }] }, (err, docs) => {
    if (err) return true;
    return false;
  });
};

RoomSchema.post('save', (error, doc, next) => {
  console.log('save error');
  console.log(error.code);
  if (error.code === 11000) {
    throw new Error('이 번호의 방이 이미 존재합니다.');
  } else {
    next(error);
  }
});

RoomSchema.pre('validate', function (next) {
  // * 블랭크가 실제 라인 수 보다 큰지 체크 합니다.
  if (
    this.rowBlankLine.length != 0 &&
    Math.max(...this.rowBlankLine) > this.row
  ) {
    console.log('error: 콜롬 블랭크 라인이 콜롬 라인보다 큼.');
    return next(new Error('콜롬 블랭크 라인은 콜롬 라인보다 클 수 없습니다.'));
  }
  if (
    this.columnBlankLine.length != 0 &&
    Math.max(...this.columnBlankLine) > this.row
  ) {
    console.log('error: 로우 블랭크 라인이 로우 라인보다 큼.');
    return next(new Error('로우 블랭크 라인은 로우 라인보다 클 수 없습니다.'));
  }
  this.maxSit = this.row * this.column;
  return next();
});

const roomModel = mongoose.model('Room', RoomSchema);

export default roomModel;
