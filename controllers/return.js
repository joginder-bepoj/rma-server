import db from "../db.js"

export const returnRequest = (req, res) => {
    try {
        const { productName, consumerAccount, productId, productPrice, manufacturer, purchaseDate, orderNumber, returnReason, vendorAccount, manufacturerAccount, productImage, consumerName } = req.body;

        let returnDate = new Date()
        returnDate = new Date(returnDate.toDateString())



        const imageUrls = []
        req.files.map(file => {
            let path = file.destination.replace("public", "")
            imageUrls.push(path + file.originalname)
        });
        if (imageUrls.length === 0) {
            console.error('image error:')
            return res.status(500).json({ error: 'Internal server error' })
        }


        // Check if productId and orderNumber already exist
        db.query('SELECT * FROM return_request WHERE orderNumber = ?', [orderNumber], (selectErr, selectResults) => {
            if (selectErr) {
                console.error('Error checking for duplicate entries:', selectErr);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (selectResults.length > 0) {
                // If there are duplicate entries, return an error
                return res.status(400).json({ error: 'Order Number already exists' });
            }
            const query = 'INSERT INTO return_request ( productName, consumerAccount, productId, productPrice, manufacturer, purchaseDate, returnDate, orderNumber, returnReason, vendorAccount, manufacturerAccount, productImage, consumerName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            const values = [productName, consumerAccount, productId, productPrice, manufacturer, purchaseDate, returnDate, orderNumber, returnReason, vendorAccount, manufacturerAccount, productImage, consumerName]

            // If no duplicates found, proceed with the insertion
            db.query(query, values, (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('Error adding product:', insertErr);
                    return res.status(500).json({ error: 'Internal server error here' });
                }

                db.query("UPDATE products SET isReturnStarted = '1' WHERE orderNumber = ?", [orderNumber], (err, res) => {
                    if (err) {
                        console.error("updating error", err)
                        return res.status(500).json({ error: 'Internal server error here' });
                    }


                    const insertQuery = 'INSERT INTO return_images (orderNumber, image_url) VALUES ?';
                    const values1 = imageUrls.map(imageUrl => [orderNumber, imageUrl]);

                    db.query(insertQuery, [values1], (err, result) => {
                        if (err) {
                            console.error('Error adding images:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }

                    });
                })


                return res.status(200).json({ message: 'return request added successfully' });

            });
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'An error occurred while creating return request' });
    }
}
export const addReturnId = (req, res) => {

    const { orderNumber, returnId } = req.body;

    try {
        let imageUrl;
        if (req.file) {
            let path = req.file.destination.replace("public", "");
            imageUrl = path + req.file.originalname;
        }

        if (!imageUrl) {
            console.error('image error:')
            return res.status(500).json({ error: 'Internal server error' })
        }

        db.query('UPDATE return_request SET returnId = ? WHERE orderNumber = ?', [returnId, orderNumber], (err, result) => {
            if (err) {
                console.error('Error updating product status:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (result.affectedRows === 0) {
                // No rows were updated, indicating that the order number was not found
                return res.status(404).json({ error: 'Order number not found' });
            }
            const insertQuery = 'INSERT INTO box_images (orderNumber, img_url) VALUES (?, ?)';
            const values = [orderNumber, imageUrl];

            db.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error('Error adding images:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

            });

            res.status(200).json({ message: 'added returnId successfully' });
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'An error occurred while adding return udid' });
    }
}

export const updateReturnStatus = (req, res) => {
    try {
        const returnId = req.params.returnRequestId;
        const { status, location } = req.body;

        const updateQuery = 'UPDATE return_request SET status = ?, location = ? WHERE returnId = ?';

        db.query(updateQuery, [status, location, returnId], (updateErr, updateResult) => {
            if (updateErr) {
                console.error('Error updating status and location:', updateErr);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ error: 'Return ID not found' });
            }

            // Both status and location have been successfully updated
            res.status(200).json({ message: 'Status and location updated successfully' });

        })

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'An error occurred while updating return request' });
    }
};

