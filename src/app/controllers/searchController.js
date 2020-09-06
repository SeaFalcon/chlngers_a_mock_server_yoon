const { requestTransactionQuery, requestNonTransactionQuery } = require('../../../config/database');

const { makeSuccessResponse, snsInfo, makeLoginResponse, getValidationResult } = require('../utils/function');

const queries = require('../utils/queries');

const { shuffleArray } = require('../utils/function');

exports.getChallenges = async (req, res) => {
  const { verifiedToken: { id } } = req;

  const { search: { getChallenges, random, limit, subject } } = queries;

  // const { isSuccess: recommendSuccess, result: recommends } = await requestNonTransactionQuery(getChallenges + random + limit, [id, 0, 6]);
  const { isSuccess: subjectSuccess, result: subjects } = await requestNonTransactionQuery(subject);
  const { isSuccess: allChallengeSuccess, result: allChallenges } = await requestNonTransactionQuery(getChallenges, [id]);
  // const { isSuccess: popularSuccess, result: populars } = await requestNonTransactionQuery(getChallenges + random + limit, [id, 0, 9]);

  const recommendResult = {
    subject: 'recommend',
    challenges: shuffleArray([...allChallenges]).slice(0, 6),
  }

  const subjectResult = subjects.map((subject) => ({
    subject: subject.subjectName,
    challenges: allChallenges.filter((challenge) => challenge.subjectName === subject.subjectName)
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
        }
      },
      {
        gender: 'woman',
        challenges: {
          '10s': shuffleArray([...allChallenges]).slice(0, 9),
          '20s': shuffleArray([...allChallenges]).slice(0, 9),
          '30s': shuffleArray([...allChallenges]).slice(0, 9),
          '40s': shuffleArray([...allChallenges]).slice(0, 9),
        }
      }
    ]
  }

  if (subjectSuccess && allChallengeSuccess) return res.json(challenges);

  if (!subjectSuccess) return res.status(500).send(`Error: ${subjects.message}`);
  if (!allChallengeSuccess) return res.status(500).send(`Error: ${allChallenges.message}`);
};