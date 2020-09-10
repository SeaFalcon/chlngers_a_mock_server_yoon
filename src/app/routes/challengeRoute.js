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
    validation.challengeValidation.participate.money,
    validation.challengeValidation.participate.isExist,
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
    validation.certification.photo,
    validation.certification.existUser,
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
    validation.userValidation.interestChallenge.status,
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
    validation.userValidation.interestChallenge.status,
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
  app.get(
    '/open',
    jwtMiddleware,
    challenge.getOpenPage,
  );

  // 챌린지 개설에 필요한 정보
  app.get(
    '/challenge-conditions',
    jwtMiddleware,
    challenge.needConditions,
  );

  // 챌린지 개설
  app.post(
    '/challenge',
    jwtMiddleware,
    validation.challengeValidation.create,
    challenge.create,
  );

  // 챌린지 삭제
  app.delete(
    '/challenge/:challengeId',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    challenge.delete,
  );

  // 챌린지 수정
  // 대표이미지 설정
  app.patch(
    '/challenge/:challengeId/image',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    validation.challengeValidation.update.image,
    challenge.update.image,
  );
  // 챌린지 제목
  app.patch(
    '/challenge/:challengeId/title',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    validation.challengeValidation.update.title,
    challenge.update.title,
  );
  // 챌린지 태그
  app.patch(
    '/challenge/:challengeId/hashtag',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    validation.challengeValidation.update.hashtag,
    challenge.update.hashtag,
  );
  // 챌린지 인증샷 (좋은, 나쁜)
  app.patch(
    '/challenge/:challengeId/example-photo',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    validation.challengeValidation.update.examplePhotos.goodPhoto,
    validation.challengeValidation.update.examplePhotos.badPhoto,
    challenge.update.example,
  );
  // 챌린지 소개
  app.patch(
    '/challenge/:challengeId/introduction',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    validation.challengeValidation.update.introduction,
    challenge.update.introduction,
  );

  // 챌린지 리뷰
  app.post(
    '/challenge/:challengeId/review',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    validation.certification.review.content,
    validation.certification.review.score,
    validation.certification.review.exist,
    challenge.createReview,
  );

  // 인증 좋아요
  app.post(
    '/certification/:certificationId/like',
    jwtMiddleware,
    validation.userValidation.interestChallenge.status,
    validation.certification.exist,
    validation.certification.like.exist,
    validation.certification.like.notExist,
    challenge.likeCertification,
  );

  // 인증 좋아요 취소
  app.delete(
    '/certification/:certificationId/like',
    jwtMiddleware,
    validation.certification.exist,
    validation.certification.like.notExist,
    challenge.cancelLikeCertification,
  );

  // 인증의 댓글 작성
  app.post(
    '/certification/:certificationId/comment',
    jwtMiddleware,
    validation.certification.exist,
    validation.certification.comment.content,
    validation.certification.comment.parentId,
    challenge.createCertificationComment,
  );

  // 인증 댓글 삭제
  app.delete(
    '/certification/:certificationId/comment/:commentId',
    jwtMiddleware,
    validation.certification.exist,
    validation.certification.comment.exist,
    challenge.deleteCertificationComment,
  );

  // 인증 삭제
  app.delete(
    '/certification/:certificationId',
    jwtMiddleware,
    validation.certification.exist,
    validation.certification.removePossible,
    challenge.deleteCertification,
  );
};
