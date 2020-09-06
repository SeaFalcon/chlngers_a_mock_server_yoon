const search = require('../controllers/searchController');

const jwtMiddleware = require('../../../config/jwtMiddleware');

module.exports = (app) => {
  app.get('/challengeSearch', jwtMiddleware, search.getChallenges);
};
