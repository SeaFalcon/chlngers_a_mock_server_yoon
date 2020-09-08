const search = require('../controllers/searchController');

const jwtMiddleware = require('../../../config/jwtMiddleware');

const validation = require('../validation/validation');

module.exports = (app) => {
  // 탐색 페이지 조회
  app.get('/challenges', jwtMiddleware, search.getChallenges);

  // 챌린지 상세보기
  app.get(
    '/challenge/:challengeId',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    search.getChallengeDetail
  );

  // 챌린지 참여하기
  app.post(
    '/challenge/:challengeId/participation',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    validation.challengeValidation.participate,
    search.participateChallenge
  )

  // 인증 페이지 조회
  app.get(
    '/certifications',
    jwtMiddleware,
    search.getPossibleCertification
  );

  // 인증하기
  app.post(
    '/challenge/:challengeId/certification',
    jwtMiddleware,
    validation.challengeValidation.check.id,
    search.certificateChallenge
  );

  // 탐색페이지 카테고리 더보기 
  app.get(
    `/challenges/subject/:subjectId`,
    validation.challengeValidation.check.subjectId,
    search.getChallengesBySubject
  )

  // // 관심 챌린지
  // app.get('/user/interest')
  // app.post('/')
  // app.delete('/')

  // // 관심 분야
  // app.get('/')
  // app.post('/')
  // app.delete('/')

};
