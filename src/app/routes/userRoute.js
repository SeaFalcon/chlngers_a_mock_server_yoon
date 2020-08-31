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
    userValidation.checkNicknameDuplicate,
    user.join,
  );

  // login
  app.post(
    '/login',
    loginValidation.checkInput,
    loginValidation.checkUser,
    user.login,
  );

  // select
  app.get(
    '/user/:id',
    jwtMiddleware,
    user.get,
  );

  // update
  app.patch(
    '/user/:id/introduction',
    jwtMiddleware,
    user.update.introduction,
  );
  app.patch(
    '/user/:id/nickname',
    jwtMiddleware,
    userValidation.checkNicknameDuplicate,
    user.update.nickname,
  );
  app.patch(
    '/user/:id/password',
    jwtMiddleware,
    updateValidation.password,
    user.update.password,
  );
  app.patch(
    '/user/:id/profileImageUrl',
    jwtMiddleware,
    user.update.profileImageUrl,
  );

  // delete
  app.delete(
    '/user/:id',
    jwtMiddleware,
    user.delete,
  );
};
