const { generate_token, secreteKey } = require("../config/jwtToken");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const uniqid = require('uniqid');
const Coupon = require("../models/couponModel");
const jwt = require('jsonwebtoken');
const asyncHandler=require('express-async-handler');
const validateMongodbId = require("../utils/validateMongodbId");
const { generateRefresh_token } = require("../config/refreshtoken");
const { sendEmail } = require("./emailCtrl");
const crypto = require('crypto');


// create a user
const createUser =asyncHandler( async (req, res) => {
  const email = req.body.email;
  const findUser = await User.findOne({ email: email });

  if (!findUser) {
    // try {
      const newUser = await User.create(req.body);
      res.json(newUser);
    // } catch (error) {
    //   res.status(500).json({
    //     msg: "Error creating the user",
    //     success: false,
    //     error: error.message,
    //   });
    // }
  } 
  else {
    throw new Error("User Already Exist Bro!!");
  }
});

// login a user
const loginUserCtrl = asyncHandler(async (req,res)=>{
const {email , password} = req.body;
// console.log(email ,password);

// checking if user exist or not..
const findUser = await User.findOne({ email });
if(findUser && await findUser.isPasswordmatched(password)){

  const refreshToken =  await generateRefresh_token(findUser?._id);
  const updateuser = await User.findByIdAndUpdate(findUser.id, {
    refreshToken : refreshToken
  }, {
    new: true
  } );
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  maxAge : 72 * 60 * 60 * 1000
});
res.json({
  _id: findUser?._id,
  firstname:findUser?.firstname,
  lastname: findUser?.lastname,
  email: findUser?.email,
  mobile: findUser?.mobile,
  token: generate_token(findUser?._id),
});
}
else{
  throw new Error("Invalid Credentials Bro!!")
}
});

// login admin 
const loginAdminCtrl = asyncHandler(async (req,res)=>{
const {email , password} = req.body;
// console.log(email ,password);

// checking if user exist or not..
const findAdmin = await User.findOne({ email });
if(findAdmin.role !== "admin"){
  throw new Error("Not authorized Buddy!!");
}
if(findAdmin && await findAdmin.isPasswordmatched(password)){

  const refreshToken =  await generateRefresh_token(findAdmin?._id);
  const updateuser = await User.findByIdAndUpdate(findAdmin.id, {
    refreshToken : refreshToken
  }, {
    new: true
  } );
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  maxAge : 72 * 60 * 60 * 1000
});
res.json({
  _id: findAdmin?._id,
  firstname:findAdmin?.firstname,
  lastname: findAdmin?.lastname,
  email: findAdmin?.email,
  mobile: findAdmin?.mobile,
  token: generate_token(findAdmin?._id),
});
}
else{
  throw new Error("Invalid Credentials Bro!!")
}
});

// handle refreshToken
const handleRefreshToken = asyncHandler(async(req,res)=>{
const cookie =  req.cookies;
// console.log(cookie);
if(!cookie?.refreshToken){
  throw new Error("No refreshToken in Cookies")
}
const refreshToken = cookie.refreshToken;
// console.log(refreshToken);
const user = await User.findOne({refreshToken});
// res.json(user)
if(!user){
  throw new Error("No refreshToken present in Database or not matched")
}
const secretekey = secreteKey();
jwt.verify(refreshToken , secretekey , (err,decoded)=>{
  if(err || user.id !== decoded.id){  // https://chat.openai.com/c/e81b65b0-3436-4c7e-885a-3c80a16aa9f6
    throw new Error("There is something wrong with the reference token !!")
  }
const accessToken = generateRefresh_token(user?._id);
res.json({ accessToken });

});
});

// logout a user
const logout = asyncHandler(async(req,res)=>{
  const cookie =  req.cookies;
  if(!cookie?.refreshToken){
    throw new Error("No refreshToken in Cookies")
  }
  const refreshToken = cookie.refreshToken;
const user = await User.findOne({refreshToken});
if(!user){
  res.clearCookie('refreshToken' , {
    httpOnly : true,
    secure : true
  });
  return res.sendStatus(204) //no content
}
await User.findOneAndUpdate({refreshToken} , {
  refreshToken : "" // so that user logout 
});

res.clearCookie('refreshToken' , {
  httpOnly : true,
  secure : true
});
res.sendStatus(204); // no content

});


