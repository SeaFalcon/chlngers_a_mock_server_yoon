const jwt = require('jsonwebtoken');

const crypto = require('crypto');

const { validationResult } = require('express-validator');

const request = require('request');

const { logger } = require('../../../config/winston');

const secretConfig = require('../../../config/secret');

const database = require('../../../config/database');

const { requestQueryResult, makeSuccessResponse, snsInfo } = require('../utils/function');

const queries = require('../utils/queries');

exports.check = async (req, res) => {
  res.json({
    ...makeSuccessResponse('검증 성공'),
    info: req.verifiedToken,
  });
};

exports.join = async (req, res) => {
  const connection = await database.singletonDBConnection.getInstance();
  if (typeof connection !== 'object') {
    return res.status(500).send(`Error: ${connection}`);
  }

  const {
    name, email, password, nickname,
  } = req.body;

  const errors = validationResult(req);
  //   console.log(errors.array());

  if (!errors.isEmpty()) {
    const result = errors.errors.map((error) => error.msg);
    return res.status(400).json({ success: false, errors: [...result] });
    // return res.status(400).json({ errors: errors.array() });
  }

  try {
    await connection.beginTransaction(); // START TRANSACTION
    const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');

    const insertUserQuery = `
                INSERT INTO user(email, password, name, nickname)
                VALUES (?, ?, ?, ?);
                    `;
    const insertUserParams = [email, hashedPassword, name, nickname];
    await connection.query(insertUserQuery, insertUserParams);

    await connection.commit(); // COMMIT
    connection.release();
    return res.json({
      ...makeSuccessResponse('회원가입 성공'),
    });
  } catch (err) {
    await connection.rollback(); // ROLLBACK
    connection.release();
    logger.error(`App - SignUp Query error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }
};

exports.login = async (req, res) => {
  const { email } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const result = errors.errors.map((error) => error.msg);
    return res.status(400).json({ success: false, errors: [...result] });
  }

  const userInfoRows = await database.requestNonTransactionQuery(queries.login.findUserInfoByEmail, [email]);

  const userInfo = {
    id: userInfoRows[0].userId,
    email,
    nickname: userInfoRows[0].nickname,
    profileImageUrl: userInfoRows[0].profileImageUrl || '',
    introduction: userInfoRows[0].introduction || '',
    phoneNumber: userInfoRows[0].phoneNumber || '',
    isDeleted: userInfoRows[0].isDeleted,
  };

  // 토큰 생성
  const token = await jwt.sign(userInfo, // 토큰의 내용(payload)
    secretConfig.jwtsecret, // 비밀 키
    {
      expiresIn: '365d', // 유효 시간은 365일
      subject: 'userInfo',
    });

  res.json({
    userInfo,
    jwt: token,
    ...makeSuccessResponse('로그인 성공'),
  });
};

exports.snsLogin = async (req, res) => {
  const connection = await database.singletonDBConnection.getInstance();
  if (typeof connection !== 'object') {
    return res.status(500).send(`Error: ${connection}`);
  }

  const { accessToken } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const result = errors.errors.map((error) => error.msg);
    return res.status(400).json({ success: false, errors: [...result] });
  }

  const { snsName } = req.params;

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

      const userInfoRows = await findUserInfoByEmail(connection, email);

      if (userInfoRows.length) {
        // 이미 가입되어있음 -> 로그인 처리
        try {
          const userInfo = {
            id: userInfoRows[0].id,
            email,
            nickname: userInfoRows[0].nickname,
            profileImageUrl: userInfoRows[0].profileImageUrl || '',
            introduction: userInfoRows[0].introduction || '',
            phoneNumber: userInfoRows[0].phoneNumber || '',
            isDeleted: userInfoRows[0].isDeleted,
          };

          // 토큰 생성
          const token = await jwt.sign(userInfo, // 토큰의 내용(payload)
            secretConfig.jwtsecret, // 비밀 키
            {
              expiresIn: '365d', // 유효 시간은 365일
              subject: 'userInfo',
            });

          res.json({
            userInfo,
            jwt: token,
            ...makeSuccessResponse('로그인 성공'),
          });
          return connection.release();
        } catch (err) {
          logger.error(`App - SignIn Query error\n: ${JSON.stringify(err)}`);
          connection.release();
          return false;
        }
      } else {
        // 첫 로그인 -> 가입 후 로그인 처리
        try {
          await connection.beginTransaction(); // START TRANSACTION

          const hashedPassword = await crypto.createHash('sha512').update(String(password)).digest('hex');

          const insertUserQuery = `
                      INSERT INTO user(email, password, name, nickname, profileImageUrl, ${snsName === 'kakao' ? 'kakaoId' : 'facebookId'})
                      VALUES (?, ?, ?, ?, ?, ?);
                          `;
          const insertUserParams = [email, hashedPassword, nickname, nickname, profileImageUrl, password];
          const result = await connection.query(insertUserQuery, insertUserParams);

          const { insertId } = result[0];

          await connection.commit(); // COMMIT

          const userInfo = {
            id: insertId,
            email,
            nickname,
            profileImageUrl,
            introduction: '',
            phoneNumber: '',
            isDeleted: 'N',
          };

          const token = await jwt.sign(userInfo, // 토큰의 내용(payload)
            secretConfig.jwtsecret, // 비밀 키
            {
              expiresIn: '365d', // 유효 시간은 365일
              subject: 'userInfo',
            });

          res.json({
            userInfo,
            jwt: token,
            ...makeSuccessResponse('회원가입 및 로그인 성공'),
          });

          connection.release();
        } catch (err) {
          await connection.rollback(); // ROLLBACK
          connection.release();
          logger.error(`App - SignUp Query error\n: ${err}`);
          return res.status(500).send(`Error: ${err.message}`);
        }
      }
    } else {
      res.json(snsInfo[snsName].errorCode);
    }
    return {};
  });
};

exports.getUserPage = async (req, res) => {
  const connection = await database.singletonDBConnection.getInstance();
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

    const ex = await database.requestNonTransactionQuery(queries.mypage.user, [userId]);

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


    const result = await database.requestTransactionQuery(queries.update.user.nickname, [nickname, userId]);

    if (result) {
      return res.json({
        ...makeSuccessResponse('닉네임 수정 성공'),
      });
    }

    logger.error(`App - SignUp Query error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  },
  introduction: async (req, res) => {
    const { verifiedToken: { id: userId }, body: { introduction } } = req;

    const result = await database.requestTransactionQuery(queries.update.user.introduction, [introduction, userId]);

    if (result) {
      return res.json({
        ...makeSuccessResponse('소개 수정 성공'),
      });
    }

    logger.error(`App - SignUp Query error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  },
  profileImageUrl: async (req, res) => {
    const connection = await database.singletonDBConnection.getInstance();
    if (typeof connection !== 'object') {
      return res.status(500).send(`Error: ${connection}`);
    }

    const { verifiedToken: { id: userId }, body: { profileImageUrl } } = req;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const result = errors.errors.map((error) => error.msg);
      return res.status(400).json({ success: false, errors: [...result] });
    }

    try {
      await connection.beginTransaction(); // START TRANSACTION

      const updateProfileImageUrlQuery = `
                    UPDATE user
                    SET profileImageUrl=?
                    WHERE userId=?;
                        `;
      const updateProfileImageUrlParams = [profileImageUrl, userId];
      await connection.query(updateProfileImageUrlQuery, updateProfileImageUrlParams);

      await connection.commit(); // COMMIT
      connection.release();
      return res.json({
        ...makeSuccessResponse('프로필 이미지 수정 성공'),
      });
    } catch (err) {
      await connection.rollback(); // ROLLBACK
      connection.release();
      logger.error(`App - SignUp Query error\n: ${err.message}`);
      return res.status(500).send(`Error: ${err.message}`);
    }
  },
  password: async (req, res) => {
    const connection = await database.singletonDBConnection.getInstance();
    if (typeof connection !== 'object') {
      return res.status(500).send(`Error: ${connection}`);
    }

    const { verifiedToken: { id: userId }, body: { password } } = req;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const result = errors.errors.map((error) => error.msg);
      return res.status(400).json({ success: false, errors: [...result] });
    }

    try {
      await connection.beginTransaction(); // START TRANSACTION

      const updatePasswordQuery = `
                    UPDATE user
                    SET password=?
                    WHERE userId=?;
                        `;

      const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');

      const updatePasswordParams = [hashedPassword, userId];
      await connection.query(updatePasswordQuery, updatePasswordParams);

      await connection.commit(); // COMMIT
      connection.release();
      return res.json({
        ...makeSuccessResponse('비밀번호 수정 성공'),
      });
    } catch (err) {
      await connection.rollback(); // ROLLBACK
      connection.release();
      logger.error(`App - SignUp Query error\n: ${err.message}`);
      return res.status(500).send(`Error: ${err.message}`);
    }
  },
};

exports.delete = async (req, res) => {
  const { verifiedToken: { id: userId } } = req;

  const result = await database.requestTransactionQuery(queries.delete.user, ['Y', userId]);

  if (result) {
    return res.json({
      ...makeSuccessResponse('탈퇴 성공'),
    });
  }

  logger.error(`App - SignUp Query error\n: ${err.message}`);
  return res.status(500).send(`Error: ${err.message}`);
};
