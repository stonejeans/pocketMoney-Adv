/*jshint esversion: 6 */

const Post = require('../models/post');
const { DateTime } = require("luxon");  //for date handling
const async = require('async');
const ObjectId = require('mongoose').Types.ObjectId;
const mongoose = require('mongoose');

//Async function that sums up values within the documents in the mongoDB
exports.index = function(req, res) {

    let queryObjectId = ObjectId(req.user).id;
    const queryDefaultId = '0155710c1d24f874965df210';
    let queryIdString;

    // Conditional handling of potential undefined or null user ids
    if (queryObjectId == null || queryObjectId == undefined){
        queryIdString = queryDefaultId.toString();
    }else{
        queryIdString = queryObjectId.toString();
        let checks3 = mongoose.isValidObjectId(queryIdString);
        if (checks3 == false){
            queryIdString = queryDefaultId.toString();
        }
    }

    Post.aggregate([
        {$match : { "user_id" : new ObjectId(queryIdString), status : "Completed", paid_status: "Due"}},
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$earn' },
        }},
        {
          $project: {
            _id: 0
          }
        }
    ],  function(err,results) {
        if (err){
            console.log("Aggregation Error: " + err.message);
        }
     })
   
    .exec(function (e,results, amount) {
        if (results == null|| results == 0) {
            amount = 0;
        }else{
            amount = results[0].totalAmount;    
        }

        const userLoggedIn = req.user;
        const homeStartingContent = " to pocketMoney, a space where kids can earn pocket money with the freedom of choice. The parent simply loads a task and decides on the value of completing that task. The young user can then choose how and when they complete these task while earning pocket money along the way.";
        
        Post.find({user_id: userLoggedIn, status: "Added" }, function(err, posts){
            if (err){
                console.log("Find User Error: " + err.message);
            }
            res.render("index", {
                startingContent: homeStartingContent,
                startingTotal: amount,
                posts: posts
            });
        });
    });
};

// Display detail page for a specific task.
exports.post_detail = function(req, res, next) {

    async.parallel({
        post: function(callback) {

            Post.findById(req.params.id)
              .exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.post==null) { // No results.
            err = new Error('Task not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        const requestedPostId = req.params.id;
        res.render('post', { 
            title: results.post.title,
            earn: results.post.earn,
            content: results.post.content,
            footer: results.post.footer,
            rating: results.post.rating,
            postIdent: requestedPostId
        });
    });
};

// Display detail page for a specific task.
exports.post_detail_basic = function(req, res, next) {

    async.parallel({
        post: function(callback) {
            Post.findById(req.params.id)
            .exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.post==null) { // No results.
            err = new Error('Task not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        const requestedPostId = req.params.id;
        res.render('post_basic', { 
            title: results.post.title,
            earn: results.post.earn,
            content: results.post.content,
            footer: results.post.footer,
            rating: results.post.rating,
            postIdent: requestedPostId
        });
    });
};

// Display task create form on GET.
exports.post_create_get = function(req, res, next) {
    res.render('compose');
};

// Handle task create on POST.
exports.post_create_post = function(req, res, next) {
    const status = "Added";
    const paid_status = "Due";
    const day = DateTime.now().toLocaleString(DateTime.DATETIME_MED);


    const post = new Post({
        user_id: req.user,
        title: req.body.postTitle,
        earn: req.body.postEarn,
        content: req.body.postBody,
        footer: day,
        status: status,
        rating: req.body.postRating,
        paid_status: paid_status
    });

    post.save(function(err){
        if (!err){
            console.log("post saved");
            res.redirect("/");
        }
    });
};

// Handle task update on POST and update 'status' field.
exports.post_update_post = function(req, res, next) {
    const requestedPostId = req.params.id;
    let myquery = { _id: requestedPostId };
    let newvalues = { $set: {status: "Completed" } };
    
    Post.findByIdAndUpdate(requestedPostId, newvalues)
    .exec(function (e,pocketDBDocs) {
        const requestedPostId = req.params.id;
        let myquery = { _id: requestedPostId };
        let newvalues = { $set: {status: "Completed" } };
        Post.findByIdAndUpdate(myquery, newvalues, function(err, res) {
            if (err) throw err;
            console.log("Documents updated successfully");
        });

        res.redirect('/');
    });
};
