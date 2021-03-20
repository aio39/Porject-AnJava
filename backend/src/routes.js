// Global
const API = '/api';

// Users

const USERS = '/users';
const USERS_DETAIL = '/:id';

// Room
const ROOMS = '/rooms';
const ROOM_ONE = '/:id';
const RESERVE_ROOM = '/:id/reserve';
const CANCEL_ROOM = '/:id/reserve';
const CANCEL_ALL_ROOMS = '/all/cancel';

const routes = {
  users: USERS,
};

export default routes;
