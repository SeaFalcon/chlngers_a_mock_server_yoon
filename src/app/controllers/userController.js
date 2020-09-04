const crypto = require('crypto');

const { validationResult } = require('express-validator');

const request = require('request');

const { logger } = require('../../../config/winston');

const { requestTransactionQuery, requestNonTransactionQuery } = require('../../../config/database');

const { requestQueryResult, makeSuccessResponse, snsInfo, makeLoginResponse } = require('../utils/function');

const queries = require('../utils/queries');

exports.check = async (req, res) => {
  res.json({
    ...makeSuccessResponse('검증 성공'),
    info: req.verifiedToken,
  });
};

exports.join = async (req, res) => {
  const {
    name, email, password, nickname,
  } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const result = errors.errors.map((error) => error.msg);
    return res.status(400).json({ success: false, errors: [...result] });
  }

  const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');

  const result = await requestTransactionQuery(queries.join.insert, [email, hashedPassword, name, nickname]);

  if (result) {
    return res.json({
      ...makeSuccessResponse('회원가입 성공 성공'),
    });
  }

  logger.error(`App - SignUp Query error\n: ${err.message}`);
  return res.status(500).send(`Error: ${err.message}`);
};

exports.login = async (req, res) => {
  const { email } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const result = errors.errors.map((error) => error.msg);
    return res.status(400).json({ success: false, errors: [...result] });
  }

  const { isSuccess, result } = await requestNonTransactionQuery(queries.login.findUserInfoByEmail, [email]);

  if (isSuccess) {
    const response = await makeLoginResponse(result[0]);

    return res.json(response);
  }

  logger.error(`App - SignUp Query error\n: ${userInfoRows.message}`);
  return res.status(500).send(`Error: ${result.message}`);
};

exports.snsLogin = async (req, res) => {
  const { body: { accessToken }, params: { snsName } } = req;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const result = errors.errors.map((error) => error.msg);
    return res.status(400).json({ success: false, errors: [...result] });
  }

  const authOptions = {
    url: snsInfo[snsName].url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: true,
  };

  request.get(authOptions, async (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const {
        password, nickname, email, profileImageUrl,
      } = snsInfo[snsName].getUserInfo(body);

      const { isSuccess, result: findUserResult } = await requestNonTransactionQuery(queries.login.findUserInfoByEmail, [email]);

      if (isSuccess && findUserResult.length) {
        // 이미 가입되어있음 -> 로그인 처리
        const loginResponse = await makeLoginResponse(findUserResult[0]);

        return res.json(loginResponse);
      } else if (isSuccess && findUserResult.length < 1) {
        // 첫 로그인 -> 가입 후 로그인 처리
        const { isSuccess, result: joinResult } = await requestTransactionQuery(queries.join.insertSNS, [email, hashedPassword, nickname, nickname, profileImageUrl, password]);

        if (isSuccess) {
          const { insertId } = joinResult[0];

          const loginResponse = await makeLoginResponse({ userId: insertId, nickname, email, profileImageUrl, introduction: '', phoneNumber: '', isDeleted: 'N', });

          return res.json(loginResponse);
        }

        logger.error(`App - SignUp Query error\n: ${result}`);
        return res.status(500).send(`Error: ${joinResult.message}`);
      }
      
      logger.error(`App - SignUp Query error\n: ${result.message}`);
      return res.status(500).send(`Error: ${findUserResult.message}`);
    } else {
      return res.json(snsInfo[snsName].errorCode);
    }
  });
};