// Update a user
const updateUser = asyncHandler(async(req,res)=>{
  const { _id } = req.user;
  validateMongodbId(_id);
  try {
    const updateUser = await User.findByIdAndUpdate(_id , {
        firstname: req?.body?.firstname,
        lastname: req?.body?.lastname,
        email: req?.body?.email,
        mobile: req?.body?.mobile
    } , {
      new: true
    });
    res.json(updateUser);
  } catch (error) {
    throw new Error(error);
  }
});

// Save Address

const saveAddress = asyncHandler(async(req,res)=>{
  const { _id } = req.user;
  validateMongodbId(_id);
  try {
    const updateUser = await User.findByIdAndUpdate(_id , {
        address : req?.body?.address
    } , {
      new: true
    });
    res.json(updateUser);
  } catch (error) {
    throw new Error(error);
  }
});

// Get all users

const getallUsers = asyncHandler(async(req,res)=>{
  try {
    const getUsers = await User.find();
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});
// Get a single user
const getUser = asyncHandler(async(req,res)=>{
    const { id } = req.params;
    // console.log(id);
    validateMongodbId(id);
    try {
      const getUser = await User.findById(id);
      res.json({
        getUser
      });
    } catch (error) {
      throw new Error(error);
    }
});
// delete a user
const deleteUser = asyncHandler(async(req,res)=>{
    const { id } = req.params;
    // console.log(id);
    try {
      const deleteUser = await User.findByIdAndDelete(id);
      res.json({
        deleteUser
      });
    } catch (error) {
      throw new Error(error);
    }
});
// block a user
const blockUser = asyncHandler(async(req,res)=>{
const { id } = req.params;
validateMongodbId(id);
try {
  const  block = await User.findByIdAndUpdate(id, {
    isBlocked : true
  },
  {
    new: true
  });
  res.json(block);
  // console.log(block);
} catch (error) {
  throw new Error(error);
}
});

// unblock a user
const unblockUser = asyncHandler(async(req,res)=>{
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const  unblock = await User.findByIdAndUpdate(id, {
      isBlocked : false
    },
    {
      new: true
    });
    res.json({
      message: "User Unblocked now!!"
    })
  } catch (error) {
    throw new Error(error);
  }
});

// Update Password...

const updatePassword = asyncHandler(async(req,res)=>{
  const { _id } = req.user;
  const { password } = req.body;
  validateMongodbId( _id );
  const user = await User.findById(_id);
  if(password){
    user.password = password;
    const updatePassword = await user.save();
    res.json(updatePassword);  
  }
  else{
    res.json(user);
  }
});

// forgot password

