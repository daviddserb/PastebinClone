const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const dt = require('../public/javascripts/pasteCreatedDate');
const datefns = require('date-fns');

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
  'dateExpired DATETIME' +
  ')', (err) => {
  if (err) {
    throw err;
  } else {
    console.log("table created in the database");
  }
});

//User's pastes (All the pastes)
router.get('/', (req, res) => {
  selectDataFromDatabase(res);
});

//Create Member
router.post('/', (req, res) => {
  let expireTime = req.body.expireTimeName;
  let inputText = req.body.inputTextName;

  //Insert data in the database
  connection.query("INSERT INTO users(text, dateAdded)" +
    "VALUES ('"+ inputText +"', '"+ dt.createdDate() +"')", (err) => {
    if (err) {
      throw err;
    } else {
      console.log("inserted into the database");
    }
  });

  if (expireTime != "never") {
    connection.query(`UPDATE users SET dateExpired = '${calculateExpirationDate(expireTime)}' WHERE dateAdded = '${dt.createdDate()}'`, (err) => { //sa aflu cum sa iau id-ul
      if (err) {
        throw err;
      } else {
        console.log("database updated");
      }
    });
  }
  //Select data from the database and print it on the web page
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

//Update get -> select the text
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
        deletePaste(sqlDelete);
        res.redirect('/error');
      } else {
        res.render('usersUpdate', {userPaste: data[0], userNr: userId});
      }
    }
  });
});

//Update post -> edit the text and save it
router.post('/edit/:id', function(req, res) {
  let userId = req.params.id;
  let updateText = req.body.newText;
  let sql = `UPDATE users SET text = '${updateText}' WHERE id = ${userId}`;
  connection.query(sql, [updateText, userId], function(err) {
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
  deletePaste(sql);
  res.redirect('/users');
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

function deletePaste(sql) {
  connection.query(sql, function(err) {
    if (err) {
      throw err;
    } else {
      console.log("paste deleted");
    }
  });
}

function calculateExpirationDate(expireTime) {
  let dateInLocalTime = new Date(new Date() + 'UTC');
  if (expireTime == "1Min") {
    var expirationDate = datefns.addMinutes(dateInLocalTime, 1);
  } else if (expireTime == "1H") {
    var expirationDate = datefns.addHours(dateInLocalTime, 1);
  } else if (expireTime == "1D") {
    var expirationDate = datefns.addDays(dateInLocalTime, 1);
  } else if (expireTime == "1W") {
    var expirationDate = datefns.addWeeks(dateInLocalTime, 1);
  } else if (expireTime == "1Mon") {
    var expirationDate = datefns.addMonths(dateInLocalTime, 1);
  } else {
    var expirationDate = datefns.addYears(dateInLocalTime, 1);
  }
  let expirationDateFormatted = expirationDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');
  return expirationDateFormatted;
}

module.exports = router;
