class ErrorHandler {
  Async = (func) => (req, res, next) => {
    Promise.resolve(func(req, res, next)).catch(next);
  };
}

module.exports = new ErrorHandler();
