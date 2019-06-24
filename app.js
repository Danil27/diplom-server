// Include the cluster module
var nn = require('./nn');
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

    for (i in req.body.test) {
        db.query("INSERT INTO diplomdb.answers (answer, questions_id) VALUES (" + req.body.test[i] + "," + i + ");", function (error, results, fields) {
            if (error) {
                throw error;
            }
        });
    }

    db.query("INSERT INTO diplomdb.violation (checklist_id, description) VALUES (" + 1 + ",'" + req.body.description + "');", function (error, results, fields) {
        if (error) {
            throw error;
        }
    });
});


app.post('/analysisCheckList', (req, res) => {
    test = req.body;
    var testarr = [];
    for (var i = 0; i < 10; i++) {
        testarr.push(i);
    }
    //console.log(testarr + " des " + test.description);
    nn.traintest(testarr, test.description);

});

app.post('/addUser', (req, res) => {
    db.query("INSERT INTO diplomdb.users (login,password,post,first_name,last_name) VALUES ('" + req.body.username + "','" + req.body.password + "', 'user','" + req.body.firstname + "','" + req.body.lastname + "');",
        function (error, results, fields) {
            if (error) {
                throw error;
            }
        });
});

app.get('/check', (req, res) => {
    db.query("SELECT * FROM diplomdb.checklist;", function (error, results, fields) {
        if (error) {
            throw error;
        }
        res.send(results);
    });
});

app.get('/setText', (req, res) => {
    s = nn.text(req.query.text);
    res.send(s);
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
