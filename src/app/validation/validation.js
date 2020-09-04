const { checkSchema, body } = require('express-validator');

const crypto = require('crypto');

const { singletonDBConnection } = require('../../../config/database');

const { requestQueryResult } = require('../utils/function');
const queries = require('../utils/queries');

module.exports = {
  userValidation: {
    checkInput: checkSchema({
      name: {
        trim: {},
        escape: {},
        notEmpty: { errorMessage: { code: 301, message: 'Name shouldn\'t be empty' } },
      },
      nickname: {
        trim: {},
        escape: {},
        notEmpty: { errorMessage: { code: 302, message: 'NickName shouldn\'t be empty' } },
      },
      email: {
        trim: {},
        escape: {},
        normalizeEmail: {},
        isEmail: { errorMessage: { code: 303, message: 'Please enter the email format correctly.' } },
      },
      password: {
        trim: {},
        escape: {},
        isLength: {
          options: { min: 8 },
          errorMessage: { code: 304, message: 'Password should be at least 8 chars long' },
        },
      },
    }),
    checkEmailDuplicate: body('email')
      .custom(async (email) => {
        const connection = await singletonDBConnection.getInstance();
        
        const user = await requestQueryResult(connection, queries.join.findUserByEmail, [email]);
        // const user = await findUserByEmail(connection, email);

        if (user.length) {
          return Promise.reject({ code: 305, message: 'E-mail already in use' });
        }
        return {};
      }),
    checkNicknameDuplicate: body('nickname')
      .custom(async (nickname) => {
        const connection = await singletonDBConnection.getInstance();
        
        const user = await requestQueryResult(connection, queries.join.findUserByNickname, [nickname]);
        // const user = await findUserByNickname(connection, nickname);

        if (user.length) {
          return Promise.reject({ code: 306, message: 'Nickname already in use' });
        }
        return {};
      }),
  },
  loginValidation: {
    checkInput: checkSchema({
      email: {
        trim: {},
        escape: {},
        normalizeEmail: {},
        isEmail: { errorMessage: { code: 303, message: 'Please enter the email format correctly.' } },
      },
      password: {
        trim: {},
        escape: {},
        isLength: {
          options: { min: 8 },
          errorMessage: { code: 304, message: 'Password should be at least 8 chars long' },
        },
      },
    }),
    checkUser: body('email')
      .custom(async (email, { req: { body: postData } }) => {
        // console.log(email, postData);
        const connection = await singletonDBConnection.getInstance();

        const user = await requestQueryResult(connection, queries.login.findUserInfoByEmail, [email]);
        // const user = await findUserInfoByEmail(connection, email);

        // check email
        if (user.length < 1) {
          return Promise.reject({ code: 307, message: 'There is no user registered with this email.' });
        }

        // check password
        const hashedPassword = await crypto.createHash('sha512').update(postData.password).digest('hex');
        if (user[0].password !== hashedPassword) {
          return Promise.reject({ code: 308, message: 'The password is incorrect.' });
        }

        // check withdrawl
        if (user[0].isDeleted !== 'N') {
          return Promise.reject({ code: 309, message: 'This is a user who has withdrawn from membership.' });
        }

        return {};
      }),
    sns: body('accessToken')
      .notEmpty()
      .withMessage({ code: 310, message: 'This accessToken format is not valid.' }),
  },
  updateValidation: {
    password: checkSchema({
      password: {
        trim: {},
        escape: {},
        isLength: {
          options: { min: 8 },
          errorMessage: { code: 304, message: 'Password should be at least 8 chars long' },
        },
      },
    }),
    profileImageUrl: body('profileImageUrl')
      .isURL({})
      .withMessage({ code: 311, message: 'This url format is not valid.' }),
  },
};