const forgotPasswordToken = asyncHandler(async(req,res)=>{
  const { email } = req.body;
  const user = await User.findOne({email});

  if(!user){
    throw new Error("User not found with this mail")
  }
  try {
    const token = await user.createPasswordResetToken(); //https://chat.openai.com/c/a00bba4f-3e02-4abe-b278-aa9b902f1d9c   i.e token basically used to expire link after some time(10 min which is of token expire time)
    await user.save();
    const resetURL = `Hy,follow this link to reset Your Password.This link only valid till 10 minutes, < href='http://localhost:4000/api/user/reset-password/${token}'>Click here</> `;
  const data = {
    to: email,
    text: `hey ${user.firstname}`,
    subject: 'Forgot Password link',
    htm: resetURL
  };
  sendEmail(data);
  res.json(token);
  } catch (error) {
    throw new Error(error)
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error(" Token Expired, Please try again later");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json(user);
});

// get wishlist

const getWishList = asyncHandler(async(req,res)=>{
const { _id } = req.user;
try {
  const findUser = await User.findById(_id).populate('wishlist');
  res.json(findUser);
} catch (error) {
  throw new Error(error);
}
});

// userCart

const userCart = asyncHandler(async(req,res)=>{

  const { cart } = req.body;
  const { _id } = req.user;
  validateMongodbId(_id);
  try {
    let products = [];
    const user = await User.findById(_id);
    const alreadyExistCart = await Cart.findOne({orderby : user._id});
    if(alreadyExistCart){
      alreadyExistCart.remove();
    }
    for(let i=0;i<cart.length;i++){
      let object = {};
      object.product = cart[i]._id;
      object.count = cart[i].count;
      object.color = cart[i].color;
      let getprice = await Product.findById(cart[i]._id).select('price').exec();
      // console.log(getprice.price);
      object.price = getprice.price;
      products.push(object);
    }
    let cartTotal = 0;
    for (let i = 0; i < products.length; i++) {
      cartTotal = cartTotal + products[i].price * products[i].count;
    }
    // console.log(products , cartTotal);
    let newCart = await new Cart({
      products,
      cartTotal,
      orderby:user?._id
    }).save();
    res.json(newCart);
  } catch (error) {
    throw new Error(error)
  }
});
// Show user's Cart
const getUserCart = asyncHandler(async(req,res)=>{

  const { _id } = req.user;
  validateMongodbId(_id);
  try {
    const cart = await Cart.findOne({orderby: _id}).populate('products.product');
    res.json(cart);
  } catch (error) {
    throw new Error(error)
  }

});
// Remove user's Cart
const emptyCart = asyncHandler(async(req,res)=>{
  const { _id } = req.user;
  validateMongodbId(_id);
  try {
    const user = await User.findOne({_id});
    const cart = await Cart.findOneAndRemove({orderby: user._id});
    res.json(cart);
  } catch (error) {
    throw new Error(error)
  }

});

// Apply Coupon 
const applyCoupon = asyncHandler(async(req,res)=>{
  const { _id } = req.user;
  validateMongodbId(_id);
  const { coupon } = req.body;
  const validCoupon = await Coupon.findOne({name: coupon});
  // console.log(validCoupon);
  if(validCoupon === null){
    throw new Error("Invalid Coupon Bro!!")
  }
  const user = await User.findOne({_id});
  let { products , cartTotal } = await Cart.findOne({ orderby : user._id}).populate('products.product');
  let totalAfterDiscount = ( cartTotal - (cartTotal * validCoupon.discount)/100).toFixed(2);
  await Cart.findOneAndUpdate({orderby:user._id},{
      totalAfterDiscount
    },
    {
      new:true
    }
  );
res.json(totalAfterDiscount);
});

//Create Order

const createOrder = asyncHandler(async (req, res) => {
  const { COD, couponApplied } = req.body;
  const { _id } = req.user;
  validateMongodbId(_id);
  try {
    if (!COD) throw new Error("Create cash order failed");
    const user = await User.findById(_id);
    let userCart = await Cart.findOne({ orderby: user._id });
    let finalAmout = 0;
    if (couponApplied && userCart.totalAfterDiscount) {
      finalAmout = userCart.totalAfterDiscount;
    } else {
      finalAmout = userCart.cartTotal;
    }
      let newOrder = await new Order({
      products: userCart.products,
      paymentIntent: {
        id: uniqid(),  // This will provide unique ids to each payment and ---> uniqid(prefix optional string, suffix optional string) Generate 18 byte unique id's based on the time, process id and mac address.
        method: "COD",
        amount: finalAmout,
        status: "Cash on Delivery",
        created: Date.now(),
        currency: "usd",
      },
      orderby: user._id,
      orderStatus: "Cash on Delivery",
    }).save();
    let update = userCart.products.map((item) => {
      return {
        updateOne: {
          filter: { _id: item.product._id },
          update: { $inc: { quantity: -item.count, sold: +item.count } },
        },
      };
    });
    const updated = await Product.bulkWrite(update, {});
    res.json({ message: "success" });
  } catch (error) {
    throw new Error(error);
  }
});

/// Get orders of an user

const getOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongodbId(_id);
  try {
    const userorders = await Order.findOne({ orderby: _id })
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});

// Get all orders of an user

const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const alluserorders = await Order.find()
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(alluserorders);
  } catch (error) {
    throw new Error(error);
  }
});
const getOrderByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const userorders = await Order.findOne({ orderby: id })
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const updateOrderStatus = await Order.findByIdAndUpdate(
      id,
      {
        orderStatus: status,
        paymentIntent: {
          status: status,
        },
      },
      { new: true }
    );
    res.json(updateOrderStatus);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = { createUser , loginUserCtrl , getallUsers , getUser , deleteUser , updateUser , 
blockUser , unblockUser , handleRefreshToken , logout , updatePassword, forgotPasswordToken ,
resetPassword , loginAdminCtrl , getWishList , saveAddress , userCart , getUserCart , emptyCart , 
applyCoupon , createOrder , getOrders , updateOrderStatus}; 
