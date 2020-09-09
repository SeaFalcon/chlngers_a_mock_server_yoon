const {
  checkSchema, body, param, query,
} = require('express-validator');

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
    interestField: {
      checkId: param('tagId').custom(async (tagId) => {
        const { result: hashtag } = await requestNonTransactionQuery(queries.challenge.isExistHashTag, [tagId]);

        if (hashtag.length < 1) {
          return Promise.reject({ code: 320, message: 'tagId is not exist' });
        }
        return {};
      }),
      exist: param('tagId').custom(async (tagId, { req: { verifiedToken: { id } } }) => {
        const { result: interestTag } = await requestNonTransactionQuery(queries.user.isExistInterestTag, [id, tagId]);

        if (interestTag.length) {
          return Promise.reject({ code: 321, message: 'already interest field is added' });
        }
        return {};
      }),
      notExist: param('tagId').custom(async (tagId, { req: { verifiedToken: { id } } }) => {
        const { result: interestTag } = await requestNonTransactionQuery(queries.user.isExistInterestTag, [id, tagId]);

        if (interestTag.length < 1) {
          return Promise.reject({ code: 322, message: 'already interest field is removed' });
        }
        return {};
      }),
    },
    interestChallenge: {
      exist: param('challengeId').custom(async (challengeId, { req: { verifiedToken: { id } } }) => {
        const { result: challenge } = await requestNonTransactionQuery(queries.user.isExistInterestChallenge, [id, challengeId]);

        if (challenge.length) {
          return Promise.reject({ code: 323, message: 'already interest challenge is added' });
        }
        return {};
      }),
      notExist: param('challengeId').custom(async (challengeId, { req: { verifiedToken: { id } } }) => {
        const { result: challenge } = await requestNonTransactionQuery(queries.user.isExistInterestChallenge, [id, challengeId]);

        if (challenge.length < 1) {
          return Promise.reject({ code: 324, message: 'already interest challenge is removed' });
        }
        return {};
      }),
    },
    searchEmpty: query('keyword').custom(async (keyword, { req: { verifiedToken: { id } } }) => {
      const { result: users } = await requestNonTransactionQuery(queries.user.search, [id, keyword, keyword]);

      if (users.length < 1) {
        return Promise.reject({ code: 328, message: 'user not found try search another keywords' });
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
      name: param('snsName').custom((snsName) => {
        if (!snsInfo[snsName]) {
          return Promise.reject({ code: 315, message: 'SNS Name Incorrect' });
        }
        return {};
      }),
    },
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
    update: {
      image: body('image')
        .isURL()
        .withMessage({ code: 329, message: 'image url is not Valid' }),
      title: body('title')
        .notEmpty()
        .withMessage({ code: 330, message: 'title is empty' }),
      hashtag: body('hashTag')
        .isArray()
        .withMessage({ code: 331, message: 'hashtag value is not Valid (value should be array)' })
        .custom((hashtag) => {
          if (hashtag && typeof hashtag === 'object') {
            if (!hashtag.length) return Promise.reject({ code: 332, message: 'hashtag array length is 0' });

            let errStatus = false;
            hashtag.forEach((tag) => {
              if (typeof tag !== 'string') errStatus = true;
            });
            if (errStatus) return Promise.reject({ code: 334, message: 'hashtag value must string' });
          }
          return {};
        }),
      examplePhotos: {
        goodPhoto: body('goodPhotoUrl')
          .isURL()
          .withMessage({ code: 335, message: 'good photo value must url format' }),
        badPhoto: body('badPhotoUrl')
          .isURL()
          .withMessage({ code: 336, message: 'bad photo value must url format' }),
      },
      introduction: body('introduction')
        .notEmpty()
        .withMessage({ code: 333, message: 'introduction is empty' }),
    },
  },
  certificate: body('photoUrl')
    .isURL()
    .withMessage({ code: 319, message: 'photoUrl is not Valid' }),
  followValidation: {
    requestExist: param('id').custom(async (userId2, { req: { verifiedToken: { id: userId1 } } }) => {
      const { result: requestFollow } = await requestNonTransactionQuery(queries.friend.isExistRequest, [userId1, userId2]);

      if (requestFollow.length) {
        return Promise.reject({ code: 325, message: 'follow request is exist' });
      }
      return {};
    }),
    requestNotExist: param('id').custom(async (userId2, { req: { verifiedToken: { id: userId1 } } }) => {
      const { result: requestFollow } = await requestNonTransactionQuery(queries.friend.isExistRequest, [userId1, userId2]);

      if (requestFollow.length < 1) {
        return Promise.reject({ code: 326, message: 'follow request is not exist or not friend relationship' });
      }
      return {};
    }),
    alreadyFriend: param('id')
      .custom(async (userId2, { req: { verifiedToken: { id: userId1 } } }) => {
        const { result: friend } = await requestNonTransactionQuery(queries.friend.getStatus, [userId1, userId2, 'Y']);

        if (friend.length) {
          return Promise.reject({ code: 327, message: 'this user is already friend' });
        }
        return {};
      }),
  },
  feed: {
    validPage: query('page')
      .custom((page) => {
        if (Number.isNaN(+page)) return Promise.reject({ code: 328, message: 'page value must be numeric' });
        return {};
      }),
  },
};
