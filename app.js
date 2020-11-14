// require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRound = 10;
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
// const secret="Thisismysecretkey."
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
const userModel = mongoose.model("User", userSchema);
app.get("/", function(req, res) {
    res.render("home");
});
app.get("/register", function(req, res) {
    res.render("register");
});
app.post("/register", function(req, res) {
    bcrypt.hash(req.body.password, saltRound, function(err, hash) {
        const user = new userModel({
            email: req.body.username,
            // password: md5(req.body.password)
            password: hash
        });
        user.save(function(err) {
            if (!err) {
                console.log("Registration done successfully");
                res.render("secrets");
            } else {
                console.log(err);
            }
        });

    });

});
app.get("/login", function(req, res) {
    res.render("login");
});
app.post("/login", function(req, res) {
    userModel.findOne({ email: req.body.username }, function(err, foundResult) {
        if (!err) {
            bcrypt.compare(req.body.password, foundResult.password, function(err, result) {
                if (result === true) {
                    res.render("secrets");
                }

            });


        } else {
            res.render("login")
        }
    });

});

app.listen(3000, function(req, res) {
    console.log("Started to listen to port 3000");
});