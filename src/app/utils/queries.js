module.exports = {
  findUserByEmail: `
            SELECT email, name 
            FROM User 
            WHERE email = ?;
            `,
  findUserByNickname: `
            SELECT email, name 
            FROM User 
            WHERE nickname = ?;
            `,
  findUserInfoByEmail: `
            SELECT userId, email, password, nickname, isDeleted, 
                    IFNULL(profileImageUrl, '') as profileImageUrl,
                    IFNULL(introduction, '') as introduction,
                    IFNULL(phoneNumber, '') as phoneNumber
            FROM User 
            WHERE email = ?;
              `,
  findUserInfoById: `
            SELECT *
            FROM User 
            WHERE userId = ?;
              `,
  mypage: {
    user: `
      SELECT U.userId,
          U.nickname,
          U.profileImageUrl,
          U.introduction,
          G.gradeId,
          G.gradeName
      FROM User U
            JOIN GRADE G ON U.experience >= G.experienceCriteriaMin AND U.experience <= G.experienceCriteriaMax
      WHERE U.userId = ?;
    `,
    follower: `
      SELECT *
      FROM Friend
      WHERE userId2 = ?;
    `,
    following: `
      SELECT *
      FROM Friend
      WHERE userId1 = ?;
    `,
    interestField: `
      SELECT HT.tagId, HT.tagName
      FROM interesttag IT JOIN HashTag HT ON IT.tagId=HT.tagId
      WHERE userId = ?;
    `,
    everydayRecord: `
      SELECT date(createdAt) as record
      FROM ChallengeCertification
      WHERE userId = ? and MONTH(NOW()) = MONTH(createdAt);
    `,
    todayChallenge: `
      SELECT C.challengeId, certificationId, photoUrl, C.startDay, C.endDay, COUNT(CC.userId) as participantCount
      FROM ChallengeCertification CC
              JOIN Challenge C ON CC.challengeId = C.challengeId
              JOIN ChallengeParticipant CP on C.challengeId = CP.challengeId
      WHERE CC.userId = ?
      GROUP BY certificationId, photoUrl, C.startDay, C.endDay;
    `,
  },

};
