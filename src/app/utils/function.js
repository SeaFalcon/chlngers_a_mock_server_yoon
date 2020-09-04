module.exports = {
  requestQueryResult: async (connection, query, ...params) => {
    const [result] = await connection.query(query, params);
    return result;
  },
  makeSuccessResponse: (message) => ({
    isSuccess:true,
    code:200,
    message
  }),
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
  }
};
