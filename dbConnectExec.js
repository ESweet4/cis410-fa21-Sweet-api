const sql = require("mssql");

const APIConfig = require("./config.js");

const config = {
  user: APIConfig.DB.user,
  password: APIConfig.DB.password,
  server: APIConfig.DB.server,
  database: APIConfig.DB.databse,
};

async function executeQuery(aQuery) {
  let connection = await sql.connect(config);
  let result = await connection.query(aQuery);

  //   console.log(result);
  return result.recordset;
}

// executeQuery(`SELECT *
// FROM Item
// Left Join Category
// on Category.CategoryPK = Item.CategoryFK`);

module.exports = { executeQuery: executeQuery };
