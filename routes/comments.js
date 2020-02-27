const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const middleware = require("../middlewares");

router.get('/campgrounds/:id/comments/new', middleware.isLoggedIn, async(req,res) =>{
	
	try{
		const foundCampground = await Campground.findById(req.params.id);
		res.render('comments/new', {campground:foundCampground});
	} catch(err) {
		res.send(err);
	}
});

router.post('/campgrounds/:id/comments', middleware.isLoggedIn, async(req,res) =>{
	
	const foundCampground = await Campground.findById(req.params.id);
	try {
		const createdComment = await Comment.create(req.body.comment);
		createdComment.author.id = req.user._id;
		createdComment.author.username = req.user.username;
		await createdComment.save();
		await foundCampground.comments.push(createdComment);
		await foundCampground.save();
		req.flash('success', 'Successfuly added comment');
		res.redirect('/campgrounds/' + foundCampground._id);
	} catch(err) {
		req.flash('error', 'Something went wrong');
		res.redirect('back');
	}
});

router.get('/campgrounds/:id/comments/:comment_id/edit', middleware.checkComment, async(req,res) =>{
	
	const foundCampground = await Campground.findById(req.params.id);
	try{
		const foundComment = await Comment.findById(req.params.comment_id);
		res.render('comments/edit', {campground_id: req.params.id, comment:foundComment});
	} catch(err){
		if(err || !foundCampground){
			req.flash('error', 'Campground not found');
			res.redirect('back');
		}
	}
});

router.put('/campgrounds/:id/comments/:comment_id', middleware.checkComment, async(req,res) =>{
	
	try{
		const foundComment = await Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment);
		req.flash('success', 'Comment edited successfuly');
		res.redirect('/campgrounds/' + req.params.id);
	} catch(err){
		res.send(err);
		res.redirect('back');
	}
});

router.delete('/campgrounds/:id/comments/:comment_id', middleware.checkComment, async(req,res) =>{
	
	try{
		const removedComment = await Comment.findByIdAndRemove(req.params.comment_id);
		req.flash('error', 'Campground removed successfuly');
		res.redirect('/campgrounds/' + req.params.id);
	} catch(err) {
		res.send(err);
		res.redirect('back');
	}
});


module.exports = router;