const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var passport = require('passport');
const flash = require('express-flash');
const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

app.use(expressLayouts);
app.set('view engine', 'ejs');
// 

/*
In case edited..
mongoose.connect('mongodb://localhost/my_database', {useNewUrlParser: true}, (err)=>{
    console.log("db connected");

    mongodb+srv://safwan:<password>@cluster0-gvu5h.mongodb.net/admin
});
*/

mongoose.connect('mongodb+srv://safwan:peeppeep@blogger-aahxs.mongodb.net/testing?retryWrites=true&w=majority',
  { useNewUrlParser: true },
  () => console.log("atlas db connected")
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Express Session
app.use(session({
  secret: 'secret_KEY',
  saveUninitialized: true,
  resave: true
}));

// Connect flash

require('./config/passport')(passport);

// Passport init
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


// Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes

const adminRoutes = require("./routes/admin.js");
app.use("/admin", adminRoutes); // Login/Register

const usersRoutes = require("./routes/users.js");
app.use("/users", usersRoutes); // Inside Homepage

app.use("/", usersRoutes); // Get the start page

const PORT = process.env.PORT || 4003;
app.listen(PORT, function () {
  console.log('Listening to ', PORT);
});
// Already in use solution : https://stackoverflow.com/questions/4075287/node-express-eaddrinuse-address-already-in-use-kill-server