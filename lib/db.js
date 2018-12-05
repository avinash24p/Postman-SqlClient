const config = require('./config');
var mysql = require('mysql');

var db1 = mysql.createPool({
    connectionLimit: 100, //important
    host: config.DB1.host,
    user: config.DB1.username,
    password: config.DB1.password,
    database: config.DB1.database,
    debug: false
});

var db2 = mysql.createPool({
    connectionLimit: 100, //important
    host: config.DB2.host,
    user: config.DB2.username,
    password: config.DB2.password,
    debug: false
});

var db3 = mysql.createPool({
    connectionLimit: 100, //important
    host: config.DB3.host,
    user: config.DB3.username,
    password: config.DB3.password,
    debug: false
});

var db4 = mysql.createPool({
    connectionLimit: 100, //important
    host: config.DB4.host,
    user: config.DB4.username,
    password: config.DB4.password,
    debug: false
});

exports.handleDBPool = function (poolConnect,sqlQuery,callback) {
    if (poolConnect === 'DB1') {
        handle_database(db1,sqlQuery,function(err,data){
            callback(err,data);
        });
    } else if (poolConnect === 'DB2') {
        handle_database(db2,sqlQuery,function(err,data){
            callback(err,data);
        });
    } else if (poolConnect === 'DB3') {
        handle_database(db3,sqlQuery,function(err,data){
            callback(err,data);
        });
    } else if (poolConnect === 'DB4') {
        handle_database(db4,sqlQuery,function(err,data){
            callback(err,data);
        });
    }
}


function handle_database(pool,sqlQuery,callback) {

    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            return callback(err,{ "code": 100, "status": "Error in connection database" });
        }

        console.log('connected as id ' + connection.threadId);

        connection.query(sqlQuery + ' limit 10', function (err, rows) {
            connection.release();
            if (!err) {
              //  console.log(rows);
                callback(null, rows);
            }else{
                console.log(err);
                callback(null,err);
            }
        });

        connection.on('error', function (err) {
            return callback(err,{ "code": 100, "status": "Error in connection database" });
        });
    });
}


