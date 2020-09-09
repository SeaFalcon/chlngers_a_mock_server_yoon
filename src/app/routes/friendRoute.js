const friend = require('../controllers/friendController');

const jwtMiddleware = require('../../../config/jwtMiddleware');

const validation = require('../validation/validation');

module.exports = (app) => {
  // 팔로워 페이지
  app.get(
    '/user/:id/follower',
    jwtMiddleware,
    validation.userValidation.checkId,
    friend.getFollower,
  );

  // 팔로잉 페이지
  app.get(
    '/user/:id/following',
    jwtMiddleware,
    validation.userValidation.checkId,
    friend.getFollowing,
  );

  // 팔로우 요청
  app.post(
    '/user/:id/follow',
    jwtMiddleware,
    validation.userValidation.checkId,
    friend.requestFollow,
  );

  // 팔로우 요청 수락
  app.patch(
    '/user/:id/follow/status',
    jwtMiddleware,
    validation.userValidation.checkId,
    friend.acceptFollow,
  );

  // 팔로우 요청 거절 (삭제)
  app.delete(
    '/user/:id/follow',
    jwtMiddleware,
    validation.userValidation.checkId,
    friend.deleteFollow,
  );
};
