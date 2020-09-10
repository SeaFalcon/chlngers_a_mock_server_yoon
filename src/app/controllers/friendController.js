/* eslint-disable no-nested-ternary */
const { getValidationResult, makeSuccessResponse } = require('../utils/function');

const { requestNonTransactionQuery } = require('../../../config/database');

const queries = require('../utils/queries');

exports.getFollower = async (req, res) => {
  const { verifiedToken: { id } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { friend: { follower, recommend } } = queries;

  const { isSuccess: followerSuccess, result: followerResult } = await requestNonTransactionQuery(follower, [id]);
  const { isSuccess: recommendSuccess, result: recommendResult } = await requestNonTransactionQuery(recommend, [id]);

  if (followerSuccess && recommendSuccess) {
    return res.json({
      followerResult,
      recommendResult,
      ...makeSuccessResponse('팔로워 리스트 조회 성공'),
    });
  }

  if (!followerSuccess) return res.status(500).send(`followerResult Error: ${followerResult.message}`);
  if (!recommendSuccess) return res.status(500).send(`recommendResult Error: ${recommendResult.message}`);
};

exports.getFollowing = async (req, res) => {
  const { verifiedToken: { id } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { friend: { following, recommend } } = queries;

  const { isSuccess: followingSuccess, result: followingResult } = await requestNonTransactionQuery(following, [id]);
  const { isSuccess: recommendSuccess, result: recommendResult } = await requestNonTransactionQuery(recommend, [id]);

  console.log(followingResult);

  if (followingSuccess && recommendSuccess) {
    return res.json({
      followingResult,
      recommendResult,
      ...makeSuccessResponse('팔로잉 리스트 조회 성공'),
    });
  }

  if (!followingSuccess) return res.status(500).send(`followingResult Error: ${followingResult.message}`);
  if (!recommendSuccess) return res.status(500).send(`recommendResult Error: ${recommendResult.message}`);
};

exports.requestFollow = async (req, res) => {
  const { verifiedToken: { id: userId1 }, params: { id: userId2 }, body: { status } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { friend: { requestFollow, acceptFollow, deleteFollow } } = queries;

  const { isSuccess: requestFollowSuccess, result: requestFollowResult } = status === 'request'
    ? await requestNonTransactionQuery(requestFollow, [userId1, userId2])
    : status === 'accept'
      ? await requestNonTransactionQuery(acceptFollow, [userId2, userId1])
      : await requestNonTransactionQuery(deleteFollow, [userId1, userId2]);

  if (requestFollowSuccess) {
    return res.json({
      ...makeSuccessResponse(status === 'request'
        ? '팔로우 요청 성공'
        : status === 'accept'
          ? '팔로우 요청 수락 성공'
          : '팔로우 거절 / 삭제 성공'),
    });
  }

  return res.status(500).send(`requestFollowResult Error: ${requestFollowResult.message}`);
};

exports.acceptFollow = async (req, res) => {
  const { verifiedToken: { id: userId1 }, params: { id: userId2 } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { friend: { acceptFollow } } = queries;

  const { isSuccess: acceptFollowSuccess, result: acceptFollowResult } = await requestNonTransactionQuery(acceptFollow, [userId1, userId2]);

  if (acceptFollowSuccess) {
    return res.json({
      ...makeSuccessResponse('팔로우 수락 성공'),
    });
  }

  return res.status(500).send(`acceptFollowResult Error: ${acceptFollowResult.message}`);
};

exports.deleteFollow = async (req, res) => {
  const { verifiedToken: { id: userId1 }, params: { id: userId2 } } = req;

  const errors = getValidationResult(req);
  if (!errors.success) {
    return res.status(400).json(errors);
  }

  const { friend: { deleteFollow } } = queries;

  const { isSuccess: deleteFollowSuccess, result: deleteFollowResult } = await requestNonTransactionQuery(deleteFollow, [userId1, userId2]);

  if (deleteFollowSuccess) {
    return res.json({
      ...makeSuccessResponse('팔로우 거절 / 언팔로우 성공'),
    });
  }

  return res.status(500).send(`deleteFollowResult Error: ${deleteFollowResult.message}`);
};
