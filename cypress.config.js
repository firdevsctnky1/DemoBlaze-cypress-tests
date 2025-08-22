const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://www.demoblaze.com',
    defaultCommandTimeout: 8000,
    viewportWidth: 1280,
    viewportHeight: 800,
    video: true,
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
