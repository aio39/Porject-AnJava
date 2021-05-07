import roomModel from '../models/Room';

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
};

export default roomUtility;
