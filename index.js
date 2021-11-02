const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("./dbConnectExec.js");

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
