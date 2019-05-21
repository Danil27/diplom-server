var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'diplomdb'
});


function handleDisconnect() {

    connection.connect(function (err) {                 // The server is either down
        if (err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000);     // We introduce a delay before attempting to reconnect,
        }                                            // to avoid a hot loop, and to allow our node script to
    });                                              // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}

handleDisconnect();

module.exports = connection;



/*
connection.connect();

connection.query('SELECT * FROM employees', function (error, results, fields) {
    if (error) throw error;
    var i = 0;
    console.log('id: ' + results[i].id);
    console.log('first_name: ' + results[i].first_name);
    console.log('last_name: ' + results[i].last_name);
    console.log('birthday: ' + results[i].birthday);
    console.log('address: ' + results[i].address);
    console.log('phone_number: ' + results[i].phone_number);
    console.log('city: ' + results[i].city);
    console.log('email: ' + results[i].email);
});

connection.end();
*/