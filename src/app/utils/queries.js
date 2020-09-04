module.exports = {
  join: {
    findUserByEmail: `
            SELECT email, name 
            FROM user 
            WHERE email = ?;
            `,
    findUserByNickname: `
            SELECT email, name 
            FROM user 
            WHERE nickname = ?;
            `,
    insert: `
      INSERT INTO user(email, password, name, nickname)
      VALUES (?, ?, ?, ?);
    `,
    insertSNS: (snsName) => `
      INSERT INTO user(email, password, name, nickname, profileImageUrl, ${snsName === 'kakao' ? 'kakaoId' : 'facebookId'})
      VALUES (?, ?, ?, ?, ?, ?);
    `,
  },
  login: {
    findUserInfoByEmail: `
            SELECT userId, email, password, nickname, isDeleted, 
                    IFNULL(profileImageUrl, '') as profileImageUrl,
                    IFNULL(introduction, '') as introduction,
                    IFNULL(phoneNumber, '') as phoneNumber
            FROM user 
            WHERE email = ?;
              `,
  },
  update: {
    user: {
      nickname: `
        UPDATE user
        SET nickname=?
        WHERE userId=?;
      `,
      introduction: `
        UPDATE user
        SET introduction=?
        WHERE userId=?;
      `,
      profileImageUrl: `
        UPDATE user
        SET profileImageUrl=?
        WHERE userId=?;
      `,
      password: `
        UPDATE user
        SET password=?
        WHERE userId=?;
      `,
    }
  },
  delete: {
    user: `
      UPDATE user
      SET isDeleted=?
      WHERE userId=?;
    `,
  },
  mypage: {
    user: `
      SELECT U.userId,
          U.nickname,
          U.profileImageUrl,
          U.introduction,
          G.gradeId,
          G.gradeName
      FROM user U
            JOIN grade G ON U.experience >= G.experienceCriteriaMin AND U.experience <= G.experienceCriteriaMax
      WHERE U.userId = ?;
    `,
    follower: `
      SELECT *
      FROM friend
      WHERE userId2 = ?;
    `,
    following: `
      SELECT *
      FROM friend
      WHERE userId1 = ?;
    `,
    interestField: `
      SELECT HT.tagId, HT.tagName
      FROM interesttag IT JOIN hashtag HT ON IT.tagId=HT.tagId
      WHERE userId = ?;
    `,
    everydayRecord: `
      SELECT date(createdAt) as record
      FROM challengecertification
      WHERE userId = ? and MONTH(NOW()) = MONTH(createdAt);
    `,
    todayChallenge: `
      SELECT C.challengeId, certificationId, photoUrl, C.startDay, C.endDay, COUNT(CC.userId) as participantCount
      FROM challengecertification CC
              JOIN challenge C ON CC.challengeId = C.challengeId
              JOIN challengeparticipant CP on C.challengeId = CP.challengeId
      WHERE CC.userId = ?
      GROUP BY certificationId, photoUrl, C.startDay, C.endDay;
    `,
  },

};
