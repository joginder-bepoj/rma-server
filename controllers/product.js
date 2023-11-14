import db from "../db.js"

const productTypes = [ 
  {
    type: "Stuller Diamonds",
    returnTime: 10
  },
  {
    type: "Stuller Gems",
    returnTime: 10
  },
  {
    type: "Jewelry",
    returnTime: 15
  },
  {
    type: "Tools and Supplies",
    returnTime: 15
  },
  {
    type: "Packaging and Displays",
    returnTime: 15
  },
  {
    type: "Fabricated Metals and Stampings",
    returnTime: 15
  },
  {
    type: "Watch bands",
    returnTime: 15
  },
  {
    type: "Special Ordered Fabricated Metals",
    returnTime: 0
  },
  {
    type: "Books, CDs, DVDs",
    returnTime: 0
  },
  {
    type: "Imprinted Packaging/Displays",
    returnTime: 0
  },
  {
    type: "Special Orders",
    returnTime: 0
  },
  {
    type: " Selling Systems",
    returnTime: 0
  },
  {
    type: "Used Tools",
    returnTime: 0
  },
]

export const createProduct = async (req, res) => {
    try {
        const newProduct = req.body;
        const { productName, productId, productPrice, description, productImageURL, manufacturer, manufacturerAccount, vendor, vendorAccount, productType, returnType, consumerAccount, consumer, date} = newProduct;

        const productTypeEntry = productTypes.find(product => product.type === productType);

        const today = new Date();

        // Calculate the last return date by adding the return time (in days) to today's date
        const lastReturnDate = new Date(today.getTime() + productTypeEntry.returnTime * 24 * 60 * 60 * 1000);

        db.query(
            'INSERT INTO products (productName, productId, productPrice, description, productImageURL, manufacturer, manufacturerAccount, vendor, vendorAccount, productType, returnType, lastdateToReturn, consumerAccount, consumer, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [productName, productId, productPrice, description, productImageURL, manufacturer, manufacturerAccount, vendor, vendorAccount, productType, returnType, lastReturnDate, consumerAccount, consumer, date],
            (err, result) => {
                if (err) {
                    console.error('Error creating a new product:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.status(201).json({ message: 'Product created successfully', insertId: result.insertId });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while creating the product' });
    }
}

export const getProductsByUser =  (req, res) => {
    try {
      const accountNumber = req.params.accountNumber;
  
      // MySQL query to retrieve product data based on accountNumber
      db.query(
        'SELECT * FROM products WHERE consumerAccount = ?',
        [accountNumber],
        (err, results) => {
          if (err) {
            console.error('Error fetching product data:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
  
          if (results.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
          }

                 const today = new Date();
        today.setHours(0, 0, 0, 0); // Set the time portion to 00:00:00.000

        const productsToShow = results.filter(product => {
          const lastdateToReturn = new Date(product.lastdateToReturn);
          return today <= lastdateToReturn;
        });
  
          const productData = productsToShow; // Assuming only one product matches the accountNumber
  
          res.status(200).json({ product: productData });
        }
      );
    } catch (error) {
      res.status(400).json({ error: 'Bad request' });
    }
}

export const getSingleProduct = (req, res) =>{
  try {
    const orderNumber = req.params.orderNumber;

    db.query(
      'SELECT * FROM products WHERE orderNumber = ?',
      [orderNumber],
      (err, results) => {
        if (err) {
          console.error('Error fetching product data:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: 'Product not found' });
        }

        const productData = results[0];
        const productDate = new Date(productData.date);

        const month = productDate.getMonth() + 1; 
        const day = productDate.getDate();
        const year = productDate.getFullYear();
        
        const formattedDate = `${year}-${month}-${day}`;


        const buyingDate = new Date(formattedDate);
        const today = new Date();
        const timeDiff = today - buyingDate;
        const daysElapsed  = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const daysLeft = 15 - daysElapsed;

        productData.daysLeft = daysLeft
        productData.date = formattedDate

        res.status(200).json({ product: productData });
      }
    );
  } catch (err) {
    res.status(400).json({err: "Bad Request"})
  }
}

