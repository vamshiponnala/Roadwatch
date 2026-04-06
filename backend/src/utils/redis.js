const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: "https://musical-lobster-77820.upstash.io",
  token: "gQAAAAAAAS_8AAIncDI0MTA1MWZmOTAzMjk0ODk3YThlMzc4YmFkZmJhNzVjM3AyNzc4MjA",
});

module.exports = redis;