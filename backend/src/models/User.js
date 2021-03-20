import mongoose from 'mongoose';
import roomSchema from './Room.';

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    min: 4,
    max: 12,
    unique: true,
    trim: true,
    required: true,
  },
  name: { type: String, min: 2, max: 5, trim: true, required: true },
  password: { type: String, min: 8, trim: true, required: true },
  email: { type: String, trim: true, required: true },
  isAdmin: { type: Boolean, default: false },
  yjuNum: { type: Number, length: 7, unique: true, required: true },
  reservedRooms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
  ],
});

UserSchema.statics.create = function (userId, name, password, email, yjuNum) {
  const newUser = new this({ userId, name, password, email, yjuNum });
  return newUser.save();
};

const model = mongoose.model('User', UserSchema);

export default model;
