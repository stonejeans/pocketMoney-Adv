/*jshint esversion: 6 */

require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const auth = require('./lib/auth');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog');

const compression = require('compression');
const helmet = require('helmet');

const app = express();

// Set up mongoose connection
const mongoose = require('mongoose');

// Set up mongoose connection with url to externalhost
// const dev_db_url = 'mongodb+srv://'+process.env.API_KEY_MONGO+'?retryWrites=true&w=majority';
// const mongoDB = process.env.MONGODB_URI || dev_db_url;
// mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});

//Set connection to mongoDB using localhost:27017
mongoose.connect("mongodb://localhost:27017/pocketMoneyDB", {useNewUrlParser: true, useUnifiedTopology: true});

mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Authentication Packages
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');

// Configure the local strategy for use by Passport.
passport.use(
  new LocalStrategy(function(username, password, callback) {
    User.findOne({ username: username }, function(err, user) {
      if (err) {
        return callback(err);
      }
      if (!user) {
        return callback(null, false, { message: 'Incorrect username. ' });
      }
      if (!user.validatePassword(password)) {
        return callback(null, false, { message: 'Incorrect password.' });
      }
      return callback(null, user);
    });
  })
);

// Configure Passport authenticated session persistence.
passport.serializeUser(function(user, callback) {
  callback(null, user._id);
});

passport.deserializeUser(function(id, callback) {
  User.findById(id, function(err, user) {
    if (err) {
      return callback(err);
    }
    callback(null, user);
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());
app.use(compression()); // Compress all routes

// Content Security Policy set in the HTTP Header. This is a working example with express 4 with a static server
app.use(function(req, res, next) {
  res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net https://code.jquery.com; object-src 'self'");
  return next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Authentication related middleware.
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

// Pass isAuthenticated and current_user to all views.
app.use(function(req, res, next) {
  res.locals.isAuthenticated = req.isAuthenticated();
  // Delete salt and hash fields from req.user object before passing it.
  var safeUser = req.user;
  if (safeUser) {
    delete safeUser._doc.salt;
    delete safeUser._doc.hash;
  }
  res.locals.current_user = safeUser;
  next();
});

// Use our Authentication and Authorization middleware.
app.use(auth);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
