import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";
import messageRoute from "./routes/message.route.js";

dotenv.config({});
const app = express();

const PORT = process.env.PORT;

app.get("/" , (req,res) => {
    return res.status(200).json({
        message : `I am comming from backend`,
        success:true,
    })
})

app.use(express.json());
app.use(cookieParser()); //when we req to backend using browser our token will save in cookies
app.use(urlencoded({extended:true}));

const corsOption = {
    origin : 'http://localhost:5173',
    credentials : true,
}
app.use(cors(corsOption));

//yhn par apni api aayegi

app.use("/api/v1/user",userRoute);
app.use("/api/v1/post",postRoute);
app.use("/api/v1/message",messageRoute);


//"http://localhost:8000/api/user"


app.listen(PORT , () => {
    connectDB();
    console.log(`Server listen at port ${PORT}`); 
})
