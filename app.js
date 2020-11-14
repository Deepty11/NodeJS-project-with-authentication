// require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// const bcrypt = require("bcrypt");
// const saltRound = 10;
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));
//1. for session purpose
app.use(session({
    secret: 'this is a small secret',
    resave: false,
    saveUninitialized: false,

}));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
mongoose.set('useCreateIndex', true);
//2. plugin for passport-local-mongoose
userSchema.plugin(passportLocalMongoose);
// const secret="Thisismysecretkey."
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
const userModel = mongoose.model("User", userSchema);

//3. using serializeUser and deserializeUser
passport.use(userModel.createStrategy());
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

app.get("/", function(req, res) {
    res.render("home");
});

app.get("/secrets", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
})
app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
    userModel.register({ username: req.body.username }, req.body.password, function(err, result) {
        if (!err) {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });

        } else {
            res.redirect("/register");
        }
    });


});
app.get("/login", function(req, res) {
    res.render("login");
});
app.post("/login", function(req, res) {
    const user = new userModel({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if (err) {
            console.log(err);

        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });


});
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

app.listen(3000, function(req, res) {
    console.log("Started to listen to port 3000");
});