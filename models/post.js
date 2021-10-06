const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema({
  user_id:{type: Schema.Types.ObjectId, ref: 'User'},
  title: {type: String, required: true},
  earn: {type: Number, required: true},
  content: {type: String, required: true},
  footer: {type: String},
  status: {type: String},
  rating: {type: Number,
    min: 1,
    max: 5,
    validate: {validator: Number.isInteger},
  },
  paid_status: {type: String}
});


// Virtual for this post instance URL.
postSchema
.virtual('url')
.get(function () {
  return '/catalog/posts/'+this._id;
});

// Export model.
module.exports = mongoose.model("Post", postSchema);

