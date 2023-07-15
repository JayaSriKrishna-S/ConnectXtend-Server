require("dotenv").config();
const express=require("express");
const app=express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("stat"));
app.set("view engine","ejs");
const mongoose = require("mongoose");
const { render } = require("ejs");
//const encrypt=require("mongoose-encryption");
const session = require("express-session");
const passport=require("passport");
var findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose=require("passport-local-mongoose");
app.use(session({
secret:"Myliitlesecret",
resave:false,
saveUninitialized:false

}));
var suc=false;
app.use(passport.initialize());
app.use(passport.session());




mongoose.connect("mongodb+srv://admin-jsk:sjkpfamily@cluster0.qm9qp1v.mongodb.net/?retryWrites=true&w=majority/Signup",{ useNewUrlParser: true });
const signSchema = new mongoose.Schema({

    Email:String, 
    Password:String,
    googleId:String,
    name:String


});


//signSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["Password"]});

signSchema.plugin(passportLocalMongoose);
signSchema.plugin(findOrCreate);

const Cred = mongoose.model("Cred",signSchema);


passport.use(Cred.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


var GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://gentle-caverns-71776.herokuapp.com/auth/google/success",
  
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    Cred.findOrCreate({ googleId: profile.id}, function (err, user) {
    
      return cb(err, user);
    });
  }
));



app.get('/', function(req,res){
   
    res.render("index1",{login:"Sign In",ref:"/new",action:"/",msg:"New User?",type:"Create Account"});
});


app.get('/new', function(req,res){
    
    res.render("index1",{login:"Create Account",ref:"/",action:"/new",msg:"Existing User?",type:"Log In"});
    
   

    
    
});


app.post("/new",function(req,res){

    Cred.findOne({username:req.body.username},function(err,doc){
        if(doc!=null){
            res.render("w",{val:req.body.username,pass:"false",h1:"Account Already Exists",p1:" "});
        }
        else{
            Cred.register({username:req.body.username},req.body.password,function(err,item){
                if(err){
                    console.log(err);
                }
                else{
                    
                    passport.authenticate("local")(req,res,function(){
                        res.render("w",{val:req.body.username,pass:"true",h1:"Account Created Successfully",p1:"Welcome"});
                        //res.redirect("/success");
            
                    });
                }
               });
        }
    });

  
});


app.post("/",function(req,res){
    
    const cred1=new Cred({
username:req.body.username,
password:req.body.password
    });

    
Cred.findOne({username:req.body.username},function(err,doc){
    if(err){
        console.log(err);
    }
    else{
        
        if(doc!=null){
           req.login(cred1,function(err){
            if(err){
                console.log(err);
            }
            else{
                suc=true;
                passport.authenticate("local",{failureRedirect:"/invalid"})(req,res,function(){
                    res.render("w",{val:req.body.username,pass:"true",h1:"Successfully Loged In",p1:"welcome back"});
                    
                    
                    
                });
            }
           });
        }
        else{
            res.render("w",{val:"Account Doesnt Exists",pass:"false",h1:"Login Failed",p1:" "});
        }
    }
})
   // res.render("w", {val:email} );
});

app.get("/invalid",function(req,res){
 if(suc===true){
    res.render("w",{val:req.body.username,pass:"false",h1:"Invalid Credentials",p1:" "});
    suc=false;
 }
    else{
        res.redirect("/nope");
        
    }
});


app.post("/success",function(req,res){

    for (var key in req.body) {
      
            if(key=="retry"){
                res.redirect('/');
                }
                else{
                    
                    res.redirect("/success");
                }
        
    }
    
    
});

app.get("/success",function(req,res){
    
if(req.isAuthenticated()){
    res.sendFile(__dirname+"/"+"index.html");
}
else{
    res.redirect("/");
}
    
});


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));
  


  app.get('/auth/google/success', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/success');
  });


app.get('/:id', (req, res) => {
    res.send("Invalid");
  });

app.listen(process.env.PORT || 3000,function(){
    console.log("Server is up and running");
})


