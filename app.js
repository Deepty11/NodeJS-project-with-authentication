require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");
// const bcrypt = require("bcrypt");
// const saltRound = 10;
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

//1. for session purpose
app.use(session({
    secret: 'this is a small secret',
    resave: false,
    saveUninitialized: false,

}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});
mongoose.set('useCreateIndex', true);
//2. plugin for passport-local-mongoose
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// const secret="Thisismysecretkey."
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
const userModel = mongoose.model("User", userSchema);

//3. using serializeUser and deserializeUser
passport.use(userModel.createStrategy());
// passport.serializeUser(userModel.serializeUser());
// passport.deserializeUser(userModel.deserializeUser());

//handling serialization and deserealization for both local and google auth
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    userModel.findById(id, function(err, user) {
        done(err, user);
    });
});

//Google strategy configuration
passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        userModel.findOrCreate({ googleId: profile.id }, function(err, user) {
            console.log(profile);
            return cb(err, user);
        });
    }
));

//FOR FACEBOOK OAUTH STRATEGY
passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
        userModel.findOrCreate({ facebookId: profile.id }, function(err, user) {
            console.log(profile);
            return cb(err, user);
        });
    }
));
app.get("/", function(req, res) {
    res.render("home");
});

app.get("/secrets", function(req, res) {
    userModel.find({ "secret": { $ne: null } }, function(err, foundSecrets) {
        if (err) {
            console.log(err);
        } else {
            if (foundSecrets) {
                res.render("secrets", { userSecrets: foundSecrets });
            }
        }
    });
});
app.get("/submit", function(req, res) {
    //checks if logged in
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});
app.post("/submit", function(req, res) {
    const secret = req.body.secret;
    console.log(req.user.id);
    userModel.findById(req.user.id, function(err, foundUser) {
        foundUser.secret = secret;
        foundUser.save(function(err) {
            if (!err) {
                res.redirect("/secrets");
            }
        });
    })
});

//GOOGLE authentications
app.get("/auth/google",
    passport.authenticate("google", {
        scope: ["profile"]
    }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

//FACEBOOK authentications
app.get('/auth/facebook',
    passport.authenticate("facebook"));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

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