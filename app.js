// Include the cluster module
var cluster = require('cluster');
var db = require('./db');
var express = require('express');
var bodyParser = require('body-parser');
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

app.get('/checkData', (req, res) => {

    var checkData = {};

    db.query("SELECT * FROM diplomdb.questions;", function (error, results, fields) {
        if (error) {
            throw error;
        }
        checkData.questions = results;
        res.send(checkData);
    });
});

app.post('/addAnswers', (req, res) => {
    //INSERT INTO diplomdb.answers ( answer, questions_id) VALUES (1,1);


    // db.query("INSERT INTO diplomdb.answers (answer, questions_id) VALUES ('" + 1 + "," + 1 + "');", function (error, results, fields) {
    //     if (error) {
    //         throw error;
    //     }
    // });

    // console.log("1111111111111");

    for (i in req.body) {
        //console.log(i + ": " + req.body[i]);
        db.query("INSERT INTO diplomdb.answers (answer, questions_id) VALUES (" + req.body[i] + "," + i + ");", function (error, results, fields) {
            if (error) {
                throw error;
            }
        });
    }


});

app.get('/check', (req, res) => {
    db.query("SELECT * FROM diplomdb.checklist;", function (error, results, fields) {
        if (error) {
            throw error;
        }
        res.send(results);
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
                res.status(200).send({ loggedIn: true });
            } else {
                res.status(200).send({ loggedIn: false });
                console.log("какаято ошибка");
            }
        } else {
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
