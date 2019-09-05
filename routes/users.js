const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
// Load User model
const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
var mongoose = require('mongoose');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open', function (callback) {
  console.log('Successfully connected to MongoDB.');
});
const Schema = mongoose.Schema;

// Login Page
router.get('/login', (req, res) => res.render('login'));

// Register Page
router.get('/register', (req, res) => { res.render('register') });

//Read more page
// router.get('/readmore', (req, res) => { res.render('readmore')});

// Register
router.post('/register', (req, res) => {
  const email = req.body.emailN;
  const password = req.body.passwordN;
  const name = req.body.nameN;
  const username = req.body.usernameN;
  let errors = [];
  console.log("Email, password, name, username : " + email + ", " + password + name + username);
  if (!email || !password || !name || !username) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      email,
      password,
      name,
      username
    });
  }
  else {
    console.log('new user');
    const newUser = new User({
      email,
      password,
      username,
      name
    });

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        newUser
          .save()
          .then(user => {
            req.flash(
              'success_msg',
              'You are now registered and can log in'
            );
            console.log("Registered");
            res.redirect('/users/login');
          })
          .catch(err => console.log(err));
      });
    });
  }
});

// Login
router.post('/login', (req, res, next) => {
  console.log("Email:" + req.body.emailN);
  console.log(passport);
  passport.authenticate('local', {
    successRedirect: '/index',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

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

router.post('/post', (req, res) => {
  console.log(req.body);
  const title = req.body.title_name;
  const body = req.body.body_name;
  const date = getDate();
  const view = 0;
  const upvote = 0;
  const comment = 0;
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
      date,
      view,
      upvote,
      comment
    });
  }
  else {
    console.log('new post');
    const newPost = new Post({
      title,
      body,
      date,
      view,
      upvote,
      comment
    });

    newPost.save().then((err, dbPost) => {
      console.log("Post created : " + dbPost);
      res.redirect('/');
    })

  }
});

router.get('/:id', function (req, res) {
  const id = req.params.id;
  console.log("in");

  Post.findOne({ _id: id }, function (err, foundPost) {
    console.log("clicked post : ", foundPost);
    console.log("Views : " + foundPost.view);
    if (err) res.json(err);
    else {
      Comment.find({ myPostID: id }, function (err, foundComments) {
        console.log(err, foundComments);
        if (err) res.json(err);
        else {
          Post.findOneAndUpdate({ _id: id }, { $inc: { view: 1 } }, function (err, data) {
            if (err) {
              console.log(err);
            }
            else {
              res.render('readmore', {
                posts: foundPost,
                views: foundPost.view,
                comments: foundComments
              });
            }
          })
        }

      });
    }
  });
});

router.post('/postcomment', (req, res) => {
  const body = req.body.commentBody;
  const myPostID = req.body.postID;
  console.log(body, myPostID);

  const date = getDate();
  let errors = [];
  console.log("body : " + body);
  if (!body) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (errors.length > 0) {
    res.render('index', {
      errors,
      body,
      date
    });
  }
  else {
    console.log('new comment');
    const newComment = new Comment({
      myPostID,
      body,
      date
    });
    console.log("new comment", newComment);
    newComment.save().then((dbSavedComment, err) => {
      console.log("inside the db function");
      console.log(dbSavedComment);
      console.log("THE END");
      res.redirect('back');
    })

  }
});

router.get('/upvote/:id', (req, res) => {
  const id = req.params.id;
  Post.findOneAndUpdate({ _id: id }, { $inc: { upvote: 1 } }, function (err, data) {
    if (err) {
      console.log(err);
    }
    else {
      console.log('upvoted');
      res.redirect('back');
    }
  })
})

router.get('/comment/:id', (req, res) => {
  console.log("comment inc");
  const id = req.params.id;
  Post.findOneAndUpdate({ _id: id }, { $inc: { comment: 1 } }, function (err, data) {
    if (err) {
      console.log(err);
    }
    else {
      console.log('upvoted');
      res.redirect('back');
    }
  })
})
module.exports = router;


