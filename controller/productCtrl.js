const Product = require("../models/productModel");
const User = require('../models/userModel');
const slugify = require("slugify");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require('../utils/validateMongodbId');
const cloudinaryUploadImg = require('../utils/cloudinary');
const fs = require('fs');
// Create a Product
const createProduct = asyncHandler(async (req, res) => {
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const newProduct = await Product.create(req.body);
    res.json(newProduct);
  } catch (error) {
    throw new Error(error);
  }
});

// Get a product

const getaProduct = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const findProduct = await Product.findById(id);
    res.json(findProduct);
  } catch (error) {
    throw new Error(error);
  }
});

// Get all products
const getallProducts = asyncHandler(async (req, res) => {
  try {
    //// Filtering
    const queryObj = { ...req.query }; // spread the query parameters as an object so that filtering can apply
    const excludeFields = ["page", "sort", "limit", "fields"]; // exclude these parameters while filtering
    excludeFields.filter((val) => delete queryObj[val]);
    // console.log(req.query);
    // console.log(req.query , queryObj);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // https: //chat.openai.com/c/8151ce8d-b89a-4351-ac4e-85df8be3e462
    // console.log(queryStr);
    let query = Product.find(JSON.parse(queryStr));

    // Sorting
    if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(' '); // ie if sorting occur
        //  like this:localhost:4000/api/product?price[gt]=100&brand=Samsung&sort=price,category
        //   then.. split sort by price,brand,..conditions with comma and join with space bcoz sorting
        //    conditions are pass like: sort(price brand category..)
    query = query.sort(sortBy);
    }
    else{
        query = query.sort('-createdAt'); // on the basis of date created,here minus occur means in desc.order
    }

    // Limiting the fields means how many fields/attributes of a record should be visible and select keyword helps me in this
    if(req.query.fields){
      const fields = req.query.fields.split(',').join(' ');
  query = query.select(fields);
  }
  else{
      query = query.select('-__v'); // here minus shows we have to not consider that particular fields/attributes
  }    


  // Pagination

  const page = req.query.page;
  const limit = req.query.limit;
  const skip = (page - 1) * limit;
  // console.log(page,limit,skip);
  query = query.skip(skip).limit(limit);
  if(req.query.page){
    const productCount = await Product.countDocuments();
    if(skip>=productCount){
      throw new Error("This page doesn't Exist Buddy!!")
    }
  }


    const products = await query;
    res.json(products);
  } catch (error) {
    throw new Error(error);
  }
});

// Update a Product

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const updateProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updateProduct);
  } catch (error) {
    throw new Error(error);
  }
});

// Delete a product

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deleteProduct = await Product.findByIdAndDelete(id);
    res.json(deleteProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const addToWishlist = asyncHandler(async(req,res)=>{
const { _id } = req.user;
const { prodId } = req.body;
try {
  const user = await User.findById(_id);
  const alreadyadded = user.wishlist.find((id) => id.toString()=== prodId);
  if(alreadyadded){
    let user = await User.findByIdAndUpdate(_id,{
      $pull : { wishlist: prodId },
    },{
      new: true
    }
    );
    res.json(user);
  }
  else{
    let user = await User.findByIdAndUpdate(_id,{
      $push : { wishlist: prodId },
    },{
      new: true
    }
    );
    res.json(user);
  }
} catch (error) {
  throw new Error(error)
}
});

const rating = asyncHandler(async(req,res)=>{
const { _id } = req.user;
const { star , prodId ,comment} = req.body;
try {
  const product = await Product.findById(prodId);
  let alreadyRated = product.ratings.find((userId) => userId.postedby.toString() === _id.toString());
  if(alreadyRated){
    const updateRating = await Product.updateOne(
      {
      ratings: { $elemMatch: alreadyRated }
      },
      {
        $set: { "ratings.$.star": star , "ratings.$.comment": comment }
      },
      {
        new:true
      }
    );
    // res.json(updateRating);
  }
  else{
    const rateProduct = await Product.findByIdAndUpdate(prodId,
    {
      $push:{
        ratings: {
          star : star,
          comment : comment,
          postedby: _id  // this postedby attribute will only insert at the very first time 
        },
      },
    },
    {
      new: true
    }
    );
    // res.json(rateProduct);
  }
  const getallratings = await Product.findById(prodId);
  let totalRating = getallratings.ratings.length;
  let ratingsum = getallratings.ratings.map((item)=>item.star).reduce((prev,curr)=>prev+curr,0);
  let actualrating = Math.round(ratingsum/totalRating);
  let final_Product = await Product.findByIdAndUpdate( prodId , {
    totalrating:actualrating
  },{
    new: true
  });
  res.json(final_Product);
} catch (error) {
  res.json(error);
}
  
});

const uploadImages = asyncHandler(async(req,res)=>{
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const uploader = (path) => cloudinaryUploadImg(path , 'images');
    const urls = [];
    const files = req.files;
    
if (!files || !Array.isArray(files)) {
  return res.status(400).json({ message: 'No files uploaded or invalid format.' });
}


    for(const file of files){
      const { path } = file;
      const newpath = await uploader(path);
      urls.push(newpath);
      fs.unlinkSync(path);
      // console.log(newpath);
    }
    const findProduct = await Product.findByIdAndUpdate(id ,{
      images:urls.map((file) => {
        return file;
      }),
    },{
      new: true
    }
    );
    res.json(findProduct);
  } catch (error) {
    throw new Error(error)
  }
});

module.exports = {
  createProduct,
  getaProduct,
  getallProducts,
  updateProduct,
  deleteProduct,
  addToWishlist,
  rating,
  uploadImages
};
