const jwt = require('jsonwebtoken');

const crypto = require('crypto');

const { validationResult } = require('express-validator');

const { logger } = require('../../../config/winston');

const secretConfig = require('../../../config/secret');

const database = require('../../../config/database');

const { findUserInfoByEmail } = require('../utils/function');

/**
 * @swagger
 * /check:
 *  get:
 *    security:
 *      - jwt: []
 *    tags:
 *      - Users
 *    description: Validate JWT token
 *    produces:
 *      - application/json
 *    responses:
 *       200:
 *         description: Authentication check success
 *         schema:
 *           $ref: "#/definitions/Auth_Success"
 */
exports.check = async (req, res) => {
  res.json({
    isSuccess: true,
    code: 200,
    message: '검증 성공',
    info: req.verifiedToken,
  });
};

/**
 * @swagger
 *
 * /user:
 *   post:
 *     description: Join to the application (Create User)
 *     tags:
 *      - Users
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: email
 *         description: User's email to use for login.
 *         in: formData
 *         required: true
 *         type: string
 *       - name: nickname
 *         description: User's nickname.
 *         in: formData
 *         required: true
 *         type: string
 *       - name: name
 *         description: User's name.
 *         in: formData
 *         required: true
 *         type: string
 *       - name: password
 *         description: User's password.
 *         in: formData
 *         required: true
 *         type: string
 *
 *     responses:
 *       200:
 *         description: Join success
 *         schema:
 *           $ref: "#/definitions/Join_Success"
 */
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
                INSERT INTO User(email, password, name, nickname)
                VALUES (?, ?, ?, ?);
                    `;
    const insertUserParams = [email, hashedPassword, name, nickname];
    await connection.query(insertUserQuery, insertUserParams);

    await connection.commit(); // COMMIT
    connection.release();
    return res.json({
      isSuccess: true,
      code: 200,
      message: '회원가입 성공',
    });
  } catch (err) {
    await connection.rollback(); // ROLLBACK
    connection.release();
    logger.error(`App - SignUp Query error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }
};

/**
 * @swagger
 *
 * /login:
 *   post:
 *     description: Log in to the application
 *     tags:
 *       - Users
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: email
 *         description: User's email to use for login.
 *         in: formData
 *         required: true
 *         type: string
 *       - name: password
 *         description: User's password.
 *         in: formData
 *         required: true
 *         type: string
 *
 *     responses:
 *       200:
 *         description: Log in success
 *         schema:
 *           $ref: "#/definitions/Auth_response"
 */
exports.login = async (req, res) => {
  const connection = await database.singletonDBConnection.getInstance();
  if (typeof connection !== 'object') {
    return res.status(500).send(`Error: ${connection}`);
  }

  const { email, password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const result = errors.errors.map((error) => error.msg);
    return res.status(400).json({ success: false, errors: [...result] });
  }

  const userInfoRows = await findUserInfoByEmail(connection, email);

  const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');

  try {
    // 토큰 생성
    const token = await jwt.sign({
      id: userInfoRows[0].id,
      email,
      password: hashedPassword,
      nickname: userInfoRows[0].nickname,
    }, // 토큰의 내용(payload)
    secretConfig.jwtsecret, // 비밀 키
    {
      expiresIn: '365d', // 유효 시간은 365일
      subject: 'userInfo',
    });

    res.json({
      userInfo: userInfoRows[0],
      jwt: token,
      isSuccess: true,
      code: 200,
      message: '로그인 성공',
    });
    return connection.release();
  } catch (err) {
    logger.error(`App - SignIn Query error\n: ${JSON.stringify(err)}`);
    connection.release();
    return false;
  }
};

exports.get = async (req, res) => {
};

