// Include the cluster module
var cluster = require('cluster');
var db = require('./db');


/* Getting all the db querys */
const { saveUser, getUserByToken } = require('./models/user');
/* This middle ware checks if the token given by the user is right */
const { authenticate } = require('./middleware/authenticate');

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for terminating workers
    cluster.on('exit', function (worker) {

        // Replace the terminated workers
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();

    });

    // Code to run if we're in a worker process
} else {
    var AWS = require('aws-sdk');
    var express = require('express');
    var bodyParser = require('body-parser');

    AWS.config.region = process.env.REGION

    var sns = new AWS.SNS();
    const cors = require('cors');
    var app = express();
    var session = require('express-session');

    var usersession;
    app.use(cors({
        origin: [
            "http://localhost:4200"
        ], credentials: true
    }));

    /**
 * For being able to read request bodies
 */
    app.use(bodyParser.json());

    app.use(session({
        secret: "Shh, its a secret!",
        resave: false,
        saveUninitialized: true
    }));

    /**
 * Middleware to check that a payload is present
 */
    const validatePayloadMiddleware = (req, res, next) => {
        if (req.body) {
            next();
        } else {
            res.status(403).send({
                errorMessage: 'You need a payload'
            });
        }
    };

    app.get("/", function (request, response) {
        response.send("hello");
    });

    app.get("/tabledb", validatePayloadMiddleware, (req, res) => {

        db.query("SELECT * FROM " + "diplomdb." + req.query.tname + ";", function (error, results, fields) {
            if (error) {
                throw error;
            }
            var dbdata = { results, fields };
            res.send(dbdata);


        });
    });

    app.post("/login", validatePayloadMiddleware, (req, res) => {

        db.query("SELECT * FROM diplomdb.users WHERE login='" + req.body.username + "';", function (error, results, fields) {
            if (error) {
                throw error;
            }

            var i = 0;

            if (results.length != 0) {
                if ((req.body.username === results[i].login) && (req.body.password === results[i].password)) {
                    req.session.username = results[i].login;
                    console.log("все гуд");
                    //res.write("<h2>OK: </h2>");
                    // res.end();
                    res.status(200).send({ loggedIn: true });
                } else {
                    //res.send("<h2>Неправильный логин или пароль</h2>");
                    res.status(200).send({ loggedIn: false });
                    console.log("какаято ошибка");
                }
            } else {
                //res.send("<h2>Пользователь не найден</h2>");
                res.status(200).send({ loggedIn: false });
                console.log("Непревильный логин или пароль");
            }
        });
    });

    /**
     * Check if user is logged in.
     */
    app.get('/login', (req, res) => {
        req.session.username ? res.status(200).send({ loggedIn: true }) : res.status(200).send({ loggedIn: false });
    });

    /**
    * Checks if user is logged in, by checking if user is stored in session.
    */
    const authMiddleware = (req, res, next) => {
        if (req.session && req.session.username) {
            next();
        } else {
            res.status(403).send({
                errorMessage: 'You must be logged in.'
            });
        }
    };


    /**
    * Log the user out of the application.
    */
    app.post('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                res.status(500).send('Could not log out.');
            } else {
                res.status(200).send({});
            }
        });
    });

    app.get("/home", authMiddleware, function (request, response) {
        response.send("Home");
    });


    var port = process.env.PORT || 3000;

    var server = app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}