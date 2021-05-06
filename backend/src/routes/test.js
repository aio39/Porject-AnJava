import { Router } from 'express';
import roomModel from '../models/Room';
import userModel from '../models/User';

const testRouter = Router();

const resetRoomReserveOfIncludedUser = async roomNum => {
  try {
    const { reservedData, _id: roomId } = await roomModel
      .findOne({ roomNum }, 'reserveData')
      .populate('reservedData.user', 'userId')
      .exec();

    await Promise.all(
      reservedData.forEach(async a => {
        const result = await userModel
          .updateOne(
            { _id: a.user._id },
            { $pull: { reservedRooms: { _id: roomId } } },
          )
          .exec();
      }),
    );

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

testRouter.get('/:id', (req, res) => {
  resetRoomReserveOfIncludedUser(req.params.id);
});

export default testRouter;