exports.update = {
  nickname: async (req, res) => {
    const connection = await database.singletonDBConnection.getInstance();
    if (typeof connection !== 'object') {
      return res.status(500).send(`Error: ${connection}`);
    }

    const token = req.headers['x-access-token'] || req.query.token;

    const { id: userId } = jwt.verify(token, secretConfig.jwtsecret);

    const { nickname } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const result = errors.errors.map((error) => error.msg);
      return res.status(400).json({ success: false, errors: [...result] });
    }

    try {
      await connection.beginTransaction(); // START TRANSACTION

      const updateNicknameQuery = `
                    UPDATE User
                    SET nickname=?
                    WHERE id=?;
                        `;
      const updateNicknameParams = [nickname, userId];
      await connection.query(updateNicknameQuery, updateNicknameParams);

      await connection.commit(); // COMMIT
      connection.release();
      return res.json({
        isSuccess: true,
        code: 200,
        message: '닉네임 수정 성공',
      });
    } catch (err) {
      await connection.rollback(); // ROLLBACK
      connection.release();
      logger.error(`App - SignUp Query error\n: ${err.message}`);
      return res.status(500).send(`Error: ${err.message}`);
    }
  },
  introduction: async (req, res) => {
    const connection = await database.singletonDBConnection.getInstance();
    if (typeof connection !== 'object') {
      return res.status(500).send(`Error: ${connection}`);
    }

    const token = req.headers['x-access-token'] || req.query.token;

    const { id: userId } = jwt.verify(token, secretConfig.jwtsecret);

    const { introduction } = req.body;

    try {
      await connection.beginTransaction(); // START TRANSACTION

      const updateIntroductionQuery = `
                    UPDATE User
                    SET introduction=?
                    WHERE id=?;
                        `;
      const updateIntroductionParams = [introduction, userId];
      await connection.query(updateIntroductionQuery, updateIntroductionParams);

      await connection.commit(); // COMMIT
      connection.release();
      return res.json({
        isSuccess: true,
        code: 200,
        message: '소개 수정 성공',
      });
    } catch (err) {
      await connection.rollback(); // ROLLBACK
      connection.release();
      logger.error(`App - SignUp Query error\n: ${err.message}`);
      return res.status(500).send(`Error: ${err.message}`);
    }
  },
  profileImageUrl: async (req, res) => {
    const connection = await database.singletonDBConnection.getInstance();
    if (typeof connection !== 'object') {
      return res.status(500).send(`Error: ${connection}`);
    }

    const token = req.headers['x-access-token'] || req.query.token;

    const { id: userId } = jwt.verify(token, secretConfig.jwtsecret);

    const { profileImageUrl } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const result = errors.errors.map((error) => error.msg);
      return res.status(400).json({ success: false, errors: [...result] });
    }

    try {
      await connection.beginTransaction(); // START TRANSACTION

      const updateProfileImageUrlQuery = `
                    UPDATE User
                    SET profileImageUrl=?
                    WHERE id=?;
                        `;
      const updateProfileImageUrlParams = [profileImageUrl, userId];
      await connection.query(updateProfileImageUrlQuery, updateProfileImageUrlParams);

      await connection.commit(); // COMMIT
      connection.release();
      return res.json({
        isSuccess: true,
        code: 200,
        message: '프로필 이미지 수정 성공',
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

    const token = req.headers['x-access-token'] || req.query.token;

    const { id: userId } = jwt.verify(token, secretConfig.jwtsecret);

    const { password } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const result = errors.errors.map((error) => error.msg);
      return res.status(400).json({ success: false, errors: [...result] });
    }

    try {
      await connection.beginTransaction(); // START TRANSACTION

      const updatePasswordQuery = `
                    UPDATE User
                    SET password=?
                    WHERE id=?;
                        `;

      const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');

      const updatePasswordParams = [hashedPassword, userId];
      await connection.query(updatePasswordQuery, updatePasswordParams);

      await connection.commit(); // COMMIT
      connection.release();
      return res.json({
        isSuccess: true,
        code: 200,
        message: '비밀번호 수정 성공',
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
  const connection = await database.singletonDBConnection.getInstance();
  if (typeof connection !== 'object') {
    return res.status(500).send(`Error: ${connection}`);
  }

  const token = req.headers['x-access-token'] || req.query.token;

  const { id: userId } = jwt.verify(token, secretConfig.jwtsecret);

  try {
    await connection.beginTransaction(); // START TRANSACTION

    const deleteUserQuery = `
                    UPDATE User
                    SET isDeleted=?
                    WHERE id=?;
                        `;

    const deleteUserParams = ['Y', userId];
    await connection.query(deleteUserQuery, deleteUserParams);

    await connection.commit(); // COMMIT
    connection.release();
    return res.json({
      isSuccess: true,
      code: 200,
      message: '탈퇴 성공',
    });
  } catch (err) {
    await connection.rollback(); // ROLLBACK
    connection.release();
    logger.error(`App - SignUp Query error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }
};
