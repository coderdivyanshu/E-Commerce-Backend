const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const bcrypt = require('bcrypt');
const crypto =require('crypto');
var userSchema = new mongoose.Schema({
    firstname:{
        type:String,
        required:true,
    },
    lastname:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    mobile:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    role:{
        type: String,
        default: "user"
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    cart: {
        type: Array,
        default: []
    },
    address: {
        type : String
    },
    wishlist: [{
        type: ObjectId,
        ref: "Product"
    }],
    refreshToken: {
        type:String
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
}, {
    timestamps: true
});
userSchema.pre("save",async function(next){
 if(!this.isModified('password')){
    next();
 }
  const salt=await bcrypt.genSaltSync(10);
  this.password=await bcrypt.hash(this.password,salt);
});
/* 
The code you've provided is a middleware function used in the context of a Node.js application with a library like Mongoose for MongoDB and the bcrypt library for hashing passwords.
Let's break down what this code does:
userSchema.pre("save", async function (next) { ... }): This code is defining a middleware function that will be executed just before a document of the userSchema is saved (i.e., before a new user is created or an existing user is updated). In Mongoose, you can add middleware functions to certain events like "save," "update," or "remove" to perform actions before or after the database operation.
const salt = await bcrypt.genSaltSync(10);: In this line, the code generates a salt value using the bcrypt library. A salt is a random value that is used to increase the security of the password hashing process. The genSaltSync function generates a salt synchronously. The 10 parameter specifies the number of rounds to use in generating the salt. More rounds generally make it more computationally expensive to hash passwords, which is a good thing for security.
this.password = await bcrypt.hash(this.password, salt);: Here, the code takes the user's plaintext password stored in this.password, and hashes it using the generated salt. The result is then stored back in this.password. The await keyword is used because bcrypt.hash is an asynchronous operation.
*/
userSchema.methods.isPasswordmatched = async function(enteredpassword){
    return await bcrypt.compare(enteredpassword,this.password); // if pass. is correct then return true otherwise false;
}
/*
"userSchema.methods.isPasswordMatched":
This line defines a new method named "isPasswordMatched" for instances of the userSchema.
 In a Mongoose schema, you can define instance methods that can be called on individual
  documents (user instances) created based on that schema.
  */

userSchema.methods.createPasswordResetToken = async function(){
const resetToken = crypto.randomBytes(32).toString('hex');
this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
this.passwordResetExpires = Date.now() + 30 * 60 * 1000;  //10 minutes
return resetToken;
} 
// https://chat.openai.com/c/bc8065f5-2d2e-45b6-802e-f243a03f4ab6
module.exports = mongoose.model('User', userSchema);