exports.getUserPage = async (req, res) => {
  const connection = await singletonDBConnection.getInstance();
  if (typeof connection !== 'object') {
    return res.status(500).send(`Error: ${connection}`);
  }

  const { params: { id: userId }, verifiedToken } = req;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const result = errors.errors.map((error) => error.msg);
    return res.status(400).json({ success: false, errors: [...result] });
  }

  try {
    const userInfoRows = await requestQueryResult(connection, queries.mypage.user, [userId]);
    const followers = await requestQueryResult(connection, queries.mypage.follower, [userId]);
    const followings = await requestQueryResult(connection, queries.mypage.following, [userId]);
    const interestFields = await requestQueryResult(connection, queries.mypage.interestField, [userId]);
    const everydayRecords = await requestQueryResult(connection, queries.mypage.everydayRecord, [userId]);
    const todayChallenges = await requestQueryResult(connection, queries.mypage.todayChallenge, [userId]);

    const ex = await requestNonTransactionQuery(queries.mypage.user, [userId]);

    console.log(ex);

    const myPageInfo = {
      ...userInfoRows[0],
      followerCount: followers.length,
      followingCount: followings.length,
      interestFields: interestFields.map((field) => field.tagName),
      everydayRecords: everydayRecords.map((record) => record.record),
      todayChallenges,
    };

    res.json({
      myPageInfo,
      ...makeSuccessResponse('마이페이지 조회 성공'),
    });
    return connection.release();
  } catch (err) {
    logger.error(`App - SignIn Query error\n: ${JSON.stringify(err)}`);
    connection.release();
    return false;
  }
};

exports.update = {
  nickname: async (req, res) => {
    const { verifiedToken: { id: userId }, body: { nickname } } = req;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const result = errors.errors.map((error) => error.msg);
      return res.status(400).json({ success: false, errors: [...result] });
    }

    const { isSuccess, result } = await requestTransactionQuery(queries.update.user.nickname, [nickname, userId]);

    if (isSuccess) {
      return res.json({
        ...makeSuccessResponse('닉네임 수정 성공'),
      });
    }

    logger.error(`App - SignUp Query error\n: ${result.message}`);
    return res.status(500).send(`Error: ${result.message}`);
  },
  introduction: async (req, res) => {
    const { verifiedToken: { id: userId }, body: { introduction } } = req;

    const { isSuccess, result } = await requestTransactionQuery(queries.update.user.introduction, [introduction, userId]);

    if (isSuccess) {
      return res.json({
        ...makeSuccessResponse('소개 수정 성공'),
      });
    }

    logger.error(`App - SignUp Query error\n: ${result.message}`);
    return res.status(500).send(`Error: ${result.message}`);
  },
  profileImageUrl: async (req, res) => {
    const { verifiedToken: { id: userId }, body: { profileImageUrl } } = req;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const result = errors.errors.map((error) => error.msg);
      return res.status(400).json({ success: false, errors: [...result] });
    }

    const { isSuccess, result } = await requestTransactionQuery(queries.update.user.profileImageUrl, [profileImageUrl, userId]);

    if (isSuccess) {
      return res.json({
        ...makeSuccessResponse('프로필 이미지 수정 성공'),
      });
    }

    logger.error(`App - SignUp Query error\n: ${result.message}`);
    return res.status(500).send(`Error: ${result.message}`);
  },
  password: async (req, res) => {
    const { verifiedToken: { id: userId }, body: { password } } = req;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const result = errors.errors.map((error) => error.msg);
      return res.status(400).json({ success: false, errors: [...result] });
    }

    const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');

    const { isSuccess, result } = await requestTransactionQuery(queries.update.user.password, [hashedPassword, userId]);

    if (isSuccess) {
      return res.json({
        ...makeSuccessResponse('비밀번호 수정 성공'),
      });
    }

    logger.error(`App - SignUp Query error\n: ${result.message}`);
    return res.status(500).send(`Error: ${result.message}`);
  },
};

exports.delete = async (req, res) => {
  const { verifiedToken: { id: userId } } = req;

  const { isSuccess, result } = await requestTransactionQuery(queries.delete.user, ['Y', userId]);

  if (isSuccess) {
    return res.json({
      ...makeSuccessResponse('탈퇴 성공'),
    });
  }

  logger.error(`App - SignUp Query error\n: ${result.message}`);
  return res.status(500).send(`Error: ${result.message}`);
};
