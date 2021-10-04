var express = require('express');
var router = express.Router();

/* GET home page (redirect). */
router.get('/', function(req, res) {
  res.redirect('/catalog');
});

/* GET guide page (redirect). */
router.get('/guide', function(req, res) {
  res.redirect('/catalog/guide');
});

/* GET history page (redirect). */
router.get('/summary', function(req, res) {
  res.redirect('/catalog/summary');
});

module.exports = router;
