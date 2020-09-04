const mysql = require('mysql2/promise');

const { logger } = require('./winston');

const { mysqlConfig } = require('./secret');

const pool = mysql.createPool(mysqlConfig);

const requestNonTransactionQuery = async (sql, params) => {
  try {
    const connection = await singletonDBConnection.getInstance();
    // const connection = await pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await connection.query(sql, params);
      connection.release();
      return rows;
    } catch (err) {
      logger.error(`example non transaction Query error\n: ${JSON.stringify(err)}`);
      connection.release();
      return false;
    }
  } catch (err) {
    logger.error(`example non transaction DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
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
      return rows;
    } catch (err) {
      await connection.rollback(); // ROLLBACK
      connection.release();
      logger.error(`example transaction Query error\n: ${JSON.stringify(err)}`);
      return false;
    }
  } catch (err) {
    logger.error(`example transaction DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
  }
};

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
      if (!instance) {
        instance = await init();
      }
      return instance;
    },
  };
}());

module.exports = {
  pool,
  requestNonTransactionQuery,
  requestTransactionQuery,
  singletonDBConnection,
};
