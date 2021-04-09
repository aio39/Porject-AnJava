import userModel from '../models/User';
import jwt from '../helpers/jwt';

export const postLogin = async (req, res) => {
  const {
    body: { userId, password },
  } = req;
  const user = { userId, password };
  if (await userModel.checkPassword(userId, password)) {
    const token = await jwt.sign(user);
    res.status(200).json({ token, userId });
  }
  res.status(403).json({ error: 'password or username wrong' });
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
