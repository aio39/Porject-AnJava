import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  roomNum: {
    type: Number,
    min: 1,
    max: 10000,
    unique: true,
    required: true,
  },
  column: { type: Number, min: 1, max: 20, required: true },
  row: { type: Number, min: 1, max: 20, required: true },
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
  acceptDate: {
    type: Date,
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
  measure: {
    type: Number,
    validate: {
      validator: function (v) {
        return [0, 1].includes(v); // 0 - 몇 주 단위로 1 - 매달  첫째주  무슨 요일
      },
    },
  },
  weekendInterval: {
    // for  measure 0
    type: Number, // 1~ 55
  },
  weekNth: {
    // for  measure 1
    type: Number, // 1~4
  },
  day: {
    // for  measure 1
    type: Number, // 0 ~ 6
  },
  openDeffer: {
    type: Number, // 60 * 24 * 7
  },
  isShuffle: {
    type: Boolean,
    default: false,
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
  if (+this.measure === 0) {
    if (!(this.weekendInterval >= 1 && this.weekendInterval <= 55))
      return next(new Error('반복 주 간격은 1에서 55 사이여야합니다.'));
    this.day = undefined;
    this.weekNth = undefined;
  }
  if (+this.measure === 1) {
    if (!(this.weekNth >= 1 && this.weekNth <= 4))
      return next(new Error('매달 몇번째 주의 값은 1에서 4 사이여야합니다.'));
    if (!(this.day >= 1 && this.day <= 55))
      return next(new Error('반복 요일은 일요일 0에서 금요일 6까지 입니다.'));
    this.weekendInterval = undefined;
  }

  if (!this.measure) {
    this.day = undefined;
    this.weekNth = undefined;
    this.weekendInterval = undefined;
  }

  if (this.openDeffer && this.openDeffer < 0)
    return next(new Error('openDeffer 오픈 지연 시간은 0분 이상입니다.'));

  //  리셋 날짜, 오픈 날짜 유효성 검사
  if (this.acceptDate && this.resetDate) {
    if (new Date(this.resetDate) < new Date(this.acceptDate))
      return next(
        new Error('acceptDate는 resetDate보다 빠른 날짜 이어야 합니다.'),
      );
  }

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
