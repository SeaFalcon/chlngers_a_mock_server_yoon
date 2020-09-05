const { requestTransactionQuery, requestNonTransactionQuery } = require('../../../config/database');

const { makeSuccessResponse, snsInfo, makeLoginResponse, getValidationResult } = require('../utils/function');

const queries = require('../utils/queries');

exports.getChallenges = async (req, res) => {
  const { isSuccess, result } = await requestNonTransactionQuery(queries.search.all);

  if (isSuccess) {
    return res.json(result);
  }

  return res.status(500).send(`Error: ${result.message}`);
};