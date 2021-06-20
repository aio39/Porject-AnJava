import roomModel from '../models/Room';
import dayjs from 'dayjs';

const roomUtility = {
  checkReserveOverlap: async (roomNum, sitNum) => {
    return await roomModel
      .exists({
        roomNum,
        reservedData: { $elemMatch: { sitNum } },
      })
      .then(docs => {
        if (docs) return true;
        return false;
      });
  },
  checkThisUserHaveAnotherReserve: async (roomNum, userObjectId) => {
    return await roomModel
      .exists({
        roomNum,
        'reservedData.user': userObjectId,
      })
      .then(exist => {
        if (exist) return true;
        return false;
      });
  },
  checkIsRoomStartAccept: async roomNum => {
    return await roomModel.findOne({ roomNum }, 'acceptDate').then(docs => {
      if (new Date(docs.acceptDate || 0) < Date.now()) return true;
      return false;
    });
  },
  generateShuffledNumber: (maxSit, userLength) => {
    const resultArr = [];
    const basicArr = Array.from(Array(maxSit)).map((e, i) => i + 1);
    for (let index = 0; index < userLength; index++) {
      resultArr.push(basicArr.splice(Math.random() * basicArr.length, 1)[0]);
    }
    return resultArr;
  },
  getDeferredAcceptDate: (resetDate, defferMinute) => {
    return dayjs(resetDate).add(defferMinute, 'minute');
  },
};

export default roomUtility;
