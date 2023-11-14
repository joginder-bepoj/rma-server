import express from "express";
import { signIn, signUp, verify } from "../controllers/users.js";


const router = express.Router()


router.post("/signup", signUp)
// router.post("/signin", signIn)

router.put("/verify-otp", verify)
router.post("/signin", signIn)

export default router;
