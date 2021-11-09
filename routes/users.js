const express = require('express');
const mysql = require('mysql');
const router = express.Router();
var dt = require('../public/javascripts/pasteCreatedDate');

console.log("_______TESTARE DATE-FNS_______")
console.log(new Date());
let datefns = require('date-fns');
console.log(datefns.addDays(new Date(), 1));

console.log("_______TESTARE RANDOM_______")
//format date save in db: "YYYY-MM-DD hh:mm:ss"
/*var date = new Date(); // DATE IN UTC
console.log(date);
console.log("" + new Date()); //se transforma in string
console.log(new Date().toString()); // Date in local time zone
console.log("--------------------");
console.log(new Date().getHours());
console.log(dt.createdDate());
console.log("######################");
console.log(new Date(date + 'UTC')); //DATE IN LOCAL TIME
console.log(new Date(date + "UTC").toISOString().replace(/T/, ' ').replace(/\..+/, '')); //formatted to be saved in db
console.log("$$$$$$$$$$$$$$$$$$$");
console.log(date.toUTCString()); // Date in UTC time zone
console.log(new Date().toISOString()); // YYYY-MM-DDTHH:mm:ss.sssZ and the time zone is always UTC, as denoted by the suffix Z.
*/

//Create the connection to the database
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "test_db",
  port: "3306"
});

//Connect to the database
connection.connect((err) => {
  if (err) {
    throw err;
  } else {
    console.log("connected to the database");
  }
});

//Create the table in the database
connection.query('CREATE TABLE IF NOT EXISTS users(' + 
  'id INT(255) UNSIGNED AUTO_INCREMENT PRIMARY KEY,' +
  'text VARCHAR(255) NOT NULL,' +
  'dateAdded DATETIME NOT NULL,' +
  'expireMins VARCHAR(255),' +
  'dateExpired DATETIME' +
  ')', (err) => {
  if (err) {
    throw err;
  } else {
    console.log("table created in the database");
  }
});

//User page (All the pastes)
router.get('/', (req, res) => {
  selectDataFromDatabase(res);
});

//Create Member
router.post('/', (req, res) => {
  let expireTimeMinutes = req.body.expireTimeId;
  console.log("dupa cate minute sa se stearga paste-ul= " + req.body.expireTimeId);

  //Insert data in the database
  connection.query("INSERT INTO users(text, dateAdded, expireMins)" +
    "VALUES ('"+ req.body.inputText +"', '"+ dt.createdDate() +"', '"+ expireTimeMinutes +"')", (err) => {
      if (err) {
        throw err;
      } else {
        console.log("inserted into the database");
      }
    });

  if (expireTimeMinutes != "never") {
    //Update the expired date in the database
    connection.query(`UPDATE users SET dateExpired = '${calculateExpirationDate(expireTimeMinutes)}' WHERE dateAdded = '${dt.createdDate()}'`, (err) => {
      if (err) {
        throw err;
      } else {
        console.log("dateExpired updated in the database");
      }
    });
  }
  //Select the data from db and show it on a web page
  selectDataFromDatabase(res);
});

//Create Event to delete pastes after a period of time
connection.query("ALTER EVENT deletePastesAfterTime" + 
  " ON SCHEDULE EVERY 1 HOUR ENABLE" +
  " DO" + 
  " DELETE FROM users" +
  " WHERE `dateExpired` < CURRENT_TIMESTAMP;"
);

//connection.query("DROP EVENT deletePastesAfterTime"); //delete event

//Update get (change the text)
router.get('/edit/:id', function(req, res) {
  let userId = req.params.id; //take the user id this way because the line above has /:id
  let sqlSelect = `SELECT * FROM users WHERE id = ${userId}`;
  connection.query(sqlSelect, function(err, data) {
    if (err) {
      throw err;
    } else {
      //check if the paste date is expired
      if (data[0].dateExpired < new Date() && data[0].dateExpired != null) {
        let sqlDelete = `DELETE FROM users WHERE id = ${userId}`;
        let errorHandler = "yes";
        deletePastes(res, sqlDelete, errorHandler)
      } else {
        res.render('usersUpdate', {userPaste: data[0], userNr: userId});
      }
    }
  });
});

//Update post (save and post the new text)
router.post('/edit/:id', function(req, res) {
  let userId = req.params.id;
  let updateData = req.body.newText;
  let sql = `UPDATE users SET text = '${updateData}' WHERE id = ${userId}`;
  connection.query(sql, [updateData, userId], function(err) {
    if (err) {
      throw err;
    } else {
      res.redirect('/users');
    }
  });
});

//Delete
router.get('/delete/:id', function(req, res) {
  let userId = req.params.id;
  let sql = `DELETE FROM users WHERE id = ${userId}`;
  let errorHandler = "no";
  deletePastes(res, sql, errorHandler)
});

//Select all the data from the database and print it on the web page
function selectDataFromDatabase(res) {
  connection.query("SELECT * FROM users", function(err, result) {
    if (err) {
      throw err;
    } else {
     res.render('usersPastes', {allPastes: result});
    }
  });
}

function deletePastes(res, sql, errorHandler) {
  console.log("paste deleted because it's expired");
  connection.query(sql, function(err) {
    if (err) {
      throw err;
    } else if (errorHandler == "yes") { //delete paste because it's expired
      //res.render('error'); //mai trebuie sa lucrez la eroare, sa ii dau mesaj ca paste-ul ii expirat, ceva de genul
      res.redirect('/error'); //sau las asa ca si aici, cu redirect
    } else { //delete the paste because the Delete button was clicked
      res.redirect('/users');
    }
  });
}

function calculateExpirationDate(expireMinutes) {
  let minutes = parseInt(expireMinutes);
  console.log("se intra in functia calculateExpirationDate()");
  let expirationDate = new Date();
  console.log(dt.createdDate());
  let howManyHoursToAdd = 0;
  console.log(expirationDate);
  expirationDate.setMinutes(expirationDate.getMinutes() + minutes);
  console.log(expirationDate);
  while (minutes >= 60) { 
    ++howManyHoursToAdd;
    if (howManyHoursToAdd % 24 == 0) {
      howManyHoursToAdd = 0;
    }
    minutes -= 60;
  }
  console.log("howManyHoursToAdd= " + howManyHoursToAdd);
  let howManyHoursToAddInTotal = howManyHoursToAdd + new Date().getHours();
  var expirationDateFormatted = expirationDate.toISOString().replace(/T../, ' ' + howManyHoursToAddInTotal).replace(/\..+/, ''); //formate the date to put in the the db
  console.log(expirationDateFormatted)
  return expirationDateFormatted;
}

module.exports = router;