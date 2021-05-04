import schedule from 'node-schedule';
import roomModel from '../models/Room';
import { nextResetScheduleData } from '../app.js';
import { resetRoomReserve } from '../controllers/roomControllers';

// todo resetRoomReserve 성공 실패 핸들링

export const getNextResetScheduleData = async () => {
  try {
    const allRoomArr = await roomModel.find({}, 'roomNum resetDate').exec();
    // * todo mongo에서 reset date를 가진 방만 받을 수 있지 않나 ?
    const restructuredRoomArr = [];
    for (const room of allRoomArr) {
      if (room.resetDate) {
        const resetDate = new Date(room.resetDate);
        if (resetDate <= Date.now()) {
          resetRoomReserve(room.roomNum);
        } else {
          restructuredRoomArr.push([room.roomNum, resetDate]);
        }
      }
    }

    if (restructuredRoomArr.length === 0) return false;
    if (restructuredRoomArr.length === 1)
      return {
        nextResetRoom: [restructuredRoomArr[0][0]],
        date: restructuredRoomArr[0][1],
      };

    // todo mongo sort 사용 가능 ?
    restructuredRoomArr.sort((a, b) => {
      return a[1] - b[1];
    });

    // * 시간 순으로 정렬하고 나서 가장 빠른 리셋이면서 같은 시간을 가진 방을 구하기
    let countSameDateRoom = 1;
    let nextResetRoom = [];
    for (let i = 0; i < restructuredRoomArr.length - 1; i++) {
      const isSameTime =
        restructuredRoomArr[i][1].getTime() ==
        restructuredRoomArr[i + 1][1].getTime();
      if (!isSameTime) break;
      countSameDateRoom++;
    }
    // *  리셋이 겹치는 방을 하나의 배열로 묶어주기
    for (let i = 0; i < countSameDateRoom; i++) {
      nextResetRoom.push(restructuredRoomArr[i][0]);
    }
    const resetDate = restructuredRoomArr[0][1];

    let nextResetScheduleData = {
      date: resetDate,
      nextResetRoom,
    };
    console.log(nextResetScheduleData);
    return nextResetScheduleData;
  } catch (error) {
    throw new Error('getResetData Failed');
  }
};

let jobs;

export const registerResetRoomScheduleJob = () => {
  console.log(nextResetScheduleData);
  const { date, nextResetRoom } = nextResetScheduleData;
  console.log(
    `registerResetRoomScheduleJob Func: ${date}, nextResetRoom : ${nextResetRoom}`,
  );
  if (date < Date.now()) {
    console.log(`reset 시간이 현재보다 빠릅니다.
    reset date: ${date}
    noe date: ${Date.now()}
    reset 시간을 다시 등록합니다.`);
    resetAndRegisterNewReset();
  } else {
    if (jobs != undefined) jobs.cancel();
    jobs = schedule.scheduleJob(date, resetAndRegisterNewReset);
    console.log(`jobs time ${jobs.name}`);
  }
};

export const resetAndRegisterNewReset = async () => {
  console.log(nextResetScheduleData < Date.now());
  if (
    nextResetScheduleData < Date.now() &&
    nextResetScheduleData.nextResetRoom.length > 0
  )
    for (const room of nextResetScheduleData.nextResetRoom) {
      await resetRoomReserve(room);
    }

  const isHaveNextReset = await setResetData();
  console.log(`다음에 등록할 리셋이 있습니까? ${isHaveNextReset}`);
  if (isHaveNextReset) {
    console.log('다음 리셋을 등록합니다.');
    registerResetRoomScheduleJob();
  } else {
    console.log('등록된 초기화가 없습니다.');
  }
};

const setResetData = async () => {
  const newData = await getNextResetScheduleData();
  if (!newData) return false;
  const { date, nextResetRoom } = newData;
  // * export로 공유되고 있는 reset data 객체의 정보 갱신.
  nextResetScheduleData.date = date;
  nextResetScheduleData.nextResetRoom = nextResetRoom;
  console.log(`setResetData Func: ${nextResetScheduleData.date}`);
  return true;
};

// * test용 dev모드일때만 fake reset data를 넣어줌
export const testPatchResetDate = async () => {
  const fakeRoomNumArr = (function (n) {
    const arr = [];
    for (let i = 1; i <= n; i++) {
      arr.push(i);
    }
    return arr;
  })(0);
  let count = 0;
  const promiseArr = [];
  for (let roomNum of fakeRoomNumArr) {
    promiseArr[count] = roomModel
      .findOneAndUpdate(
        { roomNum },
        { $set: { resetDate: Date.now() + 7000 * roomNum + 5000 } },
      )
      .exec()
      .then(docs =>
        console.log(`${roomNum}번 방에 fake reset 시간을 등록했습니다.`),
      )
      .catch(err => console.log(err));
    count++;
  }
  console.log('fake reset 등록 후 리셋을 실행');
  if (count > 0) {
    promiseArr[promiseArr.length - 1].then(() => resetAndRegisterNewReset());
  } else {
    resetAndRegisterNewReset();
  }
};
