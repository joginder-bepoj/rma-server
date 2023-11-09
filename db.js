import mysql from "mysql"


const connection = mysql.createConnection({
    host: 'localhost', 
    user: 'root',
    password: 'RM4@J4r3d',  

});

export default connection