import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Store raw password (before hashing in controller)
    role: { 
      type: String, 
      enum: ["admin", "sales", "customer_relations", "procurement"], 
      default: "sales" 
    },
    createdAt: { type: Date, default: Date.now },
  });
  
const User = mongoose.model("User",userSchema);
export default User;