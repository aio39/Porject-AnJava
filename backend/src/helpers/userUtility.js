import userModel from '../models/User';

const userUtility = {
  checkUserExists: async userId => {
    return await userModel
      .findOne({ userId })
      .exec()
      .then(user => {
        return user._id;
      });
  },
};

export default userUtility;
