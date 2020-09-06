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
          G.gradeName,
          SUM(R.amount) as reward
      FROM user U
            JOIN grade G ON U.experience >= G.experienceCriteriaMin AND U.experience <= G.experienceCriteriaMax
            LEFT JOIN reward R ON U.userId = R.userId and R.type = 'A'
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
  search: {
    getChallenges: `
     SELECT C.challengeId,
            title,
            CONCAT(CONCAT(DATE_FORMAT(startDay, '%m/%d/'), CASE DAYOFWEEK(startDay)
                                                              WHEN '1' THEN '일'
                                                              WHEN '2' THEN '월'
                                                              WHEN '3' THEN '화'
                                                              WHEN '4' THEN '수'
                                                              WHEN '5' THEN '목'
                                                              WHEN '6' THEN '금'
                                                              WHEN '7' THEN '토'
                END
                      ), CONCAT(DATE_FORMAT(endDay, ' - %m/%d/'), CASE DAYOFWEEK(endDay)
                                                                      WHEN '1' THEN '일'
                                                                      WHEN '2' THEN '월'
                                                                      WHEN '3' THEN '화'
                                                                      WHEN '4' THEN '수'
                                                                      WHEN '5' THEN '목'
                                                                      WHEN '6' THEN '금'
                                                                      WHEN '7' THEN '토'
                END))                          as period,
            CONCAT(week, '주')                  as week,
            F.viewName,
            IF(IC.userId = ?, 'true', 'false')         as interest,
            IFNULL(ROUND(AVG(CR.score), 2), 0) as score,
            COUNT(CP.userId) as participationCount,
            S.subjectName,
            ImageUrl
        FROM challenge C
              JOIN frequency F ON C.frequencyId = F.frequencyId
              LEFT JOIN interestedchallenge IC on C.challengeId = IC.challengeId
              LEFT JOIN challengereview CR on C.challengeId = CR.challengeId
              LEFT JOIN challengeparticipant CP on C.challengeId = CP.challengeId
              JOIN subject S ON C.subjectId = S.subjectId
        GROUP BY C.challengeId, title, CONCAT(week, '주'), F.viewName, IF(IC.userId, TRUE, FALSE), ImageUrl
    `,
    random: '\nORDER BY RAND()',
    limit: '\nLIMIT ?, ?',
    subject: 'SELECT * FROM subject;'
  },
};
