import schedule from 'node-schedule';
import roomModel from '../models/Room';
import { nextResetScheduleData } from '../app.js';
import { resetRoomReserve } from '../controllers/roomControllers';
import 'dayjs/locale/ko';
import dayjs from 'dayjs';
import dotenv from 'dotenv';
// todo resetRoomReserve 성공 실패 핸들링
// * todo mongo에서 reset date를 가진 방만 받을 수 있지 않나 ?
// todo mongo sort 사용 가능 ?

export const getNextResetScheduleData = async () => {
  try {
    const allRoomArr = await roomModel.find({}, 'roomNum resetDate').exec();
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
    console.info(`getNextResetScheduleData =>
  새로 만들어진 리셋 스케쥴 데이터 : ${JSON.stringify(
    nextResetScheduleData,
    null,
    2,
  )}`);
    return nextResetScheduleData;
  } catch (error) {
    throw new Error('getResetData Failed');
  }
};

let jobs;

export const registerResetRoomScheduleJob = () => {
  const { date, nextResetRoom } = nextResetScheduleData;
  console.info(
    `registerResetRoomScheduleJob => 
    초기화 될 날짜${dayjs(date)
      .locale('ko')
      .format('YYYY년 MM월 DD일 ddd요일 - HH:mm:s Z')}, 
     다음에 초기화 될 방 : ${nextResetRoom}`,
  );
  if (date < Date.now()) {
    console.info(`reset 시간이 현재보다 빠릅니다.
    reset date: ${date}
    now date: ${Date.now()}
    reset하고  다시 한번 리셋을 등록합니다.`);
    resetAndRegisterNewReset();
  } else {
    if (jobs != undefined) jobs.cancel();
    jobs = schedule.scheduleJob(date, resetAndRegisterNewReset);
    console.info(`Jobs에 등록된 시간 :  ${jobs.name}`);
  }
};

export const resetAndRegisterNewReset = async () => {
  if (
    nextResetScheduleData.date < Date.now() &&
    nextResetScheduleData.nextResetRoom.length > 0
  ) {
    console.info('리셋 시간이 지난 방들을 리셋합니다.');
    for (const room of nextResetScheduleData.nextResetRoom) {
      await resetRoomReserve(room);
    }
  }
  const isHaveNextReset = await setResetData();
  console.info(`다음에 등록할 리셋이 있습니까? ${isHaveNextReset}`);
  if (isHaveNextReset) {
    console.info('다음 리셋을 등록합니다.');
    registerResetRoomScheduleJob();
  } else {
    console.info('등록할 리셋이 없습니다.');
  }
};

const setResetData = async () => {
  const newData = await getNextResetScheduleData();
  if (!newData) return false;
  const { date, nextResetRoom } = newData;
  nextResetScheduleData.date = date;
  nextResetScheduleData.nextResetRoom = nextResetRoom;
  console.info(
    `setResetData: 다음 리셋 날짜 ${dayjs(nextResetScheduleData.date)
      .locale('ko')
      .format('YYYY년 MM월 DD일 ddd요일 - HH:mm:s Z')}`,
  );
  return true;
};

// * test용 dev모드일때만 fake reset data를 넣어줌
export const testPatchResetDate = async () => {
  dotenv.config();
  const fakeRoomNumArr = (function (n) {
    const arr = [];
    for (let i = 1; i <= n; i++) {
      arr.push(i);
    }
    return arr;
  })(process.env.testPatchResetDateCount);
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
