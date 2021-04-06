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
  // console.log(date, roomNumArr);
  // console.log(roomNumArr instanceof Array);
  schedule.scheduleJob(date, resetAndRegisterNewReset);
};

const resetAndRegisterNewReset = async () => {
  for (const room of nextResetScheduleData.nextResetRoom) {
    await resetRoomReserve(room);
  }
  nextResetScheduleData.date = new Date(Date.now() + 4000);
  console.log(nextResetScheduleData);
  registerResetRoomScheduleJob();
};
