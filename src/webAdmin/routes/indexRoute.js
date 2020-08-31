const index = require('../controllers/indexController');

module.exports = (app) => {
  app.get('/webAdmin', index.default);
};
