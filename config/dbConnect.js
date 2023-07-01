const mongoose = require("mongoose");
const dbConnect = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log(error);
  }
};
dbConnect();
