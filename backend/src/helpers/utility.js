import schedule from 'node-schedule';
import roomModel from '../models/Room';
import { nextResetScheduleData } from '../app.js';
import { resetRoomReserve } from '../controllers/roomControllers';

export const timezoneChangeToKR = function (UnchangedDate) {
  const timezoneOffset = new Date().getTimezoneOffset() * 60000;
  const changedDate = new Date(UnchangedDate.getTime() - timezoneOffset);
  return changedDate;
};

export const getNextResetScheduleData = async () => {
  try {
    const arr = await roomModel.find({}, 'roomNum resetDate').exec();
    const arr2 = [];
    for (const room of arr) {
      if (room.resetDate) {
        arr2.push([room.roomNum, new Date(room.resetDate)]);
      }
    }
    arr2.sort((a, b) => {
      return a[1] - b[1];
    });
    // .then(docs => console.log(docs))
    // .catch(err => console.log(err));
    let count = 1;
    let nextResetRoom = [];
    for (let i = 0; i < arr2.length - 1; i++) {
      const isSameTime = arr2[i][1].getTime() == arr2[i + 1][1].getTime();
      if (!isSameTime) break;
      count++;
    }
    for (let i = 0; i < count; i++) {
      nextResetRoom.push(arr2[i][0]);
    }

    let nextResetScheduleData = { date: arr2[0][1], nextResetRoom };
    console.log(nextResetScheduleData);
    return nextResetScheduleData;
  } catch (error) {
    throw new Error('getResetData Failed');
  }
};

export const registerResetRoomScheduleJob = () => {
  const { date, nextResetRoom: roomNumArr } = nextResetScheduleData;
  console.log(`rRRS Func: ${date}`);
  let jobs = schedule.scheduleJob(date, resetAndRegisterNewReset);
  console.log(jobs.name);
};

const resetAndRegisterNewReset = async () => {
  for (const room of nextResetScheduleData.nextResetRoom) {
    await resetRoomReserve(room);
  }

  await setResetData();
  if (nextResetScheduleData.date) {
    console.log('다음 리셋을 등록합니다.');
    registerResetRoomScheduleJob();
  } else {
    console.log('등록된 초기화가 없습니다.');
  }
};

const setResetData = async () => {
  const newData = await getNextResetScheduleData();
  const { date, nextResetRoom } = newData;
  console.log(newData);
  nextResetScheduleData.date = date;
  nextResetScheduleData.nextResetRoom = nextResetRoom;
  console.log(`setResetData Func: ${nextResetScheduleData.date}`);
};

export const testPatchResetDate = async () => {
  const fakeRoomNumArr = (function (n) {
    const arr = [];
    for (let i = 1; i <= n; i++) {
      arr.push(i);
    }
    return arr;
  })(10);

  for (let roomNum of fakeRoomNumArr) {
    roomModel
      .findOneAndUpdate(
        { roomNum },
        { $set: { resetDate: Date.now() + 5000 * roomNum + 5000 } },
      )
      .exec()
      .then(docs => console.log(`${roomNum}에 fake reset 등록`));
  }
};
