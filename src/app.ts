/// <reference path='./../typings/tsd.d.ts' />

import express = require('express');
import path = require('path');
import bodyParser = require('body-parser');
import session = require('express-session');
import mongoose = require('mongoose');
import flash = require('connect-flash');

var app : express.Express = express();

//Conecting database
// mongoose.connect('mongodb://localhost/logins');
mongoose.connect('mongodb://logins:shahzu123@ds037215.mongolab.com:37215/loginusers');

// view engine setup
app.set('views', path.join(__dirname, '/../views'));
app.set('view engine', 'ejs'); 

//Static files path
app.use(express.static(path.join(__dirname, '/../public')));

//body-parser Middleware
app.use(bodyParser.urlencoded({ extended:false }))
app.use(bodyParser.json())



//interface sessionObject extends Session
app.use(session({
  genid: function(req) {
    return (Date.now()).toString()// use UUIDs for session IDs 
  },
  secret: 'any secret string'
}))


app.use(flash());

app.use(function(req,res,next){
  res.locals.currentUser = req.session['username'];
 res.locals.info = req.flash('info');
  next();
})


var userSchema =new mongoose.Schema({username: String, password: Number, email: String,bio: String,createdAt: Date})

var userModel = mongoose.model('users',userSchema)

app.get('/',function(req,res,next){
  userModel.find(function(err,data){
    if(err) next(err)
    if(data){
      console.log(data);
      res.render('home',{users: data});    
    }
  })
	
})
app.get('/login',function(req,res,next){
  res.render('login',{error:""})
})


app.post('/login',function(req,res,next){
  userModel.findOne({username : req.body.username,password: req.body.password},function(err,data){
    if(data){
      req.session['username'] = req.body.username
      res.locals.currentUser = req.session['username'];
      userModel.find(function(err,data){
        if(err){
          next(err)
        }
        else{
          res.render('home',{users: data})
        }
            })
    }
    else{
      res.render('login',{error:"Incorrect Username Or Password"})
       }
  })
})


app.get('/signup',function(req,res,next){
  res.render('signup',{error:""})
})

app.post('/signup',function(req,res,next){
  userModel.findOne({ username: req.body.username },function(err,data){
    if(err) next(err)
    else if(data){
      res.render('signup',{error:"Username Already Exists"})
    }
    else{
    
  var newUser = new userModel ({
    username: req.body.username,
    password: req.body.password,
    email: req.body.email,
    bio: req.body.bio,
    createdAt: new Date(),
  });
  req.session['username'] = req.body.username;
  res.locals.currentUser = req.session['username'];
  
    newUser.save(function(){
     req.flash('info','Welcome' + " " + req.session['username'])
      res.redirect  ('/');
    });
    
    
    }
  })
})

app.get('/users/:username',function(req,res,next){
  userModel.findOne({ username: req.params.username},function(err,data){
    if(err)next(err)
    else{
      res.locals.currentUser = req.session['username']
     res.render('profile',{user: data}) 
    }
  })
})


app.get('/edit',function(req,res,next){
  userModel.findOne({ username: req.session['username']},function(err,data){
    if(err)next(err)
    else{
      res.locals.currentUser = req.session['username']
      res.render('editProfile',{user: data})
    }
  })
})

app.post('/edit/:username',function(req,res,next){
userModel.findOneAndUpdate({ username: req.params.username },req.body,function(err,data){
  req.session['username'] = req.body.username
  req.flash('info',"Profile Updated !")  
  res.redirect('/')

})
})

app.get('/remove/:id',function(req,res,next){
  userModel.remove({ _id: req.params.id},function(){
  req.flash('info','Profile Removed !')
  delete req.session['username']
  res.redirect('/');
  });

})

app.get('/logout',function(req,res,next){
  delete req.session['username'];
  res.redirect('/login');
})


var port = process.env.PORT || 4000;
app.listen(port,function(){
	console.log('Server Listning on ' + port)
})

