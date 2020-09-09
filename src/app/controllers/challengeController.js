const { requestNonTransactionQuery, requestTransactionQuery, transaction } = require('../../../config/database');

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

  if (!subjectSuccess) return res.status(500).send(`Error: ${subjects.message}`);
  if (!allChallengeSuccess) return res.status(500).send(`Error: ${allChallenges.message}`);
  if (!CumulativeParticipationSuccess) return res.status(500).send(`Error: ${CumulativeParticipations.message}`);
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

  if (!detailSuccess) return res.status(500).send(`Error: ${detailResult.message}`);
  if (!certificationSuccess) return res.status(500).send(`Error: ${certificationsResult.message}`);
  if (!impossibleSuccess) return res.status(500).send(`Error: ${impossiblesResult.message}`);
  if (!reviewSuccess) return res.status(500).send(`Error: ${reviewsResult.message}`);
};

exports.participateChallenge = async (req, res) => {
  const { verifiedToken: { id }, params: { challengeId }, body: { money } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { participate } } = queries;

  const { isSuccess: participationSuccess, result: participationResult } = await requestTransactionQuery(participate, [challengeId, id, money]);

  if (participationSuccess) {
    return res.json({
      ...makeSuccessResponse('챌린지 참가 성공'),
    });
  }

  return res.status(500).send(`Error: ${participationResult.message}`);
};

exports.getPossibleCertification = async (req, res) => {
  const { verifiedToken: { id } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { possibleCertification } } = queries;

  const { isSuccess: possibleCertificationSuccess, result: possibleCertificationResult } = await requestTransactionQuery(possibleCertification, [id, id]);

  if (possibleCertificationSuccess) {
    return res.json({
      possibleCertificationResult,
      ...makeSuccessResponse('인증 페이지 조회 성공'),
    });
  }

  return res.status(500).send(`Error: ${possibleCertificationResult.message}`);
};

exports.certificateChallenge = async (req, res) => {
  const { verifiedToken: { id }, params: { challengeId }, body: { photoUrl, content } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { certificate } } = queries;

  const { isSuccess: certificateSuccess, result: certificateResult } = await requestTransactionQuery(certificate, [id, challengeId, photoUrl, (content || '')]);

  if (certificateSuccess) {
    return res.json({
      ...makeSuccessResponse('챌린지 인증 성공'),
    });
  }

  return res.status(500).send(`Error: ${certificateResult.message}`);
};

