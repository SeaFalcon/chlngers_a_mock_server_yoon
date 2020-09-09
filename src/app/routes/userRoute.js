const user = require('../controllers/userController');

const jwtMiddleware = require('../../../config/jwtMiddleware');

const { userValidation, loginValidation, updateValidation } = require('../validation/validation');

module.exports = (app) => {
  app.get('/check', jwtMiddleware, user.check);

  // insert
  app.post(
    '/user',
    userValidation.checkInput,
    userValidation.checkEmailDuplicate,
    // userValidation.checkNicknameDuplicate,
    user.join,
  );

  // login
  app.post(
    '/login',
    loginValidation.checkInput,
    loginValidation.checkUser,
    user.login,
  );
  app.post(
    '/login/:snsName',
    loginValidation.sns.accessToken,
    loginValidation.sns.name,
    user.snsLogin,
  );

  // select
  app.get(
    '/user/:id/mypage',
    jwtMiddleware,
    userValidation.checkId,
    user.getUserPage,
  );
  app.get(
    '/mypage',
    jwtMiddleware,
    user.myPage,
  );
  app.get(
    '/user-profile',
    jwtMiddleware,
    user.getProfile,
  );

  // update
  app.patch(
    '/user/introduction',
    jwtMiddleware,
    user.update.introduction,
  );
  app.patch(
    '/user/nickname',
    jwtMiddleware,
    // userValidation.checkNicknameDuplicate,
    user.update.nickname,
  );
  app.patch(
    '/user/password',
    jwtMiddleware,
    updateValidation.password,
    user.update.password,
  );
  app.patch(
    '/user/image',
    jwtMiddleware,
    updateValidation.profileImageUrl,
    user.update.profileImageUrl,
  );

  // delete
  app.delete(
    '/user',
    jwtMiddleware,
    user.delete,
  );
};
