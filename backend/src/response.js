function success(data, requestId) {
  return {
    success: true,
    data,
    error: null,
    requestId
  };
}

function failure(code, message, requestId) {
  return {
    success: false,
    data: null,
    error: {
      code,
      message
    },
    requestId
  };
}

module.exports = { success, failure };
