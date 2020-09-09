const crypto = require('crypto');

const request = require('request');

const { requestTransactionQuery, requestNonTransactionQuery } = require('../../../config/database');

const {
  makeSuccessResponse, snsInfo, makeLoginResponse, getValidationResult,
} = require('../utils/function');

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

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');

  const { isSuccess, result } = await requestTransactionQuery(queries.join.insert, [email, hashedPassword, name, nickname]);

  if (isSuccess) {
    return res.json({
      ...makeSuccessResponse('회원가입 성공 성공'),
    });
  }

  return res.status(500).send(`Error: ${result.message}`);
};

exports.login = async (req, res) => {
  const { email } = req.body;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { isSuccess, result } = await requestNonTransactionQuery(queries.login.findUserInfoByEmail, [email]);

  if (isSuccess) {
    const response = await makeLoginResponse(result[0]);

    return res.json(response);
  }

  return res.status(500).send(`Error: ${result.message}`);
};

exports.snsLogin = async (req, res) => {
  const { body: { accessToken }, params: { snsName } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
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

      const { isSuccess: findUserSuccess, result: findUserResult } = await requestNonTransactionQuery(queries.login.findUserInfoByEmail, [email]);

      if (findUserSuccess && findUserResult.length) {
        // 이미 가입되어있음 -> 로그인 처리
        const loginResponse = await makeLoginResponse(findUserResult[0]);

        return res.json(loginResponse);
      } if (findUserSuccess && findUserResult.length < 1) {
        // 첫 로그인 -> 가입 후 로그인 처리

        const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');

        const { isSuccess: joinSuccess, result: joinResult } = await requestTransactionQuery(queries.join.insertSNS, [email, hashedPassword, nickname, nickname, profileImageUrl, password]);

        if (joinSuccess) {
          const { insertId } = joinResult[0];

          const loginResponse = await makeLoginResponse({
            userId: insertId, nickname, email, profileImageUrl, introduction: '', phoneNumber: '', isDeleted: 'N',
          });

          return res.json(loginResponse);
        }

        return res.status(500).send(`Error: ${joinResult.message}`);
      }

      return res.status(500).send(`Error: ${findUserResult.message}`);
    }
    return res.json(snsInfo[snsName].errorCode);
  });
};

