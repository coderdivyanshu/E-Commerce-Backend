const mongoose = require('mongoose');

const dbConnect = async () => {
  try {
    const connectionString = "mongodb+srv://divyanshu_20:Physics55@cluster1.om9ovdy.mongodb.net/your-database-name";

   const conn= await mongoose.connect(connectionString);

    console.log("Database Connected Successfully");
  } catch (error) {
    console.error("Error in Database Connection:", error);
  }
};

module.exports = dbConnect;
