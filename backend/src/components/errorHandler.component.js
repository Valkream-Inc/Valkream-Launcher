/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

class ErrorHandler {
  Async = (func) => (req, res, next) => {
    Promise.resolve(func(req, res, next)).catch(next);
  };
}

module.exports = new ErrorHandler();
