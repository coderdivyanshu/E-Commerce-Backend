const mongoose = require('mongoose');
const validateMongodbId = (id)=>{
  console.log(id);
  const isValid = mongoose.Types.ObjectId.isValid(id);
    if(!isValid){
        throw new Error("This is not valid Id or Not Found");
    }
};

module.exports = validateMongodbId;