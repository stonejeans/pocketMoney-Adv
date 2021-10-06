/*jshint esversion: 6 */

const { body, validationResult } = require('express-validator');
const passport = require('passport');
const async = require('async');

// Require user model
const User = require('../models/user');

// Display detail page for a specific user.
exports.user_profile = [
  isPageOwnedByUser,

  function(req, res, next) {
    User.findById(req.params.id).exec((err, found_user) => {
      if (err) {
        return next(err);
      }
      if (found_user == null) {
        let err = new Error('User not found');
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render('user_profile', {
        title: 'User Profile',
        user: found_user
      });
    });
  }
];

// Display login form on GET.
exports.login_get = function(req, res, next) {

  // Get all authors and genres, which we can use for adding to our book.
  async.parallel({
      user: function(callback) {
          User.find(callback);
      }
      // isAlreadyLoggedIn,
  }, function(err, results) {
      if (err) { 
        return next(err); 
      }
      isAlreadyLoggedIn,
      res.render('user_login', {
        title: 'Login', 
        user :results.user
        // errors: messages.length > 0 ? messages : null
      });
  });
};

// Handle login form on POST
exports.login_post = [
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    // failureFlash: true
  })
];

// Handle logout on GET.
exports.logout_get = [
  function(req, res, next) {
    req.logout();
    req.session.destroy(err => {
      res.redirect('/');
    });
  }
];

// Display register form on GET.
exports.register_get = function(req, res, next) {

  // Get all authors and genres, which we can use for adding to our book.
  async.parallel({
      user: function(callback) {
          User.find(callback);
      }
    }, 
    function(err, results) {
      if (err) { 
        return next(err); 
      }
      isAlreadyLoggedIn,
      
      res.render('user_form', { 
        title: 'Create User', 
        user : results.user 
      });
    }
  );
};

// Handle register on POST.
exports.register_post = [
  // Validate and sanitize fields.
  body('username', 'Username must be at least 3 characters long.').isLength({ min: 3 }).trim().escape(),
  // body('fullname', 'Full name must be at least 3 characters long.').isLength({ min: 3 }).trim().escape(),
  body('email', 'Please enter a valid email address.').isEmail().trim().escape(),
  body('password', 'Password must be between 4-32 characters long.').isLength({ min: 4, max: 32 }).trim().escape(),
  body('password_confirm', 'Password must be between 4-32 characters long.').isLength({ min: 4, max: 32 }).trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    var errors = validationResult(req);

    // Get a handle on errors.array() array,
    // so we can push our own error messages into it.
    var errorsArray = errors.array();

    // Create a user object with escaped and trimmed data.
    var user = new User({
      username: req.body.username,
      email: req.body.email
    });

    // Check if passwords match or not.
    if (!user.passwordsMatch(req.body.password, req.body.password_confirm)) {
      // Passwords do not match. Create and push an error message.
      errorsArray.push({ msg: 'Passwords do not match.' });
    }

    if (errorsArray.length > 0) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('user_form', {
        title: 'Create User',
        user: user,
        errors: errors.array()
      });
      return;
    } else {
      // Data from form is valid.

      // Passwords match. Set password.
      user.setPassword(req.body.password);

      // Check if User with same username already exists.
      User.findOne({ username: req.body.username }).exec((err, found_user) => {
        if (err) {
          return next(err);
        }
        if (found_user) {
          // Username exists, re-render the form with error message.
          res.render('user_form', {
            title: 'Create User',
            user: user
          });
        } else {
          // User does not exist. Create it.
          user.save(err => {
            if (err) {
              return next(err);
            }
            res.redirect('/users/login');
          });
        }
      });
    }
  }
];

