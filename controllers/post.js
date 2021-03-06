const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const randomString = require('randomstring');
const nodemailer = require('nodemailer');
// Load User model
const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const Notif = require('../models/notifs');
var mongoose = require('mongoose');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open', function (callback) {
  console.log('Successfully connected to MongoDB.');
});
const Schema = mongoose.Schema;

const getDate = () => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
    "July", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth()); //January is 0!
  var yyyy = today.getFullYear();
  let thisDate = monthNames[mm] + " " + dd + ", " + yyyy
  return thisDate;
  // console.log("Date: "+thisDate);
}

module.exports.profile = (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('login_prompt', 'log in');
    res.redirect('/');
  }

  else {
    const currentuser = req.user;
    Post.find().then(posts => {
      return res.render("profile", {
        posts: posts,
        currentuser: currentuser,
        owner: 'self'
      });
    })
  }
}

module.exports.get_saved_posts = (req, res) => {
  const savedPostsArray = req.user.savePosts;
  const currentuser = req.user;
  console.log('get_saved_posts()');
  Post.find({ "_id": { "$in": savedPostsArray } }).then(posts => {
    console.log('Posts: ', posts);
    res.render('profile', {
      posts: posts,
      currentuser: currentuser,
      owner: 'others'
    })
  })
}

module.exports.get_all_posts = (req, res) => {
  const currentuser = req.user;
  Post.find().sort({ _id: -1 }).then(posts => {
    Post.find().sort({ view: 1 }).then(vs_posts => {
      return res.render("index", {
        notifs: false,
        posts: posts,
        vsPosts: vs_posts,
        user: currentuser
      });
    })

  })
  // .catch(err => returnError({ msg: "Getting Error In Getting Data" }))
}

module.exports.get_notifs = (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('login_prompt', 'log in');
    res.redirect('/');
  }
  else {
    console.log('homepage + notifs entered');
    const currentuser = req.user;
    Post.find().sort({ _id: -1 }).then(posts => {
      Notif.find({ receiver_id: req.user._id }).then(notifs_array => {
        return res.render("index", {
          notifs: true,
          notifs_array: notifs_array,
          posts: posts,
          user: currentuser
        })
      });
    })
  }

}

module.exports.create_post = (req, res) => {
  console.log(req.body);
  const title = req.body.title_name;
  const body = req.body.body_name;
  const type = 'simple';
  const author = req.user.name;
  const author_id = req.user._id;
  const author_username = req.user.username;
  const date = getDate();
  const view = 0;
  const upvote = 0;
  const comment = 0;
  const tags = 'none';
  const code = 'none';
  const code2 = 'none';
  let errors = [];
  console.log("title, body, date: " + title + ", " + body + ", " + date);
  if (!title || !body) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (errors.length > 0) {
    res.render('index', {
      errors,
      title,
      body,
      type,
      author,
      author_id,
      author_username,
      date,
      view,
      upvote,
      comment,
      tags,
      code,
      code2
    });
  }
  else {
    console.log('new post');
    const newPost = new Post({
      title,
      body,
      type,
      author,
      author_id,
      author_username,
      date,
      view,
      upvote,
      comment,
      tags,
      fileName: code,
      fileLink: code2
    });

    newPost.save().then((err, dbPost) => {
      console.log("Post created : " + dbPost);
      req.flash('quick_post', 'quick post');
      res.redirect('/');
    })

  }
}

module.exports.full_post = (req, res) => {
  console.log('  post', req.body);
  let title = req.body.title;
  let body = req.body.area;
  let type = 'complex';
  let author = req.user.name;
  let author_id = req.user._id;
  let author_username = req.user.username;
  let date = getDate();
  let view = 0;
  let comment = 0;
  let upvote = 0;
  let tag = req.body.tags;
  let code = req.body.code;
  let thumbnail = req.body.thumbnail;
  let tags = tag.split(',');
  let file_name = req.body.file_name;
  let file_link = req.body.file_link;
  let errors = [];
  if (!title || !body) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (errors.length > 0) {
    res.render('index', {
      errors,
      title,
      body,
      type,
      author,
      author_id,
      author_username,
      date,
      view,
      upvote,
      comment,
      thumbnail,
      tags,
      file_name,
      file_link
    });
  }
  else {
    const newPost = new Post({
      title,
      thumbnail,
      body,
      type,
      author,
      author_id,
      author_username,
      date,
      view,
      upvote,
      comment,
      tags,
      code,
      fileName: file_name,
      fileLink: file_link
    });

    newPost.save().then((err, dbPost) => {
      req.flash('full_post', 'full post');
      res.redirect('/');
    })

  }
}

