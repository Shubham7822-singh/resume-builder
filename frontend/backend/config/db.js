import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://ss45130987:resume123@cluster0.gcbnfer.mongodb.net/RESUME')
    .then(() => console.log('DB CONNECTED'))
}