const express = require("express");
const passport = require("passport");
const router = express.Router();
const User = require("../models/user");
const Campground = require("../models/campground");

router.get("/", (req,res) => {
	res.render("landing");
});

router.get("/register", (req,res) => {
	res.render("register");
});

router.post('/register', async(req,res) =>{
	
	const newUser = new User({
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		avatar: req.body.avatar,
	});
	if(req.body.secretCode === process.env.ADMIN_KEY){
		newUser.isAdmin = true;
	}
	try {
		const user = await User.register(newUser, req.body.password);
		passport.authenticate('local')(req,res, () =>{
			req.flash('success', 'Welcome to YelpCamp ' + user.username);
			res.redirect('/campgrounds/page/1');
		});
	} catch(err) {
		req.flash('error', err.message);
		return res.render("register", {error: err.message});
	}	
});

router.get("/login", (req,res) => {
	res.render("login");
});

router.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/campgrounds/page/1",
		failureRedirect: "/login",
		failureFlash: true
	})
);

router.get("/logout", async (req,res) => {
	await req.logout();
	req.flash("success", "Logged you out");
	res.redirect("/campgrounds/page/1");
});

function isLoggedIn (req,res,next) {
	if(req.isAuthenticated()){
		return next();
	}else {
		res.redirect("/login");
	}	
};

module.exports = router;