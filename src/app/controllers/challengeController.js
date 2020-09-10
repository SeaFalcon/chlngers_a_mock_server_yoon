const { requestNonTransactionQuery, transaction } = require('../../../config/database');

const queries = require('../utils/queries');

const { shuffleArray, makeSuccessResponse, getValidationResult } = require('../utils/function');

exports.getChallenges = async (req, res) => {
  const { verifiedToken: { id } } = req;

  const {
    search: {
      getChallenges, subject: getSubjects, cumulativeParticipation: getCumulativeParticipation, // random, limit,
    },
  } = queries;

  // const { isSuccess: recommendSuccess, result: recommends } = await requestNonTransactionQuery(getChallenges + random + limit, [id, 0, 6]);
  const { isSuccess: subjectSuccess, result: subjects } = await requestNonTransactionQuery(getSubjects);
  const { isSuccess: allChallengeSuccess, result: allChallenges } = await requestNonTransactionQuery(getChallenges, [id]);
  // const { isSuccess: popularSuccess, result: populars } = await requestNonTransactionQuery(getChallenges + random + limit, [id, 0, 9]);
  const { isSuccess: CumulativeParticipationSuccess, result: CumulativeParticipations } = await requestNonTransactionQuery(getCumulativeParticipation);

  const recommendResult = {
    subject: '추천',
    challenges: shuffleArray([...allChallenges]).slice(0, 6),
  };

  const subjectResult = subjects.map((subject) => ({
    subjectId: subject.subjectId,
    subject: subject.subjectName,
    challenges: allChallenges.filter((challenge) => challenge.subjectName === subject.subjectName),
  }));

  const challenges = {
    search: [...subjectResult, recommendResult],
    popular: [
      {
        gender: 'man',
        challenges: {
          tens: shuffleArray([...allChallenges]).slice(0, 9),
          twenties: shuffleArray([...allChallenges]).slice(0, 9),
          thirties: shuffleArray([...allChallenges]).slice(0, 9),
          forties: shuffleArray([...allChallenges]).slice(0, 9),
        },
      },
      {
        gender: 'woman',
        challenges: {
          tens: shuffleArray([...allChallenges]).slice(0, 9),
          twenties: shuffleArray([...allChallenges]).slice(0, 9),
          thirties: shuffleArray([...allChallenges]).slice(0, 9),
          forties: shuffleArray([...allChallenges]).slice(0, 9),
        },
      },
    ],
  };

  if (subjectSuccess && allChallengeSuccess && CumulativeParticipationSuccess) return res.json({ ...challenges, ...CumulativeParticipations[0], ...makeSuccessResponse('탐색페이지 조회 성공') });

  if (!subjectSuccess) return res.status(500).send(`subjects Error: ${subjects.message}`);
  if (!allChallengeSuccess) return res.status(500).send(`allChallenges Error: ${allChallenges.message}`);
  if (!CumulativeParticipationSuccess) return res.status(500).send(`CumulativeParticipations Error: ${CumulativeParticipations.message}`);
};

