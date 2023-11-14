import express from "express";


const router = express.Router()



router.get("/", (req, res)=>{
    try {
        res.status(200).json({message: "Node.js is working now"})
    } catch (error) {
        res.status(500).json({error: "internal server error"})
    }
})


export default router;