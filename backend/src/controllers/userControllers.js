import userModel from '../models/User';

export const postLogin = async (req, res) => {
  const {
    body: { userId, password },
  } = req;
  res.send(await userModel.checkPassword(userId, password));
};

export const postSign = async (req, res) => {
  const {
    body: { userId, name, password, email, yjuNum },
  } = req;
  const result = await userModel.createAccount(
    userId,
    name,
    password,
    email,
    yjuNum,
  );
  if (result.signSuccess) {
    res.send({ isSuccess: true, errorMsg: result.errorMsg });
  } else {
    res.send({ isSuccess: false, errorMsg: result.errorMsg });
  }
};
