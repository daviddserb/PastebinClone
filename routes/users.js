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

//User page (all the pastes)
router.get('/', (req, res) => {
  //Select all the data from the database and print it on the web page
  connection.query("SELECT * FROM users", function(err, result) {
    if (err) {
      throw err;
    } else {
     res.render('usersPastes', {allPastes: result});
    }
  });
});

//Create Member
router.post('/', (req, res) => {
  let timeZone = new Date();
  timeZone.setHours(timeZone.getHours() + 2); //!: because of the timezone (need to change daily)
  let pasteDateCreatedFormatted = timeZone.toISOString().replace(/T/, ' ').replace(/\..+/, ''); //formate the date to put in the the db
  console.log(pasteDateCreatedFormatted);
  console.log(req.body.expireTimeId)

  if (req.body.expireTimeId != "never") {
    let expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 2); //!: because of the timezone (need to change daily)
    expirationDate.setMinutes(expirationDate.getMinutes() + parseInt(req.body.expireTimeId));
    let expirationDateFormatted = expirationDate.toISOString().replace(/T/, ' ').replace(/\..+/, ''); //formate the date to put in the the db
    console.log(expirationDateFormatted)

    //Insert the form informations from the web page, into the database
    connection.query("INSERT INTO users(text, dateAdded, expireMins, dateExpired)" +
    "VALUES ('"+ req.body.inputText +"', '"+ pasteDateCreatedFormatted +"', '"+ req.body.expireTimeId +"', '"+ expirationDateFormatted +"')", (err) => {
      if (err) {
        throw err;
      } else {
        console.log("inserted into the database all infos");
      }
    });
  } else {
    connection.query("INSERT INTO users(text, dateAdded, expireMins)" +
    "VALUES ('"+ req.body.inputText +"', '"+ pasteDateCreatedFormatted +"', '"+ req.body.expireTimeId +"')", (err) => {
      if (err) {
        throw err;
      } else {
        console.log("inserted into the database without dateExpired");
      }
    });
  }
  

  //Select all data from the database and use it on the web page
  //?: cod repetitiv cu cel de la user page, pot scapa de el, daca da, cum?
  connection.query("SELECT * FROM users", function(err, result) {
    if (err) {
      throw err;
    } else {
      res.render('usersPastes', {allPastes: result});
    }
  });
});

//Create Event to delete pastes after a period of time
connection.query("ALTER EVENT deletePastesAfterTime" + 
  " ON SCHEDULE EVERY 1 HOUR ENABLE" +
  " DO" + 
  " DELETE FROM users" +
  " WHERE `dateExpired` < CURRENT_TIMESTAMP;"
);
//" WHERE `dateAdded` < CURRENT_TIMESTAMP - INTERVAL + 1 MINUTE;" -> delete after interval 1 minute
//connection.query("DROP EVENT deletePastesAfterTime"); //delete event

//Update get (change the text)
router.get('/edit/:id', function(req, res) {
  var userId = req.params.id; //take the user id this way because the line above has /:id
  var sql = `SELECT * FROM users WHERE id = ${userId}`;
  connection.query(sql, function(err, data) {
    if (err) {
      throw err;
    } else {
      console.log(data[0].dateExpired);
      console.log(new Date());
      //check if the post is expired
      if (data[0].dateExpired < new Date() && data[0].dateExpired != null) {
        console.log("can't be updated because it expired");
        connection.query(`DELETE FROM users WHERE id = ${userId}`);
        res.redirect('/users');
      } else {
        res.render('usersUpdate', {userPaste: data[0], userNr: userId});
      }
    }
  });
});

//Update post (save and post the new text)
router.post('/edit/:id', function(req, res) {
  var userId = req.params.id;
  var updateData = req.body.newText;
  var sql = `UPDATE users SET text = '${updateData}' WHERE id = ${userId}`;
  connection.query(sql, [updateData, userId], function(err) { //?: de ce updateData si userId sunt trimise in [] si sql nu ca exemplu
    if (err) {
      throw err;
    } else {
      res.redirect('/users');
    }
  });
});

//Delete
router.get('/delete/:id', function(req, res) {
  var userId = req.params.id;
  var sql = `DELETE FROM users WHERE id = ${userId}`;
  connection.query(sql, function(err) {
    if (err) {
      throw err;
    } else {
      res.redirect('/users');
    }
  });
});

module.exports = router;