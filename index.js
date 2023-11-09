import connection from "./db.js";
import express from "express";
import bodyParser from "body-parser";

import userRoutes from "./routes/users.js"
import returnRoutes from "./routes/return.js"
import productRoutes from "./routes/product.js"
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public/'));

app.use('/images', express.static(__dirname + '/uploads'));;


connection.connect((err)=>{
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }

    console.log('Connected to MySQL database');
})

app.use("/", (req, res)=>{
    try {
        res.status(200).send(<h1>Hello node.js server</h1>)
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
})
app.use("/api/users", userRoutes)
app.use("/api/return", returnRoutes)
app.use("/api/products", productRoutes) 



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});