module.exports.create_blog = (req, res) => {
  if (!req.isAuthenticated()) {
    console.log('not logged in');
    req.flash('login_prompt', 'log in');
    res.redirect('/');
  }
  else {
    const actionRoute = '/users/full_post';
    return res.render('create_blog', {
      edit: false,
      route: actionRoute
    });
  }
}

//Verify page
module.exports.verify = (req, res) => {
  const token = req.params.token;
  User.findOne({ secretToken: token }, (err, foundUser) => {
    if (err) { res.json(err); }
    else {
      foundUser.emailVerified = true,
        // foundUser.secretToken = ''
        foundUser.save().then((err, dbPost) => {
          res.redirect('/');
        })
    }

  })
}

module.exports.view_post = (req, res) => {
  const id = req.params.id;

  Post.findOne({ _id: id }, function (err, foundPost) {
    if (err) res.json(err);
    else {
      Comment.find({ myPostID: id }, function (err, foundComments) {
        if (err) res.json(err);
        else {
          Post.findOneAndUpdate({ _id: id }, { $inc: { view: 1 } }, function (err, data) {
            if (err) {
              console.log(err);
            }
            else {
              User.find().then(users => {
                let User = JSON.stringify(users);
                res.render('readmore', {
                  users: JSON.stringify(users),
                  posts: foundPost,
                  views: foundPost.view,
                  comments: foundComments
                });
              })

            }
          })
        }

      });
    }
  });
}

module.exports.save_post = async (req, res) => {
  const post_id = req.params.id;
  const update = await User.findOneAndUpdate({ _id: req.user.id }, { $push: { savePosts: post_id } });
  res.redirect('back');
}

module.exports.getAllusers = async (req, res) => {
  return res.json(await User.find());
}

module.exports.post_comment = async (req, res) => {
  let body = req.body.commentBody;
  const myPostID = req.body.postID;
  const myPostTitle = req.body.postTitle;
  const commentedBy = req.user._id;
  const commentedBy_Username = req.user.username;
  const receiver_id = req.body.receiver_id;
  const mentionedUsers = 'none';

  if (commentedBy != receiver_id) {
    send_notif(myPostID, myPostTitle, commentedBy, commentedBy_Username, receiver_id, 'comment');
  }

  const date = getDate();
  if (!body) {
    body = "body";
  }

  const newComment = new Comment({
    myPostID,
    body,
    commentedBy,
    commentedBy_Username,
    date,
    mentionedUsers
  });
  const dbSavedComment = await newComment.save();
  res.redirect('back');

}

async function send_notif(post_id, post_title, sender_id, sender_username, receiver_id, type) {
  const date = getDate();

  const newNotif = new Notif({
    post_id,
    post_title,
    sender_id,
    sender_username,
    receiver_id,
    type,
    date
  });
  const dbSavedNotif = await newNotif.save();
}

module.exports.inc_upvote = async (req, res) => {
  const id = req.params.id;
  const title = req.params.title;
  const author_id = req.params.author_id;
  const author_username = req.params.author_username;
  if (req.user._id != author_id) {
    send_notif(id, title, req.user._id, req.user.username, author_id, 'upvote');
  }
  const data = await Post.findOneAndUpdate({ _id: id }, { $inc: { upvote: 1 } });
  res.redirect('back');
}

module.exports.inc_comment = async (req, res) => {
  const id = req.params.id;
  const data = await Post.findOneAndUpdate({ _id: id }, { $inc: { comment: 1 } });
  res.redirect('back');
}

module.exports.edit_post = async (req, res) => {
  const id = req.params.id;
  const actionRoute = '/users/save_changes';
  Post.findOne({ _id: id }).then(foundPost => {
    res.render('create_blog', {
      edit: true,
      route: actionRoute,
      post_id: id,
      post: foundPost
    });
  })
}

module.exports.save_changes = async (req, res) => {
  let id = req.body.post_id;
  let Title = req.body.title;
  let Body = req.body.area;
  let type = 'complex';
  let author = req.user.name;
  let author_id = req.user._id;
  let author_username = req.user.username;
  let date = getDate();
  let view = 0;
  let comment = 0;
  let upvote = 0;
  let tag = req.body.tags;
  let code = req.body.code;
  let tags = tag.split(' ');
  Post.updateOne({ _id: id }, { $set: { title: Title, body: Body } }, function (err, docs) {
    res.redirect('/');
  })
}

module.exports.delete_post = async (req, res) => {
  const id = req.params.id;
  console.log('id : ', id);
  Post.findOneAndRemove({ _id: id }, function (err) { console.log(err) });
  res.redirect('back');
}

module.exports.uploadfile = async (req, res) => {
  console.log('upload file');
  res.redirect('back');
}

module.exports.get_all_users = async (req, res) => {
  User.find().then((users) => {
    return res.json({
      Users: users
    });
  })
}