// Display update form on GET.
exports.update_get = [
  isPageOwnedByUser,

  function(req, res, next) {
    User.findById(req.params.id).exec((err, found_user) => {
      if (err) {
        return next(err);
      }
      if (found_user == null) {
        let err = new Error('User not found');
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render('user_form', {
        title: 'Update User',
        user: found_user,
        is_update_form: true
      });
    });
  }
];

// // Display reset password form on GET.
exports.reset_get = function(req, res, next) {

  // Get all authors and genres, which we can use for adding to our book.
  async.parallel({
      user: function(callback) {
          User.find(callback);
      },
      // isAlreadyLoggedIn,
  }, function(err, results) {
      if (err) { 
        return next(err); 
      }
      isAlreadyLoggedIn,
      res.render('user_reset', {
        title: 'Reset Password',
        is_first_step: true,
        is_second_step: false, 
        user : results.user 
      });
  });
};

// Handle reset password on POST (1st step).
exports.reset_post = [
// First step of the password reset process.
// Take username and email from form, and try to find a matching user.

  // Validate and sanitize fields.
  body('username', 'Username must be at least 3 characters long.').isLength({ min: 3 }).trim().escape(),
  body('email', 'Please enter a valid email address.').isEmail().trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    var errors = validationResult(req);

    // Get a handle on errors.array() array.
    var errorsArray = errors.array();

    // Create a user object with escaped and trimmed data.
    var user = new User({
      username: req.body.username,
      email: req.body.email
    });

    if (errorsArray.length > 0) {
      // There are errors. Render the form again with sanitized values/error messages.
      // The user couldn't pass this step yet. Hence we're still in the first step!
      res.render('user_reset', {
        title: 'Reset Password',
        is_first_step: true,
        is_second_step: false, 
        user: user, // Pass user object created with user-entered values.
        errors: errorsArray
      });
      return;
    } else {
      // Data from form is valid.

      // Check if User exists.
      User.findOne({ username: req.body.username, email: req.body.email }).exec((err, found_user) => {
        if (err) {
          return next(err);
        }
        if (found_user) {
        // User exists and credentials did match. Proceed to the second step.
        // And pass found_user to the form. We'll need user._id in the final step.
          res.render('user_reset', {
            title: 'Reset Password Final',
            is_first_step: false,
            is_second_step: true, 
            user: found_user // Pass found_user.
          });
          console.log("This id:" + found_user._id);
        } else {
          // User does not exist or credentials didn't match.
          // Render the form again with error messages. Still first step!
          res.render('user_reset', {
            title: 'Reset Password',
            is_first_step: true,
            is_second_step: false, 
            user: user, // Pass user object created with user-entered values.
            errors: [{ msg: 'The user does not exist or credentials did not match a user. Try again.' }]
          });
        }
      });
    }
  }
];

// Handle reset password on POST (2nd step).
exports.reset_post_final = [
  // Second and the final step of the password reset process.
  // Take userid, password and password_confirm fields from form,
  // and update the User record.

  body('password', 'Password must be between 4-32 characters long.').isLength({ min: 4, max: 32 }).trim().escape(),
  body('password_confirm', 'Password must be between 4-32 characters long.').isLength({ min: 4, max: 32 }).trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    var errors = validationResult(req);

    // Get a handle on errors.array() array.
    var errorsArray = errors.array();

    // Create a user object containing only id field, for now.
    // We need to use old _id, which is coming from found_user passed in the first step.
    var user = new User({
      _id: req.body.userid
    });

    // -- Custom Validation -- //

    // Check if passwords match or not.
    if (!user.passwordsMatch(req.body.password, req.body.password_confirm)) {
      // Passwords do not match. Create and push an error message.
      errorsArray.push({ msg: 'Passwords do not match.' });
    }

    if (errorsArray.length > 0) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('user_reset', {
        title: 'Reset Password Final',
        is_first_step: false,
        is_second_step: true, 
        user: user, // We need to pass user back to form because we will need user._id in the next step.
        errors: errorsArray
      });
      return;
    } else {
      // Data from form is valid.

      // Passwords match. Set password.
      user.setPassword(req.body.password);

      // Update the record.
      async.waterfall([
        function(callback) {
          User.findById(req.body.userid).exec(callback);
        },
        function(found_user, callback) {
          // This step is required to keep user role unchanged.
          user.role = found_user.role;
          
          User.findByIdAndUpdate(req.body.userid, user, {}).exec(callback);
        }
      ], 
        function(err, theuser) {
          if (err) {
            return next(err);
          }
          // Success, redirect to login page and show a flash message.
        //   req.flash('success', 'You have successfully changed your password. You can log in now!');
          res.redirect('/users/login');
        });
      
    }
  }
];

// Function to prevent user who already logged in from
// accessing login and register routes.
function isAlreadyLoggedIn(req, res, next) {
  if (req.user && req.isAuthenticated()) {
    res.redirect('/');
  } else {
    next();
  }
}

// Function that confirms that user is logged in and is the 'owner' of the page.
function isPageOwnedByUser(req, res, next) {
  if (req.user && req.isAuthenticated()) {
    if (req.user._id.toString() === req.params.id.toString()) {
      // User's own page. Allow request.
      next();
    } else {
      // Deny and redirect.
      res.redirect('/');
    }
  } else {
    // Not authenticated. Redirect.
    res.redirect('/');
  }
}
