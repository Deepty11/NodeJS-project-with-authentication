require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
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
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
const userModel = mongoose.model("User", userSchema);
app.get("/", function(req, res) {
    res.render("home");
});
app.get("/register", function(req, res) {
    res.render("register");
});
app.post("/register", function(req, res) {
    const user = new userModel({
        email: req.body.username,
        password: req.body.password
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
app.get("/login", function(req, res) {
    res.render("login");
});
app.post("/login", function(req, res) {
    userModel.findOne({ email: req.body.username }, function(err, foundResult) {
        if (!err) {
            if (foundResult.password === req.body.password) {
                res.render("secrets");

            } else {
                res.render("login")
            }

        } else {
            res.render("login")
        }
    });

});

app.listen(3000, function(req, res) {
    console.log("Started to listen to port 3000");
});