// Global

// Users
const USERS = '/users';
const USER_SIGN = '/sign';
const USERS_DETAIL = '/:id';

// Room
const ROOM = '/room';
const ROOM_ONE = '/:id';
const RESERVE_ROOM = '/:id/reserve';
const CANCEL_ROOM = '/:id/cancel';
const CANCEL_ALL_ROOMS = '/all/cancel';

const routes = {
  users: USERS,
  userSign: USER_SIGN,
  userDetail: id => {
    if (id) {
      return `/users/${id}`;
    }
    return USERS_DETAIL;
  },
  room: ROOM,
  roomOne: ROOM_ONE,
  reserveRoom: RESERVE_ROOM,
  cancelRoom: CANCEL_ROOM,
  cancelAllRooms: CANCEL_ALL_ROOMS,
};

export default routes;
