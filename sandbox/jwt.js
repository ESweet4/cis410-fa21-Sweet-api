const jwt = require("jsonwebtoken");

let myToken = jwt.sign({ pk: 23454 }, "secretPassword", {
  expiresIn: "0 minutes",
});
console.log("my token", myToken);

let verificationTest = jwt.verify(myToken, "secretPassword");
console.log("verification test", verificationTest);
