module.exports = {
  requestQueryResult: async (connection, query, ...params) => {
    const [result] = await connection.query(query, params);
    return result;
  },
  findUserByEmail: async (connection, email) => {
    const selectEmailQuery = `
              SELECT email, name 
              FROM User 
              WHERE email = ?;
              `;
    const selectEmailParams = [email];
    const [emailRows] = await connection.query(selectEmailQuery, selectEmailParams);

    return emailRows;
  },
  findUserByNickname: async (connection, nickname) => {
    const selectNicknameQuery = `
              SELECT email, name 
              FROM User 
              WHERE nickname = ?;
              `;
    const selectNicknameParams = [nickname];
    const [nameRows] = await connection.query(selectNicknameQuery, selectNicknameParams);

    return nameRows;
  },
  findUserInfoByEmail: async (connection, email) => {
    const selectUserInfoQuery = `
                SELECT userId, email, password, nickname, isDeleted, 
                       IFNULL(profileImageUrl, '') as profileImageUrl,
                       IFNULL(introduction, '') as introduction,
                       IFNULL(phoneNumber, '') as phoneNumber
                FROM User 
                WHERE email = ?;
                `;

    const selectUserInfoParams = [email];
    const [userInfoRows] = await connection.query(selectUserInfoQuery, selectUserInfoParams);

    return userInfoRows;
  },
  findUserInfoById: async (connection, id) => {
    const selectUserInfoQuery = `
                SELECT *
                FROM User 
                WHERE userId = ?;
                `;

    const selectUserInfoParams = [id];
    const [userInfoRows] = await connection.query(selectUserInfoQuery, selectUserInfoParams);

    return userInfoRows;
  },
};
