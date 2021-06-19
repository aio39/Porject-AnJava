// Global

// Users
const USERS = '/users';
const USER_SIGN = '/sign';
const USER = '/:id';

// Room
const ROOM = '/room';
const ROOM_ONE = '/:id';
const RESERVE_ROOM = '/:id/reserve';
const CANCEL_ROOM = '/:id/cancel';
const CANCEL_ALL_ROOMS = '/all/cancel';
const RESETDATE_ROOM = '/:id/reset';
const ACCEPTDATE_ROOM = '/:id/accept';

const routes = {
  users: USERS,
  userSign: USER_SIGN,
  user: USER,
  room: ROOM,
  roomOne: ROOM_ONE,
  reserveRoom: RESERVE_ROOM,
  cancelRoom: CANCEL_ROOM,
  cancelAllRooms: CANCEL_ALL_ROOMS,
  resetDateRoom: RESETDATE_ROOM,
  acceptDateRoom: ACCEPTDATE_ROOM,
};

export default routes;
