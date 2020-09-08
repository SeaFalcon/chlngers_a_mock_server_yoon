const mysql = require('mysql2/promise');

const { logger } = require('./winston');

const { mysqlConfig } = require('./secret');

const pool = mysql.createPool(mysqlConfig);

const singletonDBConnection = (function getSingletonDBConnection() {
  let instance;
  async function init() {
    try {
      // throw new Error('db connection error!!');
      const connection = await pool.getConnection(async (conn) => conn);
      return connection;
    } catch (err) {
      logger.error(`App - SignUp DB Connection error\n: ${err.message}`);
      return err.message;
    }
  }
  return {
    async getInstance() {
      if (!instance || instance.state === 'disconnected') {
        instance = await init();
      }
      return instance;
    },
  };
}());

const requestNonTransactionQuery = async (sql, params) => {
  try {
    const connection = await singletonDBConnection.getInstance();
    // const connection = await pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await connection.query(sql, params);
      connection.release();
      return { isSuccess: true, result: rows };
    } catch (err) {
      logger.error(`example non transaction Query error\n: ${JSON.stringify(err)}`);
      connection.release();
      return { isSuccess: false, result: err };
    }
  } catch (err) {
    logger.error(`example non transaction DB Connection error\n: ${JSON.stringify(err)}`);
    return { isSuccess: false, result: err };
  }
};

const requestTransactionQuery = async (sql, params) => {
  try {
    const connection = await singletonDBConnection.getInstance();
    // const connection = await pool.getConnection(async (conn) => conn);
    try {
      await connection.beginTransaction(); // START TRANSACTION
      const [rows] = await connection.query(sql, params);
      await connection.commit(); // COMMIT
      connection.release();
      return { isSuccess: true, result: rows };
    } catch (err) {
      await connection.rollback(); // ROLLBACK
      connection.release();
      logger.error(`example transaction Query error\n: ${JSON.stringify(err)}`);
      return { isSuccess: false, result: err };
    }
  } catch (err) {
    logger.error(`example transaction DB Connection error\n: ${JSON.stringify(err)}`);
    return { isSuccess: false, result: err };
  }
};

//

let mysqlPool;

async function getMysqlPool() {
  if (!mysqlPool) {
    mysqlPool = await mysql.createPool(mysqlConfig);
    return mysqlPool;
  }
  return mysqlPool;
}

async function query(...args) {
  const queryText = args[0];
  const data = args[1];
  await getMysqlPool();
  const connection = await mysqlPool.getConnection();
  const result = (await connection.query(queryText, data)) || null;
  connection.release();
  return result;
}

async function transaction(...args) {
  await getMysqlPool();
  const connection = await mysqlPool.getConnection();
  try {
    await connection.beginTransaction();
    await args[0](connection);
    await connection.commit();
    connection.release();
    return 'success';
  } catch (error) {
    console.log(error);
    await connection.rollback();
    connection.release();
    return 'fail';
  } finally {
    connection.release();
  }
}

async function startTransaction(...args) {
  await getMysqlPool();
  const connection = await mysqlPool.getConnection();
  let status = 'fail';
  try {
    await connection.beginTransaction();
    await args[0](connection);
    status = 'success';
  } catch (error) {
    console.log(error);
  } return { connection, status };
}

module.exports = {
  pool,
  requestNonTransactionQuery,
  requestTransactionQuery,
  singletonDBConnection,
  transaction,
  query,
  startTransaction,
};
