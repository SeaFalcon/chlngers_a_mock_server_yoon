const { getValidationResult, makeSuccessResponse } = require('../utils/function');

const { requestNonTransactionQuery } = require('../../../config/database');

const queries = require('../utils/queries');

exports.getFeed = async (req, res) => {
  const { verifiedToken: { id } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { feed: { getAll, getCurrentMe, getFollow } } = queries;

  const { isSuccess: allChallengeSuccess, result: allChallengeResult } = await requestNonTransactionQuery(getAll, [0]);
  const { isSuccess: currentMeSuccess, result: currentMeResult } = await requestNonTransactionQuery(getCurrentMe, [id, 0]);
  const { isSuccess: followSuccess, result: followResult } = await requestNonTransactionQuery(getFollow, [id, 0]);

  if (allChallengeSuccess && currentMeSuccess && followSuccess) {
    return res.json({
      allChallengeResult,
      currentMeResult,
      followResult,
      ...makeSuccessResponse('피드 페이지 조회 성공'),
    });
  }

  if (!allChallengeSuccess) return res.status(500).send(`Error: ${allChallengeResult.message}`);
  if (!currentMeSuccess) return res.status(500).send(`Error: ${currentMeResult.message}`);
  if (!followSuccess) return res.status(500).send(`Error: ${followResult.message}`);
};

exports.getMoreAllChallenges = async (req, res) => {
  const { query: { page } } = req;

  const pageValue = page || 0;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { feed: { getAll } } = queries;

  const { isSuccess: allChallengeSuccess, result: allChallengeResult } = await requestNonTransactionQuery(getAll, [pageValue <= 0 ? 0 : pageValue * 15]);

  if (allChallengeSuccess) {
    return res.json({
      allChallengeResult,
      ...makeSuccessResponse('전체 챌린지 더보기 조회 성공'),
    });
  }

  if (!allChallengeSuccess) return res.status(500).send(`Error: ${allChallengeResult.message}`);
};

// 팔로우 챌린지 더보기 (페이징)
exports.getMoreFollowChallenges = async (req, res) => {
  const { verifiedToken: { id }, query: { page } } = req;

  const pageValue = page || 0;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { feed: { getFollow } } = queries;

  const { isSuccess: followSuccess, result: followResult } = await requestNonTransactionQuery(getFollow, [id, (pageValue <= 0 ? 0 : pageValue * 15)]);

  if (followSuccess) {
    return res.json({
      followResult,
      ...makeSuccessResponse('팔로우 챌린지 더보기 조회 성공'),
    });
  }

  if (!followSuccess) return res.status(500).send(`Error: ${followResult.message}`);
};
