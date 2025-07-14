class Manager {
  handleError({ ensure, then }) {
    try {
      if (ensure) {
        if (then) then();
        return true;
      } else return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

module.exports = Manager;
