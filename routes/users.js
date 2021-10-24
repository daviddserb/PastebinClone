const express = require('express');
const mysql = require('mysql');
const router = express.Router();

//Create the connection to the database
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "test_db",
  port: "3306"
})

//Connect to the database
connection.connect((err) => {
  if (err) {
    throw err;
  } else {
    console.log("connected to the database");
  }
})

//Create the table in the database
connection.query('CREATE TABLE IF NOT EXISTS users(id INT(255) UNSIGNED AUTO_INCREMENT PRIMARY KEY, text VARCHAR(255) NOT NULL)', (err) => {
  if (err) {
    throw err;
  } else {
    console.log("table created in the database");
  }
})

//User page (all the pastes)
router.get('/', (req, res) => {
  //Select all data from the database and use it on the web page
  connection.query("SELECT * FROM users", function(err, result) {
    if (err) {
      throw err;
    } else {
     res.render('usersPastes', {allPastes: result});
    }
  });
})

//Create Member
router.post('/', (req, res) => {
  //Insert the form informations from the web page, into the database
  connection.query("INSERT INTO users(text) VALUES ('"+ req.body.inputText +"')", (err) => {
    if (err) {
      throw err;
    } else {
      console.log("inserted into the database");
    }
  });

  //Select all data from the database and use it on the web page. ?: cod repetitiv de la linia 35-41 (CUM FAC SA SCAP)
  connection.query("SELECT * FROM users", function(err, result) {
    if (err) {
      throw err;
    } else {
      res.render('usersPastes', {allPastes: result});
    }
  });
});

//Update get
router.get('/edit/:id', function(req, res) {
  var userId = req.params.id; //take the user id this way because the line above has /:id
  var sql = `SELECT * FROM users WHERE id = ${userId}`;
  connection.query(sql, function(err, data) {
    if (err) {
      throw err;
    } else {
      res.render('usersUpdate', {userPaste: data[0], userNr: userId});
    }
  });
});

//Update post
router.post('/edit/:id', function(req, res) {
  var userId = req.params.id;
  var updateData = req.body.newText;
  var sql = `UPDATE users SET text = '${updateData}' WHERE id = ${userId}`;
  connection.query(sql, [updateData, userId], function(err, data) { //?: de ce updateData si userId sunt trimise in [] si sql nu (ca exemplu)
    if (err) {
      throw err;
    } else {
      res.redirect('/users');
    }
  });
})

//Delete
router.get('/delete/:id', function(req, res) {
  var userId = req.params.id;
  var sql = `DELETE FROM users WHERE id = ${userId}`;
  connection.query(sql, function(err, data) {
    if (err) {
      throw err;
    } else {
      res.redirect('/users');
    }
  });
});

module.exports = router;