const apiResponse = {
  // * 200~
  successResponse: (res, message) => {
    const resData = { message };
    return res.status(200).json(resData);
  },
  successResponseWithData: (res, message, data) => {
    const resData = {
      message,
      data,
    };
    return res.status(200).json(resData);
  },
  successCreateResponse: (res, message) => {
    const resData = {
      message,
    };
    return res.status(201).json(resData);
  },

  // * 400~
  parmaNotSatisfyResponse: (res, message) => {
    const error = {
      status: 400,
      message,
    };
    return res.status(400).json(error);
  },

  unauthorizedResponse: (res, message) => {
    const error = {
      status: 401,
      message,
    };
    return res.status(401).json(error);
  },

  notFoundResponse: (res, message) => {
    const error = {
      status: 404,
      message,
    };
    return res.status(404).json(error);
  },
};

export default apiResponse;