exports.getUserPage = async (req, res) => {
  const { params: { id: userId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { isSuccess: userInfoRowsSuccess, result: userInfoRows } = await requestNonTransactionQuery(queries.mypage.user, [userId]);
  const { isSuccess: followersSuccess, result: followers } = await requestNonTransactionQuery(queries.mypage.follower, [userId]);
  const { isSuccess: followingsSuccess, result: followings } = await requestNonTransactionQuery(queries.mypage.following, [userId]);
  const { isSuccess: interestFieldsSuccess, result: interestFields } = await requestNonTransactionQuery(queries.mypage.interestField, [userId]);
  const { isSuccess: everydayRecordsSuccess, result: everydayRecords } = await requestNonTransactionQuery(queries.mypage.everydayRecord, [userId]);
  const { isSuccess: todayChallengesSuccess, result: todayChallenges } = await requestNonTransactionQuery(queries.mypage.todayChallenge, [userId]);

  if (userInfoRowsSuccess && followersSuccess && followingsSuccess && interestFieldsSuccess && everydayRecordsSuccess && todayChallengesSuccess) {
    const myPageInfo = {
      ...userInfoRows[0],
      followerCount: followers.length,
      followingCount: followings.length,
      interestFields: interestFields.map((field) => field.tagName),
      everydayRecords: everydayRecords.map((record) => record.record),
      todayChallenges,
    };

    return res.json({
      myPageInfo,
      ...makeSuccessResponse('마이페이지 조회 성공'),
    });
  }

  return res.status(500).send('Error: 마이페이지 조회 실패');
};

exports.myPage = async (req, res) => {
  const { verifiedToken: { id: userId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { isSuccess: userInfoRowsSuccess, result: userInfoRows } = await requestNonTransactionQuery(queries.mypage.user, [userId]);
  const { isSuccess: followersSuccess, result: followers } = await requestNonTransactionQuery(queries.mypage.follower, [userId]);
  const { isSuccess: followingsSuccess, result: followings } = await requestNonTransactionQuery(queries.mypage.following, [userId]);
  const { isSuccess: interestFieldsSuccess, result: interestFields } = await requestNonTransactionQuery(queries.mypage.interestField, [userId]);
  const { isSuccess: everydayRecordsSuccess, result: everydayRecords } = await requestNonTransactionQuery(queries.mypage.everydayRecord, [userId]);
  const { isSuccess: todayChallengesSuccess, result: todayChallenges } = await requestNonTransactionQuery(queries.mypage.todayChallenge, [userId]);

  if (userInfoRowsSuccess && followersSuccess && followingsSuccess && interestFieldsSuccess && everydayRecordsSuccess && todayChallengesSuccess) {
    const myPageInfo = {
      ...userInfoRows[0],
      followerCount: followers.length,
      followingCount: followings.length,
      interestFields: interestFields.map((field) => field.tagName),
      everydayRecords: everydayRecords.map((record) => record.record),
      todayChallenges,
    };

    return res.json({
      myPageInfo,
      ...makeSuccessResponse('마이페이지 조회 성공'),
    });
  }

  return res.status(500).send('Error: 마이페이지 조회 실패');
};

exports.update = {
  nickname: async (req, res) => {
    const { verifiedToken: { id: userId }, body: { nickname } } = req;

    const errors = getValidationResult(req);
    if (!errors.success) {
      return res.status(400).json(errors);
    }

    const { isSuccess, result } = await requestTransactionQuery(queries.update.user.nickname, [nickname, userId]);

    if (isSuccess) {
      return res.json({
        ...makeSuccessResponse('닉네임 수정 성공'),
      });
    }

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

    return res.status(500).send(`Error: ${result.message}`);
  },
  profileImageUrl: async (req, res) => {
    const { verifiedToken: { id: userId }, body: { profileImageUrl } } = req;

    const errors = getValidationResult(req);
    if (!errors.success) {
      return res.status(400).json(errors);
    }

    const { isSuccess, result } = await requestTransactionQuery(queries.update.user.profileImageUrl, [profileImageUrl, userId]);

    if (isSuccess) {
      return res.json({
        ...makeSuccessResponse('프로필 이미지 수정 성공'),
      });
    }

    return res.status(500).send(`Error: ${result.message}`);
  },
  password: async (req, res) => {
    const { verifiedToken: { id: userId }, body: { password } } = req;

    const errors = getValidationResult(req);
    if (!errors.success) {
      return res.status(400).json(errors);
    }

    const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');

    const { isSuccess, result } = await requestTransactionQuery(queries.update.user.password, [hashedPassword, userId]);

    if (isSuccess) {
      return res.json({
        ...makeSuccessResponse('비밀번호 수정 성공'),
      });
    }

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

  return res.status(500).send(`Error: ${result.message}`);
};

exports.getProfile = async (req, res) => {
  const { verifiedToken: { id: userId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { isSuccess: userInfoRowsSuccess, result: userInfoRows } = await requestNonTransactionQuery(queries.mypage.user, [userId]);
  const { isSuccess: interestFieldsSuccess, result: interestFields } = await requestNonTransactionQuery(queries.mypage.interestField, [userId]);

  const {
    nickname, introduction, email, name, phoneNumber,
  } = userInfoRows[0];

  if (userInfoRowsSuccess && interestFieldsSuccess) {
    return res.json({
      profile: {
        nickname,
        interestFields: interestFields.map((field) => field.tagName),
        introduction,
        email,
        name,
        phoneNumber,
      },
      ...makeSuccessResponse('마이 프로필 조회 성공'),
    });
  }

  return res.status(500).send('Error: 마이페이지 조회 실패');
};

exports.search = async (req, res) => {
  const { verifiedToken: { id }, query: { keyword } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { isSuccess: searchSuccess, result: searchResult } = await requestNonTransactionQuery(queries.user.search, [id, keyword, keyword]);

  const users = searchResult.map((user) => {
    const userStatus = (status) => {
      if (!status) return '팔로우';
      return user.status === 'Y' ? '친구' : '대기중';
    };

    return {
      userId: user.userId,
      nickname: user.nickname,
      name: user.name,
      profileImageUrl: user.profileImageUrl,
      status: userStatus(user.status),
    };
  });

  if (searchSuccess) {
    return res.json({
      users,
      ...makeSuccessResponse('유저 검색 성공'),
    });
  }

  return res.status(500).send('Error: 유저 검색 실패');
};
