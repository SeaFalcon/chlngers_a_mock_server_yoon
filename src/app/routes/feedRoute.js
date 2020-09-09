const feed = require('../controllers/feedController');

const jwtMiddleware = require('../../../config/jwtMiddleware');
const validation = require('../validation/validation');

module.exports = (app) => {
  // 피드 조회
  app.get(
    '/feed',
    jwtMiddleware,
    feed.getFeed,
  );

  // 전체 챌린지 더보기
  app.get(
    '/feed/all-challenge',
    jwtMiddleware,
    validation.feed.validPage,
    feed.getMoreAllChallenges,
  );

  // 팔로우 챌린지 더보기
  app.get(
    '/feed/follow-challenge',
    jwtMiddleware,
    validation.feed.validPage,
    feed.getMoreFollowChallenges,
  );
};
