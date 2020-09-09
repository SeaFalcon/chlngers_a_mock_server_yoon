const challenge = require('../controllers/challengeController');

const jwtMiddleware = require('../../../config/jwtMiddleware');

const validation = require('../validation/validation');

module.exports = (app) => {
  // 탐색 페이지 조회
  app.get('/challenges', jwtMiddleware, challenge.getChallenges);

  // 챌린지 상세보기
  app.get(
    '/challenge/:challengeId',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    challenge.getChallengeDetail,
  );

  // 챌린지 참여하기
  app.post(
    '/challenge/:challengeId/participation',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    validation.challengeValidation.participate,
    challenge.participateChallenge,
  );

  // 인증 페이지 조회
  app.get(
    '/certifications',
    jwtMiddleware,
    challenge.getPossibleCertification,
  );

  // 인증하기
  app.post(
    '/challenge/:challengeId/certification',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    challenge.certificateChallenge,
  );

  // 탐색페이지 카테고리 더보기
  app.get(
    '/challenges/subject/:subjectId',
    validation.challengeValidation.check.subjectId,
    challenge.getChallengesBySubject,
  );

  // 관심 챌린지
  app.get(
    '/user/interest-challenges',
    jwtMiddleware,
    challenge.getInterestChallenges,
  );
  app.post(
    '/user/interest-challenge/:challengeId',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    validation.userValidation.interestChallenge.exist,
    challenge.addInterestChallenge,
  );
  app.delete(
    '/user/interest-challenge/:challengeId',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    validation.userValidation.interestChallenge.notExist,
    challenge.deleteInterestChallenges,
  );

  // 관심 분야
  app.get(
    '/user/interest-tags',
    jwtMiddleware,
    challenge.getInterestTags,
  );
  app.post(
    '/user/interest-tag/:tagId',
    jwtMiddleware,
    validation.userValidation.interestField.checkId,
    validation.userValidation.interestField.exist,
    challenge.addInterestTag,
  );
  app.delete(
    '/user/interest-tag/:tagId',
    jwtMiddleware,
    validation.userValidation.interestField.checkId,
    validation.userValidation.interestField.notExist,
    challenge.deleteInterestTag,
  );

  // 개설 페이지 챌린지들 조회 (내가 개설한 챌린지 포함)

  // 챌린지 개설

  // 챌린지 삭제

  // 챌린지 수정 (여러가지)

  // 챌린지 리뷰

  // 챌린지

  // 인증 좋아요 / 취소

  // 인증의 댓글

  // 인증 댓글 수정

  // 인증 댓글 삭제
};
