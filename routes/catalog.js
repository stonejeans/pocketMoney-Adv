const express = require('express');
const router = express.Router();


// Require our controllers.
const home_controller = require('../controllers/postController'); 
const guide_controller = require('../controllers/guideController');
const summary_controller = require('../controllers/summaryController');

// HOME PAGE ROUTES //
// GET catalog home page.
router.get('/', home_controller.index);  

// GET request for creating a Task. NOTE This must come before routes that display Task (uses id).
router.get('/post/compose', home_controller.post_create_get);

// POST request for creating Task.
router.post('/post/compose', home_controller.post_create_post);

// GET request to update Task.
router.get('/post/:id/update', home_controller.post_update_post);

// GET request for Task detail.
router.get('/post/:id', home_controller.post_detail);

// // GET request for Task detail (basic view).
router.get('/view/post/:id', home_controller.post_detail_basic);


// GUIDE PAGE ROUTES //
// GET catalog guide page.
router.get('/guide', guide_controller.guideIndex);


// HISTORY PAGE ROUTES //
// GET catalog History page.
router.get('/summary', summary_controller.summaryIndex);
// // GET request to update History paid status.
router.get('/summary/due', summary_controller.post_update_due);

module.exports = router;
