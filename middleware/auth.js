import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const auth = async (req, res, next) =>{
    try {
        const token = req.headers.authorization.split(" ")[1]
        let decodeData;

        if (!token) {
            return res.status(403).send("A token is required for authentication");
        }

        if(token){
            decodeData = jwt.verify(token, process.env.JWT_KEY)
            req.userId = decodeData
        }
        return next()
    } catch (err) {
        console.log("error occured", err)
        return res.status(401).send("Invalid Token");
    }
}

export default auth