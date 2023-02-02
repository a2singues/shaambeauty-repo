/*---
   Issue a mysql connection
----*/
let mysql = require("mysql2");

let mysqlCon = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: 'aNguesRoot',
	database: 'shaambeautydb'
});
  
mysqlCon.connect((err) => {
    if (err) {
      console.log("Database Connection Failed !!!", err);
    } else {
      console.log("connected to Database");
    }
});
 
module.exports.mysqlCon = mysqlCon;
console.log('@@ mysqlCon: '+mysqlCon);


//module.exports = mysql;
