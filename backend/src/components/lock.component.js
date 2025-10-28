/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { Mutex } = require("async-mutex");

// Ajout du type 'config' en plus de 'game' et 'launcher'
const criticalMutexes = {
  game: new Mutex(),
  launcher: new Mutex(),
  config: new Mutex(),
};
const serveCounts = {
  game: 0,
  launcher: 0,
  config: 0,
};
const serveWaiters = {
  game: [],
  launcher: [],
  config: [],
};

function getType(type) {
  if (!criticalMutexes[type]) throw new Error("Type de lock inconnu: " + type);
  return type;
}

async function withCriticalSection(type, fn) {
  type = getType(type);
  const release = await criticalMutexes[type].acquire();
  try {
    // Attend que tous les serve soient terminés pour ce type
    while (serveCounts[type] > 0) {
      await new Promise((resolve) => serveWaiters[type].push(resolve));
    }
    return await fn();
  } finally {
    release();
  }
}

async function withServeSection(type, fn) {
  type = getType(type);
  // On attend que le mutex soit disponible, puis on le relâche immédiatement
  const release = await criticalMutexes[type].acquire();
  release();
  serveCounts[type]++;
  try {
    return await fn();
  } finally {
    serveCounts[type]--;
    if (serveCounts[type] === 0 && serveWaiters[type].length > 0) {
      serveWaiters[type].forEach((resolve) => resolve());
      serveWaiters[type] = [];
    }
  }
}

// Middleware imbriquable pour Express
function LockHandler(type, section) {
  // section: 'critical' ou 'serve'
  return (handler) => async (req, res, next) => {
    const wrapper =
      section === "critical" ? withCriticalSection : withServeSection;
    try {
      await wrapper(type, async () => handler(req, res, next));
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { withCriticalSection, withServeSection, LockHandler };
