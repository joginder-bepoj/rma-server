import express from "express";
import { createProduct, getProductsByUser, getSingleProduct } from "../controllers/product.js";

const router = express.Router()

router.post("/create", createProduct)
router.get("/:accountNumber", getProductsByUser)
router.get("/getOne/:orderNumber", getSingleProduct)

export default router
