const { requestNonTransactionQuery } = require('../../../config/database');

const queries = require('../utils/queries');

const { shuffleArray, makeSuccessResponse } = require('../utils/function');

exports.getChallenges = async (req, res) => {
  const { verifiedToken: { id } } = req;

  const {
    search: {
      getChallenges, subject: getSubjects, // random, limit,
    },
  } = queries;

  // const { isSuccess: recommendSuccess, result: recommends } = await requestNonTransactionQuery(getChallenges + random + limit, [id, 0, 6]);
  const { isSuccess: subjectSuccess, result: subjects } = await requestNonTransactionQuery(getSubjects);
  const { isSuccess: allChallengeSuccess, result: allChallenges } = await requestNonTransactionQuery(getChallenges, [id]);
  // const { isSuccess: popularSuccess, result: populars } = await requestNonTransactionQuery(getChallenges + random + limit, [id, 0, 9]);

  const recommendResult = {
    subject: '추천',
    challenges: shuffleArray([...allChallenges]).slice(0, 6),
  };

  const subjectResult = subjects.map((subject) => ({
    subject: subject.subjectName,
    challenges: allChallenges.filter((challenge) => challenge.subjectName === subject.subjectName),
  }));

  const challenges = {
    search: [...subjectResult, recommendResult],
    popular: [
      {
        gender: 'man',
        challenges: {
          '10s': shuffleArray([...allChallenges]).slice(0, 9),
          '20s': shuffleArray([...allChallenges]).slice(0, 9),
          '30s': shuffleArray([...allChallenges]).slice(0, 9),
          '40s': shuffleArray([...allChallenges]).slice(0, 9),
        },
      },
      {
        gender: 'woman',
        challenges: {
          '10s': shuffleArray([...allChallenges]).slice(0, 9),
          '20s': shuffleArray([...allChallenges]).slice(0, 9),
          '30s': shuffleArray([...allChallenges]).slice(0, 9),
          '40s': shuffleArray([...allChallenges]).slice(0, 9),
        },
      },
    ],
  };

  if (subjectSuccess && allChallengeSuccess) return res.json({ ...challenges, ...makeSuccessResponse('탐색페이지 조회 성공') });

  if (!subjectSuccess) return res.status(500).send(`Error: ${subjects.message}`);
  if (!allChallengeSuccess) return res.status(500).send(`Error: ${allChallenges.message}`);
};