exports.getChallengeDetail = async (req, res) => {
  const { verifiedToken: { id }, params: { challengeId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const {
    search: {
      challengeDetail: {
        get, certifications, impossible, reviews,
      },
    },
  } = queries;

  const { isSuccess: detailSuccess, result: detailResult } = await requestNonTransactionQuery(get, [id, challengeId]);
  const { isSuccess: certificationSuccess, result: certificationsResult } = await requestNonTransactionQuery(certifications, [challengeId]);
  const { isSuccess: impossibleSuccess, result: impossiblesResult } = await requestNonTransactionQuery(impossible, [id, challengeId, challengeId]);
  const { isSuccess: reviewSuccess, result: reviewsResult } = await requestNonTransactionQuery(reviews, [challengeId]);

  if (detailSuccess && certificationSuccess && impossibleSuccess && reviewSuccess) {
    return res.json({
      ...detailResult[0],
      reviewsResult,
      certificationsResult,
      impossiblesResult,
      ...makeSuccessResponse('챌린지 상세 조회 성공'),
    });
  }

  if (!detailSuccess) return res.status(500).send(`detailResult Error: ${detailResult.message}`);
  if (!certificationSuccess) return res.status(500).send(`certificationsResult Error: ${certificationsResult.message}`);
  if (!impossibleSuccess) return res.status(500).send(`impossiblesResult Error: ${impossiblesResult.message}`);
  if (!reviewSuccess) return res.status(500).send(`reviewsResult Error: ${reviewsResult.message}`);
};

exports.participateChallenge = async (req, res) => {
  const { verifiedToken: { id }, params: { challengeId }, body: { money } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { participate } } = queries;

  const { isSuccess: participationSuccess, result: participationResult } = await requestNonTransactionQuery(participate, [challengeId, id, money]);

  if (participationSuccess) {
    return res.json({
      ...makeSuccessResponse('챌린지 참가 성공'),
    });
  }

  return res.status(500).send(`participationResult Error: ${participationResult.message}`);
};

exports.getPossibleCertification = async (req, res) => {
  const { verifiedToken: { id } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { possibleCertification } } = queries;

  const { isSuccess: possibleCertificationSuccess, result: possibleCertificationResult } = await requestNonTransactionQuery(possibleCertification, [id, id]);

  if (possibleCertificationSuccess) {
    return res.json({
      possibleCertificationResult,
      ...makeSuccessResponse('인증 페이지 조회 성공'),
    });
  }

  return res.status(500).send(`possibleCertificationResult Error: ${possibleCertificationResult.message}`);
};

exports.certificateChallenge = async (req, res) => {
  const { verifiedToken: { id }, params: { challengeId }, body: { photoUrl, content } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { certification: { insert } } } = queries;

  const { isSuccess: certificateSuccess, result: certificateResult } = await requestNonTransactionQuery(insert, [id, challengeId, photoUrl, (content || '')]);

  if (certificateSuccess) {
    return res.json({
      ...makeSuccessResponse('챌린지 인증 성공'),
    });
  }

  return res.status(500).send(`certificateResult Error: ${certificateResult.message}`);
};

exports.getChallengesBySubject = async (req, res) => {
  const { params: { subjectId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { challengeBySubjectId } } = queries;

  const { isSuccess: challengeBySubjectSuccess, result: challengeBySubjectResult } = await requestNonTransactionQuery(challengeBySubjectId, [subjectId]);

  if (challengeBySubjectSuccess) {
    return res.json({
      challengeBySubjectResult,
      ...makeSuccessResponse('카테고리 별 챌린지 조회 성공'),
    });
  }

  return res.status(500).send(`challengeBySubjectResult Error: ${challengeBySubjectResult.message}`);
};

exports.getInterestChallenges = async (req, res) => {
  const { verifiedToken: { id } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { user: { interestChallenge: { get } } } = queries;

  const { isSuccess: interestChallengeSuccess, result: interestChallengeResult } = await requestNonTransactionQuery(get, [id]);

  if (interestChallengeSuccess) {
    return res.json({
      interestChallengeResult,
      ...makeSuccessResponse('관심 챌린지 조회 성공'),
    });
  }

  return res.status(500).send(`interestChallengeResult Error: ${interestChallengeResult.message}`);
};

exports.addInterestChallenge = async (req, res) => {
  const { verifiedToken: { id }, params: { challengeId }, body: { status } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { user: { interestChallenge: { add, delete: remove } } } = queries;

  const { isSuccess, result } = status
    ? await requestNonTransactionQuery(add, [id, challengeId])
    : await requestNonTransactionQuery(remove, [id, challengeId]);

  if (isSuccess) {
    return res.json({
      ...makeSuccessResponse(status ? '관심 챌린지 추가 성공' : '관심 챌린지 제거 성공'),
    });
  }

  return res.status(500).send(`result Error: ${result.message}`);
};

exports.deleteInterestChallenges = async (req, res) => {
  const { verifiedToken: { id }, params: { challengeId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { user: { interestChallenge: { delete: remove } } } = queries;

  const { isSuccess, result } = await requestNonTransactionQuery(remove, [id, challengeId]);

  if (isSuccess) {
    return res.json({
      ...makeSuccessResponse('관심 챌린지 제거 성공'),
    });
  }

  return res.status(500).send(`result Error: ${result.message}`);
};

exports.getInterestTags = async (req, res) => {
  const { verifiedToken: { id } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { user: { interestField: { get } } } = queries;

  const { isSuccess: interestTagSuccess, result: interestTagResult } = await requestNonTransactionQuery(get, [id]);

  if (interestTagSuccess) {
    return res.json({
      interestTagResult,
      ...makeSuccessResponse('관심분야 리스트 조회 성공'),
    });
  }

  return res.status(500).send(`interestTagResult Error: ${interestTagResult.message}`);
};

exports.addInterestTag = async (req, res) => {
  const { verifiedToken: { id }, params: { tagId }, body: { status } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { user: { interestField: { add, delete: remove } } } = queries;

  const { isSuccess, result } = status
    ? await requestNonTransactionQuery(add, [id, tagId])
    : await requestNonTransactionQuery(remove, [id, tagId]);

  if (isSuccess) {
    return res.json({
      ...makeSuccessResponse(status ? '관심분야 팔로우 성공' : '관심분야 언팔로우 성공'),
    });
  }

  return res.status(500).send(`result Error: ${result.message}`);
};

exports.deleteInterestTag = async (req, res) => {
  const { verifiedToken: { id }, params: { tagId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { user: { interestField: { delete: remove } } } = queries;

  const { isSuccess, result } = await requestNonTransactionQuery(remove, [id, tagId]);

  if (isSuccess) {
    return res.json({
      ...makeSuccessResponse('관심분야 언팔로우 성공'),
    });
  }

  return res.status(500).send(`result Error: ${result.message}`);
};

exports.getOpenPage = async (req, res) => {
  const { verifiedToken: { id } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { mypage: { interestField }, challenge: { madeByMe, challengeByTag, getHashtag } } = queries;

  const { isSuccess: interestFieldSuccess, result: interestFieldResult } = await requestNonTransactionQuery(interestField, [id]);
  const { isSuccess: myChallengeSuccess, result: myChallengeResult } = await requestNonTransactionQuery(madeByMe, [id]);
  const { isSuccess: challengeByTagSuccess, result: challengeByTagResult } = await requestNonTransactionQuery(challengeByTag);
  const { isSuccess: hashTagSuccess, result: hashTagResult } = await requestNonTransactionQuery(getHashtag);

  const challengeByTags = hashTagResult.map((tag) => ({
    ...tag,
    challenges: challengeByTagResult.filter((challenge) => challenge.tagName === tag.tagName),
  }));

  if (interestFieldSuccess && myChallengeSuccess && challengeByTagSuccess && hashTagSuccess) {
    return res.json({
      interestFieldResult,
      myChallengeResult,
      challengeByTags,
      ...makeSuccessResponse('개설 페이지 조회 성공'),
    });
  }

  if (!interestFieldSuccess) return res.status(500).send(`interestFieldResult Error: ${interestFieldResult.message}`);
  if (!myChallengeSuccess) return res.status(500).send(`myChallengeResult Error: ${myChallengeResult.message}`);
  if (!challengeByTagSuccess) return res.status(500).send(`challengeByTagResult Error: ${challengeByTagResult.message}`);
  if (!hashTagSuccess) return res.status(500).send(`hashTagResult Error: ${hashTagResult.message}`);
};

exports.needConditions = async (req, res) => {
  const { challenge: { needConditions: { availableDayOfWeek, frequency, subject } } } = queries;

  const { isSuccess: availableDayOfWeekSuccess, result: availableDayOfWeekResult } = await requestNonTransactionQuery(availableDayOfWeek);
  const { isSuccess: frequencySuccess, result: frequencyResult } = await requestNonTransactionQuery(frequency);
  const { isSuccess: subjectSuccess, result: subjectResult } = await requestNonTransactionQuery(subject);

  if (availableDayOfWeekSuccess && frequencySuccess && subjectSuccess) {
    return res.json({
      availableDayOfWeekResult,
      frequencyResult,
      subjectResult,
      certificationMeans: [
        { meansId: 'C', meansName: '카메라만 사용가능' },
        { meansId: 'P', meansName: '카메라, 사진첩 사용가능' },
      ],
      ...makeSuccessResponse('챌린지 개설에 필요한 정보 조회 성공'),
    });
  }

  if (!availableDayOfWeekSuccess) return res.status(500).send(`availableDayOfWeekResult Error: ${availableDayOfWeekResult.message}`);
  if (!frequencySuccess) return res.status(500).send(`frequencyResult Error: ${frequencyResult.message}`);
  if (!subjectSuccess) return res.status(500).send(`subjectResult Error: ${subjectResult.message}`);
};

exports.create = async (req, res) => {
  const {
    body,
    // body: {      title, certificationInterval, certificationMethod, certificationCountPerDay, certificationMeans, startDay, endDay, startTime, endTime, minFee, maxFee, participationCode, ImageUrl, introduction, goodPhotoUrl, badPhotoUrl, frequencyId, subjectId, official, caution, week, userId    },
    body: {
      availableDayOfWeeks, hashTag,
    },
  } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const {
    challenge: {
      insert: {
        item, challengeavailabledayofweek, hashtag: insertHashTag, challengetag: insertChallengeTag,
      }, select: { hashtag: selectHashTag },
    },
  } = queries;

  const result = transaction(async () => {
    const { result: { insertId: challengeId } } = await requestNonTransactionQuery(item, [...Object.values(body)]);

    availableDayOfWeeks.forEach(async (dayofweek) => {
      await requestNonTransactionQuery(challengeavailabledayofweek, [challengeId, dayofweek]);
    });

    hashTag.forEach(async (tag) => {
      const { result: hashTagResult } = await requestNonTransactionQuery(selectHashTag, [tag]);
      if (!hashTagResult[0]) {
        const { result: { insertId: hashTagId } } = await requestNonTransactionQuery(insertHashTag, [tag]);
        await requestNonTransactionQuery(insertChallengeTag, [challengeId, hashTagId]);
      } else {
        await requestNonTransactionQuery(insertChallengeTag, [challengeId, hashTagResult[0].tagId]);
      }
    });
  });

  const transactionResult = await result;

  if (transactionResult === 'success') {
    return res.json({
      ...makeSuccessResponse('챌린지 개설 성공'),
    });
  }

  return res.status(500).send('Error: challenge insert Transaction Failed');
};

exports.delete = async (req, res) => {
  const { params: { challengeId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { delete: { challenge: deleteChallenge, challengeavailabledayofweek, challengetag } } } = queries;

  const result = transaction(async () => {
    await requestNonTransactionQuery(deleteChallenge, [challengeId]);
    await requestNonTransactionQuery(challengeavailabledayofweek, [challengeId]);
    await requestNonTransactionQuery(challengetag, [challengeId]);
  });

  const transactionResult = await result;

  if (transactionResult === 'success') {
    return res.json({
      ...makeSuccessResponse('챌린지 삭제 성공'),
    });
  }

  return res.status(500).send('delete challenge transaction error');
};

exports.update = {
  image: async (req, res) => {
    const { params: { challengeId }, body: { image: imageUrl } } = req;

    const errors = getValidationResult(req);
    if (!errors.success) {
      return res.status(400).json(errors);
    }

    const { challenge: { update: { image } } } = queries;

    const { isSuccess: updateImageSuccess, result: updateImageResult } = await requestNonTransactionQuery(image, [imageUrl, challengeId]);

    if (updateImageSuccess) {
      return res.json({
        ...makeSuccessResponse('챌린지 이미지 수정 성공'),
      });
    }

    return res.status(500).send(`updateImageResult Error: ${updateImageResult.message}`);
  },
  title: async (req, res) => {
    const { params: { challengeId }, body: { title: challengeTitle } } = req;

    const errors = getValidationResult(req);
    if (!errors.success) {
      return res.status(400).json(errors);
    }

    const { challenge: { update: { title } } } = queries;

    const { isSuccess: updateTitleSuccess, result: updateTitleResult } = await requestNonTransactionQuery(title, [challengeTitle, challengeId]);

    if (updateTitleSuccess) {
      return res.json({
        ...makeSuccessResponse('챌린지 제목 수정 성공'),
      });
    }

    return res.status(500).send(`updateTitleResult Error: ${updateTitleResult.message}`);
  },
  hashtag: async (req, res) => {
    const { params: { challengeId }, body: { hashTag } } = req;

    const errors = getValidationResult(req);
    if (!errors.success) {
      return res.status(400).json(errors);
    }

    const { challenge: { select: { hashtag: selectHashTag }, insert: { hashtag: insertHashTag, challengetag: insertChallengeTag }, delete: { hashtag: deleteHashTag } } } = queries;

    const result = transaction(async () => {
      await requestNonTransactionQuery(deleteHashTag, [challengeId]);

      hashTag.forEach(async (tag) => {
        const { result: hashTagResult } = await requestNonTransactionQuery(selectHashTag, [tag]);
        if (!hashTagResult[0]) {
          const { result: { insertId } } = await requestNonTransactionQuery(insertHashTag, [tag]);
          await requestNonTransactionQuery(insertChallengeTag, [challengeId, insertId]);
        } else {
          await requestNonTransactionQuery(insertChallengeTag, [challengeId, hashTagResult[0].tagId]);
        }
      });
    });

    const transactionResult = await result;

    if (transactionResult === 'success') {
      return res.json({
        ...makeSuccessResponse('챌린지 태그 수정 성공'),
      });
    }

    return res.status(500).send('Error: challenge update tag Transaction Failed');
  },
  example: async (req, res) => {
    const { params: { challengeId }, body: { goodPhotoUrl, badPhotoUrl } } = req;

    const errors = getValidationResult(req);
    if (!errors.success) {
      return res.status(400).json(errors);
    }

    const { challenge: { update: { example } } } = queries;

    const { isSuccess: exampleSuccess, result: exampleResult } = await requestNonTransactionQuery(example, [goodPhotoUrl, badPhotoUrl, challengeId]);

    if (exampleSuccess) {
      return res.json({
        ...makeSuccessResponse('챌린지 예시 수정 성공'),
      });
    }

    return res.status(500).send(`exampleResult Error: ${exampleResult.message}`);
  },
  introduction: async (req, res) => {
    const { params: { challengeId }, body: { introduction: challengeIntroduction } } = req;

    const errors = getValidationResult(req);
    if (!errors.success) {
      return res.status(400).json(errors);
    }

    const { challenge: { update: { introduction } } } = queries;

    const { isSuccess: updateIntroductionSuccess, result: updateIntroductionResult } = await requestNonTransactionQuery(introduction, [challengeIntroduction, challengeId]);

    if (updateIntroductionSuccess) {
      return res.json({
        ...makeSuccessResponse('챌린지 소개 수정 성공'),
      });
    }

    return res.status(500).send(`updateIntroductionResult Error: ${updateIntroductionResult.message}`);
  },
};

exports.createReview = async (req, res) => {
  const { verifiedToken: { id }, params: { challengeId }, body: { content, score } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { review: { insert } } } = queries;

  const { isSuccess: insertReviewSuccess, result: insertReviewResult } = await requestNonTransactionQuery(insert, [challengeId, id, content, score]);

  if (insertReviewSuccess) {
    return res.json({
      ...makeSuccessResponse('챌린지 리뷰 작성 성공'),
    });
  }

  return res.status(500).send(`insertReviewResult Error: ${insertReviewResult.message}`);
};

exports.likeCertification = async (req, res) => {
  const { verifiedToken: { id }, params: { certificationId }, body: { status } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { certification: { like, cancelLike } } } = queries;

  const { isSuccess: likeCertificationSuccess, result: likeCertificationResult } = status
    ? await requestNonTransactionQuery(like, [certificationId, id])
    : await requestNonTransactionQuery(cancelLike, [certificationId, id]);

  if (likeCertificationSuccess) {
    return res.json({
      ...makeSuccessResponse(status ? '인증 좋아요 성공' : '인증 좋아요 취소 성공'),
    });
  }

  return res.status(500).send(`likeCertificationResult Error: ${likeCertificationResult.message}`);
};

exports.cancelLikeCertification = async (req, res) => {
  const { verifiedToken: { id }, params: { certificationId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { certification: { cancelLike } } } = queries;

  const { isSuccess: cancelLikeCertificationSuccess, result: cancelLikeCertificationResult } = await requestNonTransactionQuery(cancelLike, [certificationId, id]);

  if (cancelLikeCertificationSuccess) {
    return res.json({
      ...makeSuccessResponse('인증 좋아요 취소 성공'),
    });
  }

  return res.status(500).send(`cancelLikeCertificationResult Error: ${cancelLikeCertificationResult.message}`);
};

exports.createCertificationComment = async (req, res) => {
  const { verifiedToken: { id }, params: { certificationId }, body: { content, parentId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { certification: { comment: { insert } } } } = queries;

  const { isSuccess: createCommentSuccess, result: createCommentResult } = await requestNonTransactionQuery(insert, [content, parentId, certificationId, id]);

  if (createCommentSuccess) {
    return res.json({
      ...makeSuccessResponse('인증 댓글 작성 성공'),
    });
  }

  return res.status(500).send(`createCommentResult Error: ${createCommentResult.message}`);
};

exports.deleteCertificationComment = async (req, res) => {
  const { params: { commentId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { certification: { comment: { remove } } } } = queries;

  const { isSuccess: deleteCommentSuccess, result: deleteCommentResult } = await requestNonTransactionQuery(remove, [commentId]);

  if (deleteCommentSuccess) {
    return res.json({
      ...makeSuccessResponse('인증 댓글 삭제 성공'),
    });
  }

  return res.status(500).send(`deleteCommentResult Error: ${deleteCommentResult.message}`);
};

exports.deleteCertification = async (req, res) => {
  const { params: { certificationId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { certification: { remove } } } = queries;

  const { isSuccess: deleteCertificationSuccess, result: deleteCertificationResult } = await requestNonTransactionQuery(remove, [certificationId]);

  if (deleteCertificationSuccess) {
    return res.json({
      ...makeSuccessResponse('인증 삭제 성공'),
    });
  }

  return res.status(500).send(`deleteCertificationResult Error: ${deleteCertificationResult.message}`);
};
