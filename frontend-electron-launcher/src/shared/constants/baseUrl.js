/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const dev = process.env.NODE_ENV === "dev";

const baseUrl = dev ? "http://localhost:3000" : "https://play.valkream.com";

module.exports = baseUrl;
