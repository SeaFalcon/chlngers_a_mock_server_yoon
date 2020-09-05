const search = require('../controllers/searchController');

module.exports = (app) => {
  app.get('/challengeSearch', search.getChallenges);
}