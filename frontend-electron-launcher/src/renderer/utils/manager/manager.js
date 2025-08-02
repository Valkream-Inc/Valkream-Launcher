/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

class Manager {
  async handleError({ ensure, then = async () => {} }) {
    try {
      if (ensure) {
        const result = await then();
        return result || true;
      } else return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

module.exports = Manager;
