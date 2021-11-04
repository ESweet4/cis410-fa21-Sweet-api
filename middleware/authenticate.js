const jwt = require("jsonwebtoken");
const APIConfig = require("../config.js");
const db = require("../dbConnectExec.js");
const auth = async (req, res, next) => {
  //   console.log("in the middleware", req.header("Authorization"));
  //   next();

  try {
    // 1. decode token
    let myToken = req.header("Authorization").replace("Bearer ", "");
    // console.log("token", myToken);

    let decoded = jwt.verify(myToken, APIConfig.JWT);
    console.log(decoded);

    let customerPK = decoded.pk;

    // 2. compare token with database

    let query = `SELECT CustomerPK, NameFirst, NameLast, Email 
    FROM Customer
    WHERE CustomerPK = ${customerPK} and token = '${myToken}'`;

    let returnedUser = await db.executeQuery(query);
    console.log("returned user: ", returnedUser);

    // 3. save user information in request
    if (returnedUser[0]) {
      req.customer = returnedUser[0];
      next();
    } else {
      return res.status(401).send("Invalid credentials");
    }
  } catch (err) {
    console.log(err);
    return res.status(401).send("invalid credentials");
  }
};

module.exports = auth;