exports.getChallengesBySubject = async (req, res) => {
  const { params: { subjectId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { challengeBySubjectId } } = queries;

  const { isSuccess: challengeBySubjectSuccess, result: challengeBySubjectResult } = await requestTransactionQuery(challengeBySubjectId, [subjectId]);

  if (challengeBySubjectSuccess) {
    return res.json({
      challengeBySubjectResult,
      ...makeSuccessResponse('카테고리 별 챌린지 조회 성공'),
    });
  }

  return res.status(500).send(`Error: ${challengeBySubjectResult.message}`);
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

  return res.status(500).send(`Error: ${interestChallengeResult.message}`);
};

exports.addInterestChallenge = async (req, res) => {
  const { verifiedToken: { id }, params: { challengeId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { user: { interestChallenge: { add } } } = queries;

  const { isSuccess, result } = await requestNonTransactionQuery(add, [id, challengeId]);

  if (isSuccess) {
    return res.json({
      ...makeSuccessResponse('관심 챌린지 추가 성공'),
    });
  }

  return res.status(500).send(`Error: ${result.message}`);
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

  return res.status(500).send(`Error: ${result.message}`);
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

  return res.status(500).send(`Error: ${interestTagResult.message}`);
};

exports.addInterestTag = async (req, res) => {
  const { verifiedToken: { id }, params: { tagId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { user: { interestField: { add } } } = queries;

  const { isSuccess, result } = await requestNonTransactionQuery(add, [id, tagId]);

  if (isSuccess) {
    return res.json({
      ...makeSuccessResponse('관심분야 팔로우 성공'),
    });
  }

  return res.status(500).send(`Error: ${result.message}`);
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

  return res.status(500).send(`Error: ${result.message}`);
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

  if (!interestFieldSuccess) return res.status(500).send(`Error: ${interestFieldResult.message}`);
  if (!myChallengeSuccess) return res.status(500).send(`Error: ${myChallengeResult.message}`);
  if (!challengeByTagSuccess) return res.status(500).send(`Error: ${challengeByTagResult.message}`);
  if (!hashTagSuccess) return res.status(500).send(`Error: ${hashTagResult.message}`);
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

  if (!availableDayOfWeekSuccess) return res.status(500).send(`Error: ${availableDayOfWeekResult.message}`);
  if (!frequencySuccess) return res.status(500).send(`Error: ${frequencyResult.message}`);
  if (!subjectSuccess) return res.status(500).send(`Error: ${subjectResult.message}`);
};

exports.create = async (req, res) => {

};

exports.delete = async (req, res) => {
  const { params: { challengeId } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { challenge: { delete: { challenge: deleteChallenge } } } = queries;

  const { isSuccess: deleteChallengeSuccess, result: deleteChallengeResult } = await requestTransactionQuery(deleteChallenge, [challengeId]);

  console.log(deleteChallenge);

  if (deleteChallengeSuccess) {
    return res.json({
      ...makeSuccessResponse('챌린지 삭제 성공'),
    });
  }

  return res.status(500).send(`Error: ${deleteChallengeResult.message}`);
};

exports.update = {
  image: async (req, res) => {
    const { params: { challengeId }, body: { image: imageUrl } } = req;

    const errors = getValidationResult(req);
    if (!errors.success) {
      return res.status(400).json(errors);
    }

    const { challenge: { update: { image } } } = queries;

    const { isSuccess: updateImageSuccess, result: updateImageResult } = await requestTransactionQuery(image, [imageUrl, challengeId]);

    if (updateImageSuccess) {
      return res.json({
        ...makeSuccessResponse('챌린지 이미지 수정 성공'),
      });
    }

    return res.status(500).send(`Error: ${updateImageResult.message}`);
  },
  title: async (req, res) => {
    const { params: { challengeId }, body: { title: challengeTitle } } = req;

    const errors = getValidationResult(req);
    if (!errors.success) {
      return res.status(400).json(errors);
    }

    const { challenge: { update: { title } } } = queries;

    const { isSuccess: updateTitleSuccess, result: updateTitleResult } = await requestTransactionQuery(title, [challengeTitle, challengeId]);

    if (updateTitleSuccess) {
      return res.json({
        ...makeSuccessResponse('챌린지 제목 수정 성공'),
      });
    }

    return res.status(500).send(`Error: ${updateTitleResult.message}`);
  },
  hashtag: async (req, res) => {
    const { params: { challengeId }, body: { hashTag } } = req;

    const errors = getValidationResult(req);
    if (!errors.success) {
      return res.status(400).json(errors);
    }

    const { challenge: { select: { hashtag: selectHashTag }, insert: { hashtag: insertHashTag, challengetag: insertChallengeTag }, delete: { hashtag: deleteHashTag } } } = queries;

    const transactionResult = transaction(async () => {
      await requestTransactionQuery(deleteHashTag, [challengeId]);

      hashTag.forEach(async (tag) => {
        const { result: hashTagResult } = await requestNonTransactionQuery(selectHashTag, [tag]);
        if (!hashTagResult[0]) {
          const { result: { insertId } } = await requestTransactionQuery(insertHashTag, [tag]);
          await requestTransactionQuery(insertChallengeTag, [challengeId, insertId]);
        } else {
          await requestTransactionQuery(insertChallengeTag, [challengeId, hashTagResult[0].tagId]);
        }
      });
    });

    if (transactionResult) {
      return res.json({
        ...makeSuccessResponse('챌린지 태그 수정 성공'),
      });
    }

    return res.status(500).send('Error: Transaction Failed');
  },
  example: async (req, res) => {
    const { params: { challengeId }, body: { goodPhotoUrl, badPhotoUrl } } = req;

    const errors = getValidationResult(req);
    if (!errors.success) {
      return res.status(400).json(errors);
    }

    const { challenge: { update: { example } } } = queries;

    const { isSuccess: exampleSuccess, result: exampleResult } = await requestTransactionQuery(example, [goodPhotoUrl, badPhotoUrl, challengeId]);

    if (exampleSuccess) {
      return res.json({
        ...makeSuccessResponse('챌린지 예시 수정 성공'),
      });
    }

    return res.status(500).send(`Error: ${exampleResult.message}`);
  },
  introduction: async (req, res) => {
    const { params: { challengeId }, body: { introduction: challengeIntroduction } } = req;

    const errors = getValidationResult(req);
    if (!errors.success) {
      return res.status(400).json(errors);
    }

    const { challenge: { update: { introduction } } } = queries;

    const { isSuccess: updateIntroductionSuccess, result: updateIntroductionResult } = await requestTransactionQuery(introduction, [challengeIntroduction, challengeId]);

    if (updateIntroductionSuccess) {
      return res.json({
        ...makeSuccessResponse('챌린지 소개 수정 성공'),
      });
    }

    return res.status(500).send(`Error: ${updateIntroductionResult.message}`);
  },
};

exports.createReview = async (req, res) => {

};

exports.likeCertification = async (req, res) => {

};

exports.cancelLikeCertification = async (req, res) => {

};

exports.createCertificationComment = async (req, res) => {

};

exports.deleteCertificationComment = async (req, res) => {

};
