const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const middleware = require("../middlewares");
const User = require("../models/user");


router.get("/campgrounds/page/:page",(req,res, next) =>{
	
	var perPage = 6;
	var noMatch = null;
	var page = (parseInt(req.params.page)) || 1;
	
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		
		Campground.find({name: regex}, (err, allCampgrounds) => {
		if(err){
			console.log(err);
		} else {
			if(allCampgrounds.length < 1){
				noMatch = "No match campgrounds to query. Try again...";
			}
			res.render("campgrounds/index", {campgrounds: allCampgrounds, noMatch: noMatch});
		}
	});
	} else {
		Campground
        .find({})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec(function(err, allCampgrounds){
            Campground.estimatedDocumentCount().exec(function(err, count) {
            	if (err) return next(err)
                res.render('campgrounds/index', {
                    campgrounds: allCampgrounds,
                    current: page,
					noMatch: noMatch,
                    pages: Math.ceil(count / perPage)
                })
            })
        })
	}
});	

router.post('/campgrounds', middleware.isLoggedIn, async(req,res) => {
	
	try{
		const newlyCreated = await Campground.create(req.body.campground);
		newlyCreated.author.id = req.user._id;
		newlyCreated.author.username = req.user.username;
		await newlyCreated.save();
		req.flash("success", "Campground added successfuly")
		res.redirect('/campgrounds/page/1');
	} catch(err) {
		res.send(err);		
	}
});

router.get("/campgrounds/new", middleware.isLoggedIn, (req,res) => {
	res.render("campgrounds/new");
});

router.get('/campgrounds/:id', async(req,res) => {
	
	try {
		const foundCampground = await Campground.findById(req.params.id).populate({
			path:'comments',
			options: {sort: {createdAt: -1}}
		});
		res.render("campgrounds/show", {campground:foundCampground});
	} catch(err) {
		if(err || !foundCampground){
			req.flash("error", "Campground not found");
			res.redirect("/campgrounds/page/1");
		}	
	}
});

router.get('/campgrounds/:id/edit', middleware.checkCampground, async(req,res) =>{
	
	try{
		const foundCampground = await Campground.findById(req.params.id);
		res.render('campgrounds/edit', {campground:foundCampground});
	} catch(err) {
		res.send(err);
		res.redirect('back');
	}
});

router.put('/campgrounds/:id', middleware.checkCampground, async(req,res) =>{
	
	try{
		const updatedCampground = await Campground.findByIdAndUpdate(req.params.id, req.body.campground);
		req.flash("success", "Post edited successfully");
		res.redirect('/campgrounds/' + req.params.id);
	} catch (err) {
		res.send(err);
		res.redirect('/campgrounds/page/1')
	}
});

router.delete("/campgrounds/:id", middleware.checkCampground, async (req,res) => {
	
	try{
		const removedCampground = await Campground.findByIdAndRemove(req.params.id);
		req.flash("error", "Post removed successfully");
		res.redirect("/campgrounds/page/1");
	} catch(err){
		res.send(err);
		res.redirect("/campgrounds/" + req.params.id);
	}
});		   
		   
router.get('/users/:id', middleware.isLoggedIn, async(req,res) =>{
	
	const foundUser = await User.findById(req.params.id);
	try{
		const campgrounds = await Campground.find().where('author.id').equals(foundUser._id);
		res.render('users/show', {user:foundUser, campgrounds:campgrounds})
	} catch(err){
		req.flash("error", "User not found");
		res.redirect('back');
	}
});

router.post("/campgrounds/:id/like", middleware.isLoggedIn, async (req,res) => {
	
	const foundCampground = await Campground.findById(req.params.id);
	try{
		const foundUserLike = await foundCampground.likes.some((like) =>{
			return like.equals(req.user._id);
		});
		if(foundUserLike) {
			await foundCampground.likes.pull(req.user._id);
		} else {
			await foundCampground.likes.push(req.user._id);
		}
		await foundCampground.save((err) =>{
			if(err) {
				return res.redirect('/campgrounds/page/1');
			}
			return res.redirect('/campgrounds/' + foundCampground._id);
		});	
	} catch(err) {
		res.send(err);
		res.redirect('back');
	}
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;