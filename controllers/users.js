import bcrypt from "bcrypt";
import db from "../db.js"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

export const signUp = async (req, res, next) => {
  const { name, userName, email, password, address, city, state, zipcode, mobileNumber, userType } = req.body;


  const otp = generateOTP();

  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 15); // OTP expiration time (15 minutes)


  try {
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
      if (err) {
        console.error('Error checking for existing user: ' + err);
        return res.status(500).json({ error: 'Error checking for existing user' });
      }

      if (results.length > 0) {
        return res.status(400).json({
          message: 'User already exists',
        });
      }


      const userNameQuery = 'SELECT * FROM users WHERE userName = ?';
      db.query(userNameQuery, [userName], (err, results) => {
        if (err) {
          console.error('Error checking for existing userName: ' + err);
          res.status(500).json({ error: 'Error checking for existing userName' });
          return;
        }

        if (results.length > 0) {
          res.status(400).json({
            message: 'UserName already exists please choose another',
          });
          return;
        }

        const userMobile = 'SELECT * FROM users WHERE mobileNumber = ?';
        db.query(userMobile, [mobileNumber], (err, results) => {
          if (err) {
            console.error('Error checking for existing mobile number: ' + err);
            res.status(500).json({ error: 'Error checking for existing mobile number' });
            return;
          }

          if (results.length > 0) {
            res.status(400).json({
              message: 'Mobile Number already exists please login or use another',
            });
            return;
          }

          const hash = bcrypt.hashSync(password, 10);
          const account = generateAccountNumber();
  

          // Insert the user into the database
          const insertQuery = 'INSERT INTO users (name, email, otp, password, userType, address, city, state, zipcode, mobileNumber, accountNumber, userName, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
          const values = [name, email, otp, hash, userType, address, city, state, zipcode, mobileNumber, account, userName, expirationTime];
          db.query(insertQuery, values, (err, result) => {
            if (err) {
              console.error('Error registering user: ' + err);
              res.status(500).json({ error: 'Error registering user' + err });
            } else {
              res.status(201).json({
                msg: 'Registration successful. OTP sent to email.',
                userEmail: email,
                otp: otp,
                id: result.id,
              });
            }
          });

        })
      })
    });
  } catch (err) {
    next(err);
  }
};


export const signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Retrieve user details from the database
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results, fields) => {
    db.end();
      if (err) {
        console.error('Error retrieving user:', err);
        return res.status(500).json({ error: 'Internal server error.' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'No user found with this email address' });
      }

      const user = results[0];

      // Compare the provided password with the hashed password from the database
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate a JWT token
      const token = jwt.sign(
        {
          email: user.email,
          id: user.id,
        },
        process.env.JWT_KEY, // Your JWT secret key
        { expiresIn: '10h' }
      );

      

      res.status(200).json({
        result: user,
        token: `Bearer ${token}`,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};


export const updateOtp = async (req, res) => {
  const { email } = req.body;
  const otp = generateOTP()

  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 15); // OTP expiration time (15 minutes)

  const insertQuery = 'INSERT INTO users (email, otp, expires_at) VALUES (?, ?, ?)';
  db.query(insertQuery, [email, otp, expirationTime], (err, result) => {
    if (err) {
      console.error('Error inserting OTP request:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Send the OTP to the user (e.g., via email or SMS, not shown in this example)
    // console.log('OTP sent:', otp);

    res.status(200).json({ message: 'OTP sent successfully' });
  });
}

export const forgetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const now = new Date();

  const selectQuery = 'SELECT * FROM users WHERE email = ? AND otp = ? AND expires_at > ?';
  db.query(selectQuery, [email, otp, now], (err, results) => {
    if (err) {
      console.error('Error verifying OTP:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid OTP or OTP expired' });
    }

    const updateQuery = 'UPDATE users SET password = ? WHERE email = ?';
    db.query(updateQuery, [hashedPassword, email], (err, result) => {
      if (err) {
        console.error('Error updating password:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ message: 'Password updated successfully' });
    });

  });
}

// Generate a random OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000);
}


export const verify = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const now = new Date();

    // Retrieve user details from the database
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error('Error retrieving user:', err);
        return res.status(500).json({ error: 'Internal server error.' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const selectQuery = 'SELECT * FROM users WHERE email = ? AND otp = ? AND expires_at > ?';
      db.query(selectQuery, [email, otp, now], (err, results) => {
        if (err) {
          console.error('Error verifying OTP:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
          return res.status(401).json({ error: 'Invalid OTP or OTP expired' });
        }

        const updateQuery = 'UPDATE users SET isOtpVerified = ? WHERE email = ?';
        const values = [true, email];
        db.query(updateQuery, values, (err, result) => {
          if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ error: 'Internal server error.' });
          }


          res.status(200).json({ message: 'OTP verification successful.' });
        });

      })
    });
  } catch (err) {
    next(err);
  }
};



function generateAccountNumber() {
  const currentDate = new Date();
  const year = currentDate.getFullYear().toString(); // Get the full year
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Get the month (padded with leading zero if necessary)
  const day = currentDate.getDate().toString().padStart(2, '0'); // Get the day (padded with leading zero if necessary)
  const hours = currentDate.getHours().toString().padStart(2, '0'); // Get the hours (padded with leading zero if necessary)
  const minutes = currentDate.getMinutes().toString().padStart(2, '0'); // Get the minutes (padded with leading zero if necessary)
  const seconds = currentDate.getSeconds().toString().padStart(2, '0'); // Get the seconds (padded with leading zero if necessary)

  // Generate the account number by concatenating year, month, day, hours, minutes, and seconds
  const accountNumber = `${year}${month}${day}${hours}${minutes}${seconds}`;

  return accountNumber;
}