export const getReturnStatus = (req, res) => {
    const returnRequestId = req.params.returnRequestId;

    try {
        // Query the most recent status update for the specified return request
        db.query('SELECT * FROM return_request WHERE returnId = ?', [returnRequestId], (err, results) => {
            if (err) {
                console.error('Error fetching return request status:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Return request not found' });
            }

            db.query("SELECT * FROM box_images WHERE orderNumber = ?", [results[0].orderNumber], (err, boxImgs)=>{
                if (err) {
                    console.error('Error fetching consumer box image:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                if (results.length === 0) {
                    return res.status(404).json({ error: 'Images not found' });
                }

                db.query("SELECT * FROM return_images WHERE orderNumber = ?", [results[0].orderNumber], (err, consumerImgs)=>{
                    if (err) {
                        console.error('Error fetching consumer product image:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    if (results.length === 0) {
                        return res.status(404).json({ error: 'Images not found' });
                    }

                    res.status(200).json({ status: results[0], boxImgs, consumerImgs });
                })
            })

        });
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'An error occurred while getting status' });
    }
}

export const getAllReturnsConsumer = (req, res) => {
    try {
        const accountNumber = req.params.accountNumber;

        db.query(
            'SELECT * FROM return_request WHERE consumerAccount = ? AND returnId IS NOT NULL',
            [accountNumber],
            (err, results) => {
                if (err) {
                    console.error('Error fetching product data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (results.length === 0) {
                    return res.status(404).json({ error: 'Product not found' });
                }
                const productData = results; // Assuming only one product matches the accountNumber

                res.status(200).json({ product: productData });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while getting returns' });
    }
}

export const getReturnsForVendor = (req, res) => {
    try {
        const option = req.body.option;
        const value = req.body.value;


        let sql;

        if (option === 'UDID') {
            sql = 'SELECT * FROM return_request WHERE returnId = ?';
        } else if (option === 'name') {
            sql = 'SELECT * FROM return_request WHERE consumerName = ?';
        } else if (option === 'accountNumber') {
            sql = 'SELECT * FROM return_request WHERE consumerAccount = ?';
        } else {
            res.status(400).json({ error: 'Invalid option' });
            return;
        }

        // Perform the MySQL query
        db.query(sql, [value], (err, results) => {
            if (err) {
                console.error('MySQL query error: ' + err.message);
                res.status(500).json({ error: 'Server error' });
                return;
            }

            let orderNumber = results[0].orderNumber
           

            db.query('SELECT * FROM return_images WHERE orderNumber = ?', [orderNumber], (err, result) => {
                if (err) {
                    console.error('Error fetching return request images:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                db.query('SELECT * FROM box_images WHERE orderNumber = ?', [orderNumber], (err, images) => {
                    if (err) {
                    console.error('Error fetching return request images:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                    }

                
                // Now, you can send the image addresses to the frontend
                res.status(200).json({ status: results, imageAddresses: result, boxImages : images });
                })
            })
        });
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while getting details' });
        console.log(err)
    }
}


export const getReturnsForManufacurer = (req, res) => {
    try {
        const value = req.params.value;

        let sql = 'SELECT * FROM return_request WHERE returnId = ?';

        // Perform the MySQL query
        db.query(sql, [value], (err, results) => {
            if (err) {
                console.error('MySQL query error: ' + err.message);
                res.status(500).json({ error: 'Server error' });
                return;
            }

            db.query("SELECT * FROM return_images WHERE orderNumber = ?", [results[0]?.orderNumber], (err, consumerImgs)=>{
                if (err) {
                    console.error('Error fetching consumer product image:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                if (results.length === 0) {
                    return res.status(404).json({ error: 'Images not found' });
                }

                db.query("SELECT * FROM box_images WHERE orderNumber = ?", [results[0]?.orderNumber], (err, boxImgs)=>{
                    if (err) {
                        console.error('Error fetching consumer box image:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    if (results.length === 0) {
                        return res.status(404).json({ error: 'Images not found' });
                    }

                    db.query("SELECT * FROM vendors_package WHERE returnId = ?", [value], (err, vendorsItemImg)=>{
                        if (err) {
                            console.error('Error fetching vendors open box images:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        if (results.length === 0) {
                            return res.status(404).json({ error: 'Images not found' });
                        }

                        res.status(200).json({ status: results[0], consumerBoxImgs: boxImgs, consumerProductImages: consumerImgs, vendorsItemImg: vendorsItemImg });
                    })

                })
            })
        });
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while getting details' });
        console.log(err)
    }
}

export const getReturnProductByOrder = (req, res) => {
    const orderNumber = req.params.orderNumber;

    try {
        // Query the most recent status update for the specified return request
        db.query('SELECT * FROM return_request WHERE orderNumber = ?', [orderNumber], (err, results) => {
            if (err) {
                console.error('Error fetching return request status:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Return request not found' });
            }

            db.query('SELECT * FROM return_images WHERE orderNumber = ?', [orderNumber], (err, result) => {
                if (err) {
                    console.error('Error fetching return request images:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                // Assuming that the result is an array of rows, and each row has a 'return_images' property


                // Now, you can send the image addresses to the frontend
                res.status(200).json({ status: results[0], imageAddresses: result });
            })




        });
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'An error occurred while getting status' });
    }
}


export const vendorsUpdateReturn = (req, res) =>{
    const returnId = req.params.returnId;
    const {vendorOpenPackageDesc, vendorsInspectDesc, status, isVendorAccepted} = req.body; 
    let vendorAcceptTime = new Date()
   

    const imageUrls = []
    req.files.map(file => {
        let path = file.destination.replace("public", "")
        imageUrls.push(path + file.originalname)
    });
    if (imageUrls.length === 0) {
        console.error('image error:')
        return res.status(500).json({ error: 'Internal server error' })
    }

    let extImages = []
    let upsImages = []
    let openImages = []
    let inspectImages = []

    imageUrls.forEach(async (image) => {
        if (image.includes('ups')) {
            upsImages.push(image)
        } else if (image.includes('open')) {
            openImages.push(image)
        } else if(image.includes('insepect')) {
            inspectImages.push(image)
        }else if(image.includes('ext')){
            extImages.push(image)
        }
    });

    try {
        const sql = ` UPDATE return_request SET vendorOpenPackageDesc = ?, vendorsInspectDesc = ?, status = ?, isVendorAccepted = ?, vendorAcceptTime = ? WHERE returnId = ?;`;

        db.query(sql, [vendorOpenPackageDesc, vendorsInspectDesc, status, isVendorAccepted, vendorAcceptTime, returnId], (error, results) => {
            if (error) {
                console.error('Error updating data:', error);
                return res.status(500).json({ error: 'Internal server error' })
            }

            const insertQuery = 'INSERT INTO vendor_ups (returnId, img_url) VALUES ?';
            const values1 = upsImages.map(imageUrl => [returnId, imageUrl]);
            db.query(insertQuery, [values1], (err, result) => {
                if (err) {
                    console.error('Error adding images:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

            });
            const insertQuery2 = 'INSERT INTO vendors_box (returnId, img_url) VALUES ?';
            const values2 = extImages.map(imageUrl => [returnId, imageUrl]);
            db.query(insertQuery2, [values2], (err, result) => {
                if (err) {
                    console.error('Error adding images:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

            });
            const insertQuery3 = 'INSERT INTO vendors_open_package (returnId, img_url) VALUES ?';
            const values3 = openImages.map(imageUrl => [returnId, imageUrl]);
            db.query(insertQuery3, [values3], (err, result) => {
                if (err) {
                    console.error('Error adding images:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

            });
            const insertQuery4 = 'INSERT INTO vendors_package (returnId, img_url) VALUES ?';
            const values4 = inspectImages.map(imageUrl => [returnId, imageUrl]);
            db.query(insertQuery4, [values4], (err, result) => {
                if (err) {
                    console.error('Error adding images:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

            });

            res.status(200).json({message: "data updated successfully"})
        })

        
    } catch (err) {
        console.log(err)
        res.status(500).json({err: "An error occured while getting update"})
    }
}

export const vendorsReturnReject = (req, res) =>{
    const returnId = req.params.returnId;
    const {vendorReject, status, isVendorReject} = req.body;
    let vendorAcceptTime = new Date()
   

    const imageUrls = []
    req.files.map(file => {
        let path = file.destination.replace("public", "")
        imageUrls.push(path + file.originalname)
    });
    if (imageUrls.length === 0) {
        console.error('image error:')
        return res.status(500).json({ error: 'Internal server error' })
    }

    try {
        const sql = `UPDATE return_request SET vendorReject = ?, status = ?, isVendorReject = ?, vendorAcceptTime = ? WHERE returnId = ?;`;

        db.query(sql, [vendorReject, status, isVendorReject, vendorAcceptTime, returnId], (error, results) => {
            if (error) {
                console.error('Error updating data:', error);
                return res.status(500).json({ error: 'Internal server error' })
            }

            const insertQuery = 'INSERT INTO vendors_reject_imgs (returnId, img_url) VALUES ?';
            const values1 = imageUrls.map(imageUrl => [returnId, imageUrl]);
            db.query(insertQuery, [values1], (err, result) => {
                if (err) {
                    console.error('Error adding images:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
            });
            res.status(200).json({
                message: "Reuqest updated successfully"
            })
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({err: "Internal server error"})
    }
}

export const getReturnStatusVendors = (req, res) =>{
    const returnId =  req.params.returnId;
    try {

        // Query the most recent status update for the specified return request
        db.query('SELECT * FROM return_request WHERE returnId = ?', [returnId], (err, results) => {
            if (err) {
                console.error('Error fetching return request status:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'Return request not found' });
            }
   
            // consumer box photos
            db.query("SELECT * FROM box_images WHERE orderNumber = ?", [results[0].orderNumber], (err, boxImgs)=>{
                if (err) {
                    console.error('Error fetching consumer box image:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                if (results.length === 0) {
                    return res.status(404).json({ error: 'Images not found' });
                }

                db.query("SELECT * FROM return_images WHERE orderNumber = ?", [results[0].orderNumber], (err, consumerImgs)=>{
                    if (err) {
                        console.error('Error fetching consumer product image:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    if (results.length === 0) {
                        return res.status(404).json({ error: 'Images not found' });
                    }

                    db.query("SELECT * FROM vendors_box WHERE returnId = ?", [returnId], (err, vendorBoximgs)=>{
                        if (err) {
                            console.error('Error fetching vendors product box image:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        if (results.length === 0) {
                            return res.status(404).json({ error: 'Images not found' });
                        }

                        db.query("SELECT * FROM vendors_open_package WHERE returnId = ?", [returnId], (err, vendorsOpenBox)=>{
                            if (err) {
                                console.error('Error fetching vendors open box images:', err);
                                return res.status(500).json({ error: 'Internal server error' });
                            }
                            if (results.length === 0) {
                                return res.status(404).json({ error: 'Images not found' });
                            }

                            db.query("SELECT * FROM vendors_package WHERE returnId = ?", [returnId], (err, vendorsItemImg)=>{
                                if (err) {
                                    console.error('Error fetching vendors open box images:', err);
                                    return res.status(500).json({ error: 'Internal server error' });
                                }
                                if (results.length === 0) {
                                    return res.status(404).json({ error: 'Images not found' });
                                }
      
                                res.status(200).json({ status: results[0], consumerBoxImgs: boxImgs, consumerProductImages: consumerImgs, vendorBoximgs: vendorBoximgs, vendorsOpenBox: vendorsOpenBox, vendorsItemImg: vendorBoximgs });
                            })
                        })
                    })
                })
            })
        })
    } catch (error) {
        console.log(error)
        req.status(500).json({error: "Internal server error"})
    }
}


export const getAllReturnsManufacturer = (req, res) =>{
    const accountNumber = req?.params.accountNumber
    try {
        db.query("SELECT * FROM return_request WHERE manufacturerAccount = ? AND isVendorAccepted = 1 AND isReturnComplete = 0", [accountNumber], (err, result)=>{
            if (err) {
                console.error('Error fetching return request status:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: 'Return request not found' });
            }

            const extractedData = result.map((item) => ({
                returnDate: item.returnDate.split(' ')[0],
                returnId: item.returnId,
            }));

            const groupedData = extractedData.reduce((acc, item) => {
            const { returnDate, returnId } = item;
            
            if (!acc[returnDate]) {
                acc[returnDate] = [];
            }
            
            acc[returnDate].push({ returnDate, returnId });
            
            return acc;
            }, {});
            
            // Convert the grouped data into an array
            const groupedArray = Object.values(groupedData);

            const flatArray = groupedArray.map((group) => {
                const returnDate = group[0].returnDate;
                const items = group.map((item) => ({ returnId: item.returnId }));
                return { date: returnDate, items };
              });
              
            
            

            res.json({flatArray})


        })
    } catch (err) {
        console.log(err)
        res.status(500).json({err: "Internal Server Error"})
    }
}

export const getAllReturnsVendor = (req, res) =>{
    const accountNumber = req.params.accountNumber;
    try {
        db.query("SELECT * FROM return_request WHERE vendorAccount = ? AND isVendorAccepted = 0", [accountNumber], (err, result)=>{
            if (err) {
                console.error('Error fetching return request status:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: 'Return request not found' });
            }

            const extractedData = result.map((item) => ({
                returnId: item.returnId,
            }));

            res.status(200).json(extractedData)

        })
    } catch (err) {
        console.log(err)
        res.status(500).json({err: "Internal Server Error"})
    }
}

export const updateManufacturerReturn = (req, res) =>{
    const returnId = req.params.returnId
    let isManufacturerAccepted = 1
    let manufacturerAcceptedTime = new Date()
    let status = "manufacturer accepeted"

    try {
        const sql = `UPDATE return_request SET isManufacturerAccepted = ?, manufacturerAcceptedTime =?, status = ? WHERE returnId = ?;`
        db.query(sql, [isManufacturerAccepted, manufacturerAcceptedTime, status, returnId], (error, results) => {
            if (error) {
                console.error('Error updating data:', error);
                return res.status(500).json({ error: 'Internal server error' })
            }
            res.status(200).json({message: "data updated successfully"})
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "internal server Error"})
    }
}



export const returnHistory = (req, res) =>{
    const {userType, userAccount} = req.body

    
    try {
        let sql;
        if(userType === "consumer"){
            sql = "SELECT * FROM return_request WHERE consumerAccount = ? AND isReturnComplete = 1;"
        }else if(userType === "vendor"){
            sql = "SELECT * FROM return_request WHERE vendorAccount = ? AND isReturnComplete = 1;"
        }else if(userType === "manufacturer"){
            sql= "SELECT * FROM return_request WHERE manufacturerAccount = ? AND isReturnComplete = 1;"
        }

        db.query(sql, [userAccount], (err, result)=>{
            if (err) {
                console.error('Error updating data:', err);
                return res.status(500).json({ error: 'Internal server error' })
            }
            res.status(200).json(result)
        })


    } catch (error) {
        console.log(error)
        res.status(500).json({error: "Internal Server Error"})
    }
}