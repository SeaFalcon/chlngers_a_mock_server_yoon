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
    },
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
          SUM(R.amount) as reward,
          email,
          IFNULL(phoneNumber, '') as phoneNumber,
          name
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
            (SELECT COUNT(userId) FROM challengeparticipant CP2 WHERE CP2.challengeId=C.challengeId) as participationCount,
            S.subjectName,
            ImageUrl
        FROM challenge C
              JOIN frequency F ON C.frequencyId = F.frequencyId
              LEFT JOIN interestedchallenge IC on C.challengeId = IC.challengeId
              LEFT JOIN challengereview CR on C.challengeId = CR.challengeId
              JOIN subject S ON C.subjectId = S.subjectId
        GROUP BY C.challengeId, title, CONCAT(week, '주'), F.viewName, IF(IC.userId, TRUE, FALSE), ImageUrl
    `,
    random: '\nORDER BY RAND()',
    limit: '\nLIMIT ?, ?',
    subject: 'SELECT * FROM subject;',
    cumulativeParticipation: `
        SELECT COUNT(userId)                      as cumulativeParticipation,
              CONCAT(FORMAT(SUM(money), 0), '원') as cumulativeParticipationAmount
        FROM challengeparticipant;
    `,
    challengeDetail: {
      get: `
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
                  END))                                 as period,
              CONCAT(week, '주')                         as week,
              CONCAT(F.viewName, ' 인증')                 as frequency,
              IF(IC.userId = ?, TRUE, FALSE)            as interest,
              IFNULL(ROUND(AVG(CR.score), 2), 0)        as score,
              COUNT(CP.userId)                          as challengerCount,
              CONCAT(FORMAT(SUM(CP.money), 0), '원')     as gatheredAmount,
              S.subjectName,
              ImageUrl,
              certificationMethod,
              F.viewName,
              startTime,
              endTime,
              IF(endTime - startTime = 0, '24시간', '')   as availableTime,
              certificationCountPerDay,
              certificationInterval,
              IF(certificationMeans = 'C', '불가능', '가능') as galleryAvailable,
              goodPhotoUrl,
              goodPhotoDescription,
              badPhotoUrl,
              badPhotoDescription,
              caution,
              introduction,
              COUNT(CR.userId) as reviewCount,
              (SELECT IF(COUNT(dayOfWeek) = 7, '월-일', '월-금') FROM challengeavailabledayofweek CA WHERE CA.challengeId = C.challengeId) as availableDayOfWeek,
              minFee,
              maxFee
        FROM challenge C
                JOIN frequency F ON C.frequencyId = F.frequencyId
                LEFT JOIN interestedchallenge IC on C.challengeId = IC.challengeId
                LEFT JOIN challengereview CR on C.challengeId = CR.challengeId
                LEFT JOIN challengeparticipant CP on C.challengeId = CP.challengeId
                JOIN subject S ON C.subjectId = S.subjectId
        WHERE C.challengeId = ?
        GROUP BY CP.userId
        LIMIT 1;
      `,
      reviews: `
        SELECT *
        FROM challengereview
        WHERE challengeId = ?
        LIMIT 5;
      `,
      certifications: `
        SELECT certificationId, photoUrl
        FROM challengecertification
        WHERE challengeId = ?
        LIMIT 6;
      `,
      availableDayOfWeek: `
        SELECT dayOfWeek
        FROM challengeavailabledayofweek
        WHERE challengeId = ?;
      `,
      impossible: `
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
              IF(IC.userId = ?, TRUE, FALSE)         as interest,
              IFNULL(ROUND(AVG(CR.score), 2), 0) as score,
              S.subjectName,
              ImageUrl,
              (SELECT COUNT(userId) FROM challengeparticipant CP2 WHERE CP2.challengeId=C.challengeId) as participationCount
        FROM challenge C
                JOIN frequency F ON C.frequencyId = F.frequencyId
                LEFT JOIN interestedchallenge IC on C.challengeId = IC.challengeId
                LEFT JOIN challengereview CR on C.challengeId = CR.challengeId
                JOIN subject S ON C.subjectId = S.subjectId
        WHERE C.subjectId = (SELECT subjectId FROM challenge WHERE challengeId = ?) AND C.challengeId != ?
        GROUP BY C.challengeId, title, CONCAT(week, '주'), F.viewName, IF(IC.userId, TRUE, FALSE), ImageUrl;
      `,
    },
  },
  user: {
    isExistUser: 'SELECT userId FROM user WHERE userId=?',
    isExistInterestTag: 'SELECT tagId FROM interesttag WHERE userId=? AND tagId=?',
    isExistInterestChallenge: 'SELECT challengeId FROM interestedchallenge WHERE userId=? AND challengeId=?',
    interestField: {
      get: `
        SELECT HT.tagId, HT.tagName, COUNT(CT.challengeId) as challengeCount, IFNULL(IT.userId, false) as isFollow
        FROM hashtag HT
                JOIN challengetag CT on HT.tagId = CT.tagId
                LEFT JOIN interesttag IT ON HT.tagid = IT.tagId AND IT.userId = ?
        GROUP BY HT.tagId, HT.tagName
        ORDER BY HT.tagId;
      `,
      add: 'INSERT INTO interesttag (userId, tagId) VALUES (?, ?);',
      delete: 'DELETE FROM interesttag WHERE userId = ? AND tagId = ?;',
    },
    interestChallenge: {
      get: `
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
              IF(IC.userId = 1, TRUE, FALSE)         as interest,
              IFNULL(ROUND(AVG(CR.score), 2), 0) as score,
              (SELECT COUNT(userId) FROM challengeparticipant CP2 WHERE CP2.challengeId=C.challengeId) as participationCount,
              S.subjectName,
              ImageUrl
        FROM challenge C
                JOIN frequency F ON C.frequencyId = F.frequencyId
                LEFT JOIN interestedchallenge IC on C.challengeId = IC.challengeId
                LEFT JOIN challengereview CR on C.challengeId = CR.challengeId
                JOIN subject S ON C.subjectId = S.subjectId
        WHERE C.challengeId in (SELECT challengeId FROM interestedchallenge WHERE userId = ?)
        GROUP BY C.challengeId, title, CONCAT(week, '주'), F.viewName, IF(IC.userId, TRUE, FALSE), ImageUrl;
      `,
      add: 'INSERT INTO interestedchallenge (userId, challengeId) VALUES (?, ?);',
      delete: 'DELETE FROM interestedchallenge WHERE userId =? AND challengeId = ?;',
    },
    search: `
     SELECT userId,
            name,
            nickname,
            profileImageUrl,
            IFNULL((SELECT status FROM friend WHERE userId1 = 1 and U.userId = userId2), '') as status
        FROM user U
        WHERE name like CONCAT('%', ?, '%')
        OR nickname like CONCAT('%', ?, '%');
    `,
  },
  challenge: {
    isExistChallenge: 'SELECT challengeId FROM challenge WHERE challengeId = ?;',
    participate: 'INSERT INTO challengeparticipant (challengeId, userId, money) VALUES (?, ?, ?);',
    possibleCertification: `
     select C.challengeId, title, 
            CONCAT(CONCAT(DATE_FORMAT(startDay, '%Y.%m.%d '), CASE DAYOFWEEK(startDay)
                                                                  WHEN '1' THEN '(일)'
                                                                  WHEN '2' THEN '(월)'
                                                                  WHEN '3' THEN '(화)'
                                                                  WHEN '4' THEN '(수)'
                                                                  WHEN '5' THEN '(목)'
                                                                  WHEN '6' THEN '(금)'
                                                                  WHEN '7' THEN '(토)'
                END
                      ), CONCAT(DATE_FORMAT(endDay, ' - %Y.%m.%d '), CASE DAYOFWEEK(endDay)
                                                                          WHEN '1' THEN '(일)'
                                                                          WHEN '2' THEN '(월)'
                                                                          WHEN '3' THEN '(화)'
                                                                          WHEN '4' THEN '(수)'
                                                                          WHEN '5' THEN '(목)'
                                                                          WHEN '6' THEN '(금)'
                                                                          WHEN '7' THEN '(토)'
                END))                                                                                         as period,
            F.viewName,
            CONCAT(startTime, ' - ', endTime)                                                                 as possibleTime,
            CONCAT(FORMAT(100 * ((SELECT COUNT(userId)
               FROM challengecertification CC
               WHERE CP.challengeId = CC.challengeId
                 AND CC.userId = 1) / (DATEDIFF(endDay + 1, startDay) - (week - 1) * (7 - CASE F.frequencyId
                                                                                              WHEN 1 THEN 7
                                                                                              WHEN 2 THEN 5
                                                                                              WHEN 3 THEN 2
                                                                                              WHEN 4 THEN 6
                                                                                              WHEN 5 THEN 5
                                                                                              WHEN 6 THEN 4
                                                                                              WHEN 7 THEN 3
                                                                                              WHEN 8 THEN 2
                                                                                              WHEN 9 THEN 1 END))),
              2), '%')                                                                                        as achievementRate
        from challenge C
              JOIN challengeparticipant CP ON CP.challengeId = C.challengeId
              JOIN frequency F ON C.frequencyId = F.frequencyId
        where CP.userId = ?;
    `,
    certificate: 'INSERT INTO challengecertification (userId, challengeId, photoUrl, content) VALUES (?, ?, ?, ?);',
    isExistSubject: 'SELECT subjectId FROM subject WHERE subjectId = ?',
    challengeBySubjectId: 'SELECT * FROM challenge WHERE subjectId = ?',
    isExistHashTag: 'SELECT tagId FROM hashtag WHERE tagid = ?',
    needConditions: {
      subject: 'SELECT * FROM subject;',
      availableDayOfWeek: 'SELECT * FROM availabledayofweek;',
      frequency: 'SELECT * FROM frequency;',
    },
    madeByMe: `
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
              IF(IC.userId = 1, TRUE, FALSE)         as interest,
              IFNULL(ROUND(AVG(CR.score), 2), 0) as score,
              COUNT(CP.userId)                   as participationCount,
              S.subjectName,
              ImageUrl
          FROM challenge C
                JOIN frequency F ON C.frequencyId = F.frequencyId
                LEFT JOIN interestedchallenge IC on C.challengeId = IC.challengeId
                LEFT JOIN challengereview CR on C.challengeId = CR.challengeId
                LEFT JOIN challengeparticipant CP on C.challengeId = CP.challengeId
                JOIN subject S ON C.subjectId = S.subjectId
          WHERE C.userId = ?
          GROUP BY C.challengeId, title, CONCAT(week, '주'), F.viewName, IF(IC.userId, TRUE, FALSE), ImageUrl;
    `,
    challengeByTag: `
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
                  END))                                                                                  as period,
              CONCAT(week, '주')                                                                          as week,
              F.viewName,
              IF(IC.userId = 1, TRUE, FALSE)                                                             as interest,
              IFNULL(ROUND(AVG(CR.score), 2), 0)                                                         as score,
              (SELECT COUNT(userId) FROM challengeparticipant CP2 WHERE CP2.challengeId = C.challengeId) as participationCount,
              HT.tagName,
              ImageUrl
          FROM challenge C
                JOIN frequency F ON C.frequencyId = F.frequencyId
                LEFT JOIN interestedchallenge IC on C.challengeId = IC.challengeId
                LEFT JOIN challengereview CR on C.challengeId = CR.challengeId
                LEFT JOIN challengeparticipant CP on C.challengeId = CP.challengeId
                JOIN challengetag CT ON C.challengeId = CT.challengeId
                JOIN hashtag HT on CT.tagId = HT.tagId
          GROUP BY C.challengeId, title, CONCAT(week, '주'), F.viewName, IF(IC.userId, TRUE, FALSE), ImageUrl;
    `,
    getHashtag: 'SELECT * FROM hashtag',
    select: {
      hashtag: 'SELECT tagId FROM hashtag WHERE tagName = ?',
    },
    insert: {
      hashtag: 'INSERT INTO hashtag (tagName) VALUES (?);',
      challengetag: 'INSERT INTO challengetag (challengeId, tagId) VALUES (?, ?);',
    },
    update: {
      image: 'UPDATE challenge SET ImageUrl = ? WHERE challengeId = ?',
      title: 'UPDATE challenge SET title = ? WHERE challengeId = ?',
      introduction: 'UPDATE challenge SET introduction = ? WHERE challengeId = ?',
      example: 'UPDATE challenge SET goodPhotoUrl = ?, badPhotoUrl = ? WHERE challengeId = ?',
    },
    delete: {
      hashtag: 'DELETE FROM challengetag WHERE challengeId = ?',
      challenge: 'DELETE FROM challenge WHERE challengeId = ?',
    },
  },
  friend: {
    follower: `
      SELECT userId, name, nickname, profileImageUrl, IF(status = 'Y', '팔로잉', '대기중') as status
      FROM friend
              JOIN user ON userId = userId1
      WHERE userId2 = ?;
    `,
    following: `
      SELECT userId, name, nickname, profileImageUrl, IF(status = 'Y', '팔로잉', '대기중') as status
      FROM friend
              JOIN user ON userId = userId2
      WHERE userId1 = ?;
    `,
    recommend: `
      SELECT userId, name, nickname, profileImageUrl
      FROM user
              JOIN friend on userId != userId2
      WHERE userId1 != ?
      ORDER BY RAND()
      LIMIT 10;
    `,
    requestFollow: 'INSERT INTO friend (userId1, userId2, status) VALUES (?, ?, \'N\');',
    acceptFollow: 'UPDATE friend SET status = \'Y\' WHERE userId1 = ? AND userId2 = ?;',
    deleteFollow: 'DELETE FROM friend WHERE userId1 = ? AND userId2 = ?;',
    isExistRequest: `
      SELECT userId1, userId2 FROM friend WHERE userId1 = ? AND userId2 = ?
    `,
    getStatus: `
      SELECT * FROM friend WHERE userId1 = ? AND userId2 = ? AND status = ?
    `,
  },
  feed: {
    getAll: `
      SELECT certificationId, photoUrl
      FROM challengecertification CC
              JOIN challenge C on CC.challengeId = C.challengeId
      WHERE C.endDay > now()
      LIMIT 15 OFFSET ?;
    `,
    getFollow: `
      SELECT certificationId, photoUrl
      FROM challengecertification CC
              JOIN challenge C on CC.challengeId = C.challengeId
      WHERE C.endDay > now() AND C.userId IN
            (SELECT userId2 FROM friend WHERE userId1 = ?)
      LIMIT 15 OFFSET ?;
    `,
    getCurrentMe: `
      SELECT certificationId, photoUrl
      FROM challengecertification CC
              JOIN challenge C on CC.challengeId = C.challengeId
      WHERE userId = ?
        AND C.endDay > now()
      LIMIT 15 OFFSET ?;
    `,
  },
};
