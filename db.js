import mysql from "mysql"


const connection = mysql.createConnection({
    host: '162.241.123.56', 
    user: 'bepojmes_rma',
    password: 'rma#@!123',
    database: "bepojmes_rma"

});

export default connection