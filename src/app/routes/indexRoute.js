const index = require('../controllers/indexController');
const jwtMiddleware = require('../../../config/jwtMiddleware');

module.exports = (app) => {
  app.get('/app', jwtMiddleware, index.default);
};
