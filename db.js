import mysql from "mysql2"


const connection = mysql.createPool({
    host: '162.241.123.56', 
    user: 'bepojmes_rma',
    password: 'rma#@!123',
    database: "bepojmes_rma",
    connectionLimit: 0
});

export default connection