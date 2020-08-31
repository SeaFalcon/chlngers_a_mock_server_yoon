const index = require('../controllers/indexController');

module.exports = (app) => {
  app.get('/web', index.default);
};
