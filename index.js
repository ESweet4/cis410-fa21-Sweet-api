const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("./dbConnectExec.js");
const APIConfig = require("./config.js");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/authenticate");

const app = express();

app.use(express.json());

app.listen(5000, () => {
  console.log("app is running on port 5000");
});

app.get("/hi", (req, res) => {
  res.send("hello world");
});

app.get("/", (req, res) => {
  res.send("API is running");
});

// app.post()
// app.put()

app.post("/orders", auth, async (req, res) => {
  try {
    let itemFK = req.body.itemFK;
    let quantity = req.body.quantity;
    // will find customerFk later

    if (!itemFK || !quantity || !Number.isInteger(quantity)) {
      return res.status(400).send("bad request");
    }
    // console.log("My Order: ", itemFK, quantity);
    // console.log("Here is the customer: ", req.customer);

    let insertQuery = `INSERT INTO [Order](ItemFK, Quantity, CustomerFK)
    OUTPUT inserted.ItemFK, inserted.OrderPK, inserted.Quantity
    VALUES ('${itemFK}', '${quantity}', ${req.customer.CustomerPK})`;

    let insertedOrder = await db.executeQuery(insertQuery);
    // console.log("Inserted Order: ", insertedOrder);
    res.status(201).send(insertedOrder[0]);

    res.send("here is the response");
  } catch (err) {
    console.log("error in POST /orders", err);
    res.status(500).send();
  }
});

app.get("/contacts/me", auth, (req, res) => {
  res.send(req.customer);
});

app.post("/contacts/login", async (req, res) => {
  // console.log("/contacts/login called", req.body);

  // 1. data validation
  let email = req.body.email;
  let password = req.body.password;

  if (!email || !password) {
    res.status(400).send("Bad Request");
  }
  // 2. Check user exists in databse
  let query = `SELECT * 
  FROM Customer
  WHERE email = '${email}'`;

  let result;
  try {
    result = await db.executeQuery(query);
  } catch (myError) {
    console.log("error in /contacts/login", myError);
    return res.status(500).send();
  }
  // console.log("result", result);

  if (!result[0]) {
    return res.status(401).send("Invalid User Credentials");
  }

  // 3. Check user password

  let user = result[0];

  if (!bcrypt.compareSync(password, user.Password)) {
    console.log("invalid password");
    return res.status(401).send("Invalid User Credentials");
  }

  // 4. Generate Token

  let token = jwt.sign({ pk: user.CustomerPK }, APIConfig.JWT, {
    expiresIn: "60 minutes",
  });
  // console.log("token", token);

  // 5. save token and database and send response back

  let setTokenQuery = `UPDATE Customer 
  SET token = '${token}' 
  WHERE CustomerPK = ${user.CustomerPK}`;
  try {
    await db.executeQuery(setTokenQuery);

    res.status(200).send({
      token: token,
      user: {
        NameFirst: user.NameFirst,
        NameLast: user.NameLast,
        Email: user.Email,
        CustomerPK: user.CustomerPK,
      },
    });
  } catch (myError) {
    console.log("error in setting user token", myError);
    res.status(500).send();
  }
});

app.post("/contacts", async (req, res) => {
  //   res.send("/contacts called");
  //   console.log("request body", req.body);
  let nameFirst = req.body.nameFirst;
  let nameLast = req.body.nameLast;
  let email = req.body.email;
  let password = req.body.password;

  if (!nameFirst || !nameLast || !email || !password) {
    return res.status(400).send("Bad Request");
  }

  nameFirst = nameFirst.replace("'", "''");
  nameLast = nameLast.replace("'", "''");

  let emailCheckQuery = `SELECT email 
    FROM Customer
    WHERE email = '${email}'`;

  let existingUser = await db.executeQuery(emailCheckQuery);

  //   console.log("existing user", existingUser);
  if (existingUser[0]) {
    return res.status(409).send("Duplicate email");
  }

  let hashedPassword = bcrypt.hashSync(password);

  let insertQuery = `INSERT INTO Customer(NameFirst, NameLast, Email, Password)
   VALUES('${nameFirst}','${nameLast}','${email}','${hashedPassword}')`;

  db.executeQuery(insertQuery)
    .then(() => {
      res.status(201).send();
    })
    .catch((err) => {
      console.log("Error in POST /contact,", err);
      res.status(500).send();
    });
});

app.get("/items", (req, res) => {
  // get data from the database
  db.executeQuery(
    `SELECT *
  FROM Item
  Left Join Category
  on Category.CategoryPK = Item.CategoryFK`
  )
    .then((theResults) => {
      res.status(200).send(theResults);
    })
    .catch((myError) => {
      console.log(myError);
      res.status(500).send();
    });
});

app.get("/items/:pk", (req, res) => {
  let pk = req.params.pk;
  //   console.log(pk);

  let myQuery = `SELECT *
    FROM Item
    Left Join Category
    on Category.CategoryPK = Item.CategoryFK
    WHERE ItemPK = ${pk}`;

  db.executeQuery(myQuery)
    .then((result) => {
      // console.log("result", result);
      if (result[0]) {
        res.send(result[0]);
      } else {
        res.status(404).send(`bad request`);
      }
    })
    .catch((err) => {
      console.log("Error in /items/:pk", err);
      res.status(500).send();
    });
});
