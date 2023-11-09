import express from "express";
import { addReturnId, getAllReturnsConsumer, getAllReturnsManufacturer, getAllReturnsVendor, getReturnProductByOrder, getReturnStatus, getReturnStatusVendors, getReturnsForManufacurer, getReturnsForVendor, returnHistory, returnRequest, updateManufacturerReturn, updateReturnStatus, vendorsReturnReject, vendorsUpdateReturn } from "../controllers/return.js";
import multer from "multer";

const router = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/'); // Store uploaded files in the 'uploads' folder
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
});
  
const upload = multer({ storage: storage });
  

router.post("/request", upload.array('images', 5),  returnRequest)
router.post("/status/:returnRequestId", updateReturnStatus)
router.get("/returns/:accountNumber", getAllReturnsConsumer)

router.get("/status/:returnRequestId", getReturnStatus)

router.put("/add-return", upload.single("images"), addReturnId)

router.get("/getReturns/:orderNumber", getReturnProductByOrder)


// vendors

router.post("/vendors", getReturnsForVendor)
router.put("/vendors/update/:returnId", upload.array('images', 15), vendorsUpdateReturn)
router.put("/vendors/reject/:returnId", upload.array("images", 5), vendorsReturnReject)
router.get("/vendors/status/:returnId", getReturnStatusVendors)
router.get("/vendors/all/:accountNumber", getAllReturnsVendor)


// manufacturer

router.get("/manufacturer/:value", getReturnsForManufacurer)
router.get("/manufacturer/getall/:accountNumber", getAllReturnsManufacturer)
router.put("/manufacturer/:returnId", updateManufacturerReturn)



router.post("/history", returnHistory)
export default router