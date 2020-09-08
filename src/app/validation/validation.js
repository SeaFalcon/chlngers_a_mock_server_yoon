const { checkSchema, body, param } = require('express-validator');

const crypto = require('crypto');

const { requestNonTransactionQuery } = require('../../../config/database');

const queries = require('../utils/queries');

const { snsInfo } = require('../utils/function');

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
        const { result: user } = await requestNonTransactionQuery(queries.join.findUserByEmail, [email]);

        if (user.length) {
          return Promise.reject({ code: 305, message: 'E-mail already in use' });
        }
        return {};
      }),
    checkNicknameDuplicate: body('nickname')
      .custom(async (nickname) => {
        const { result: user } = await requestNonTransactionQuery(queries.join.findUserByNickname, [nickname]);

        if (user.length) {
          return Promise.reject({ code: 306, message: 'Nickname already in use' });
        }
        return {};
      }),
    checkId: param('id').custom(async (userId) => {
      const { result: user } = await requestNonTransactionQuery(queries.user.isExistUser, [userId]);

      if (user.length < 1) {
        return Promise.reject({ code: 316, message: 'user is not exist' });
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
        const { result: user } = await requestNonTransactionQuery(queries.login.findUserInfoByEmail, [email]);

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
    sns: {
      accessToken: body('accessToken')
        .notEmpty()
        .withMessage({ code: 310, message: 'This accessToken format is not valid.' }),
      name: param('snsName').custom(snsName => {
        if (!snsInfo[snsName]) {
          return Promise.reject({ code: 315, message: 'SNS Name Incorrect' });
        }
        return {}
      }),
    }
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
  challengeValidation: {
    check: {
      id: param('challengeId').custom(async (challengeId) => {
        const { result: challenge } = await requestNonTransactionQuery(queries.challenge.isExistChallenge, [challengeId]);

        if (challenge.length < 1) {
          return Promise.reject({ code: 317, message: 'challenge is not exist' });
        }
        return {};
      }),
      subjectId: param('subjectId').custom(async (subjectId) => {
        const { result: subject } = await requestNonTransactionQuery(queries.challenge.isExistSubject, [subjectId]);

        if (subject.length < 1) {
          return Promise.reject({ code: 317, message: 'subject is not exist' });
        }
        return {};
      }),
    },
    participate: body('money')
      .notEmpty()
      .withMessage({ code: 318, message: 'money value is empty' }),
    },
    certificate: body('photoUrl')
      .isURL()
      .withMessage({ code: 319, message: 'photoUrl is not Valid' }),
};
