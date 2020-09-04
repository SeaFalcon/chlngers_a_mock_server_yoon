const { validationResult } = require('express-validator');

const jwt = require('jsonwebtoken');

const { jwtsecret } = require('../../../config/secret');

function makeSuccessResponse(message) {
  return {
    isSuccess: true,
    code: 200,
    message
  };
}

module.exports = {
  makeSuccessResponse,
  snsInfo: {
    facebook: {
      url: 'https://graph.facebook.com/v8.0/me?fields=id,name,email,picture.type(large){url}',
      getUserInfo: ({
        id: password, name: nickname, email, picture: { data: { url: profileImageUrl } },
      }) => ({
        password, nickname, email, profileImageUrl,
      }),
      errorCode: { code: 312, message: 'AccessToken not valid, Facebook Login Failed.' },
    },
    kakao: {
      url: 'https://kapi.kakao.com/v2/user/me',
      getUserInfo: ({
        id: password, kakao_account: { profile: { nickname, thumbnail_image_url: profileImageUrl }, email },
      }) => ({
        password, nickname, email, profileImageUrl,
      }),
      errorCode: { code: 313, message: 'AccessToken not valid, Kakao Login Failed.' },
    },
    naver: {
      url: 'https://openapi.naver.com/v1/nid/me',
      getUserInfo: ({
        id: password, nickname, profile_image: profileImageUrl, email,
      }) => ({
        password, nickname, email, profileImageUrl,
      }),
      errorCode: { code: 314, message: 'AccessToken not valid, naver Login Failed.' },
    },
  },
  getValidationResult: (req) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const result = errors.errors.map((error) => error.msg);
      return { success: false, errors: [...result] };
    }

    return { success: true };
  },
  makeLoginResponse: async ({ userId, email, nickname, profileImageUrl, phoneNumber, isDeleted, introduction }) => {
    const userInfo = {
      id: userId,
      email,
      nickname,
      profileImageUrl: profileImageUrl || '',
      introduction: introduction || '',
      phoneNumber: phoneNumber || '',
      isDeleted,
    };

    // 토큰 생성
    const token = await jwt.sign(userInfo, // 토큰의 내용(payload)
      jwtsecret, // 비밀 키
      {
        expiresIn: '365d', // 유효 시간은 365일
        subject: 'userInfo',
      });

    const result = { userInfo, jwt: token, ...makeSuccessResponse('로그인 성공') }
    return result;
  }
};
