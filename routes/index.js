const express = require('express');
const router = express.Router();
const Post = require('../models/post');

// router.get('/',  (req, res) => {res.render('index')});

router.get('/', function (req, res) {
	if (!req.isAuthenticated()) res.redirect('/users/login');
	const currentuser = req.user;
	let posts = [];
	Post.find().sort({_id:-1}) .then(posts => {
			return res.render("index", {
					posts: posts,
					user: currentuser
			});
	})
	.catch(err => returnError({ msg: "Getting Error In Getting Data" }))
});

router.get('/index', (req, res) =>
	res.render('index', {
		user: req.user
	})
);

module.exports = router;