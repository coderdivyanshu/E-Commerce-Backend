// Here we check jwt tokens and whether user is admin or not

const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { secreteKey } = require('../config/jwtToken');

const authMiddleware = asyncHandler(async(req,res,next)=>{
    let token;
    if(req?.headers?.authorization?.startsWith("Bearer")){
        token = req.headers.authorization.split(' ')[1];
        try {
            if(token){
                const secrete_key = secreteKey();
                    const decoded = jwt.verify(token,secrete_key);
                    // console.log(decoded);   // You should uncomment it run one time to see what this print: ex: { id: '654cbc7ccbd289785a8aba3a', iat: 1699552245, exp: 1699811445 }
                    const user = await User.findById(decoded?.id);
                    req.user = user;
                    // console.log(user);
                    next();
            }
        } catch (error) {
            throw new Error("Not authorized token expired, Please Login again");
        }
    }
    else{
        throw new Error("There is no token attached to header");
    }
});

const isAdmin = asyncHandler(async(req,res,next)=>{
    const { email } = req.user;
    // In Node.js with Express, you might use req.user for authenticated user information and req.body to access data sent in the body of POST requests.
    //  Link : https://chat.openai.com/c/12d51f17-17d6-4cd2-9ca4-e3582aee025f
    const adminUser = await User.findOne({email});
    if(adminUser.role !== "admin"){
        throw new Error("You are not an admin bro!!");
    }
    else{
        // console.log("isAdmin");
        next();
    }
})

module.exports = { authMiddleware , isAdmin};