/*jshint esversion: 6 */

const Post = require('../models/post');
const ObjectId = require('mongoose').Types.ObjectId;
const mongoose = require('mongoose');

//Async function that sums up values within the documents in the mongoDB
exports.summaryIndex = function(req, res, summaryIdString) {

  let summaryObjectId = ObjectId(req.user).id;
  const queryDefaultId = '0155710c1d24f874965df210';

  // Conditional handling of potential undefined or null user ids
  if (summaryObjectId == null || summaryObjectId == undefined){
    summaryIdString = queryDefaultId.toString();
  }else{
    summaryIdString = summaryObjectId.toString();
    let checks3 = mongoose.isValidObjectId(summaryIdString);
    if (checks3 == false){
      summaryIdString = queryDefaultId.toString();
    }
  }

  Post.aggregate([
    {$match : { "user_id" : new ObjectId(summaryIdString), status : "Completed", paid_status: "Due"}},
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
  ])

  .exec(function (e,results, amount) {
    if (results == null|| results == 0) {
      amount = 0;
    }else{
      amount = results[0].totalAmount;    
    }

    const summaryStartingContent = "Here you can find a summary of all active tasks and task history.";
    const userLoggedIn = req.user;

    Post.find({user_id: userLoggedIn, status : "Completed", paid_status: "Due"}, function(err, posts){
      res.render("summary", {
        summaryContent: summaryStartingContent,
        startingTotal: amount,
        posts: posts
      });
    });
  });
};

// Handle task update on POST and update 'due_status' field.
exports.post_update_due = function(req, res, next) {
  const requestedPostId = req.param.id;

  Post.updateMany(requestedPostId)
  .exec(function (e,pocketDBDocs) {
    let summaryObjectId = ObjectId(req.user).id;
    let summaryIdString = summaryObjectId.toString();
    let dueQuery = {"user_id" : ObjectId(summaryIdString), status: "Completed"};
    let dueValues = { $set: {paid_status: "Paid" } };
    Post.updateMany(dueQuery, dueValues, function(err, res) {
        if (err) throw err;
        console.log("1 document updated");
    });
    res.redirect('/')
  });
};

