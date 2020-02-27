const Campground = require ("../models/campground");
const Comment = require ("../models/comment");

var middlewareObj = {};

middlewareObj.checkCampground = async(req,res,next) =>{
	
	try{
		if(req.isAuthenticated()){
			throw new Error("You need to be logged in to do that");
		}
		const foundCampground = await Campground.findById(req.params.id);
		if(!foundCampground){
			throw new Error("Campground not found");
		}
		if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
			next();
		} else {
			throw new Error("You don't have permission to do that");
		}
	} catch(err) {
		console.log(err);
		req.flash(err.message);
		res.redirect("/campgrounds/page/1");
	}
}

middlewareObj.checkComment = async(req,res,next) =>{
	
	try{
		if(req.isAuthenticated()){
			throw new Error("You need to be logged in to do that");
		}
		const foundComment = await Comment.findById(req.params.comment_id);
		if(!foundComment){
			throw new Error("Comment not found"); 
		}
		if(foundComment.author.id.equals(req.user._id) || res.user.isAdmin){
			next();
		}else{
			throw new Error("You don't have permission to do that");
		}
	} catch(err){
		console.log(err);
		req.flash(err.message);
		res.redirect("/campgrounds/page/1");
	}
}


middlewareObj.isLoggedIn = (req,res,next) =>{
	if(req.isAuthenticated()){
		return next();
	}else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("/login");
	}	
};


module.exports = middlewareObj;