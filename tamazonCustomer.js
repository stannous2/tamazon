const mysql = require('mysql');
let inquirer = require('inquirer')


const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root', // your username
    password: 'asdfasdf', // your password
    database: 'tamazon' // the name of the db you created
})
//getAllProducts(logProducts);
start();
let inventory = 0;
let orderedQuantity = 0;

function start() {
    let remainQuantity = 0;

    inquirer.prompt([{
            type: "input",
            name: "productID",
            message: "Please enter Product ID you want to purchase:",
            choices: listAllProductIDs()
        }])
        .then(function (answer1) {
            getProductInventory(answer1.productID);
            inquirer.prompt([{
                type: "input",
                name: "quantity",
                message: "Please enter quantity: "
            }]).then(function (answer2) {
                orderedQuantity = answer2.quantity;

                if (inventory <= 0) {

                    inquirer.prompt([{
                        type: "list",
                        name: "productID",
                        message: "Item is out of stock. Select another productID: ",
                        choices: listAllProductIDs()
                    }]).then(function (answer1) {
                        inquirer.prompt([{
                            type: "input",
                            name: "quantity",
                            message: "Please enter quantity: ",
                            choices: listAllProductIDs()
                        }]).then(function (answer2) {
                            remainQuantity = inventory - answer2.quantity;
                            submitOrder(answer1.productID, remainQuantity);
                        })
                    })
                } else if (answer2.quantity > inventory) {
                    inquirer.prompt([{
                        type: "input",
                        name: "quantity",
                        message: "Insufficient quantity! Lower your quantity: ",
                        validate: function (res) {
                            if (answer2 > inventory) {
                                return false;
                            }
                            return true;
                        }

                    }]).then(function (answer2) {
                        remainQuantity = inventory - answer2.quantity;
                        submitOrder(answer1.productID, remainQuantity)
                    })
                } else {
                    remainQuantity = inventory - answer2.quantity;
                    submitOrder(answer1.productID, remainQuantity)

                }
            })
        })
}

//udpate db with customer info

function submitOrder(itemId, itemQuantity) {
    connection.query("UPDATE products SET quantity = ? WHERE productId = ?", [itemQuantity, itemId], function (err, res) {
        if (err) throw err;
        getProductInfo(itemId, orderSummary, shopAgain);

    });
}
let shopAgain = function () {
    inquirer.prompt([{
        type: "rawlist",
        name: "choice",
        message: "Continue shopping?",
        choices: ["Yes", 'No']

    }]).then(function (answer) {
        if (answer.choice.toLowerCase() === "yes") {
            start();
        }
        if (answer.choice.toLowerCase() === "no") {
            console.log('**** Thank you for shopping!!! ****');
            connection.end();
        }
    });
}

function getProductInventory(itemId) {
    connection.query("SELECT quantity FROM products WHERE productId = ?", [itemId],
        function (err, res) {
            if (err) throw err;
            inventory = res[0].quantity;
            console.log('inventory....', inventory)
            if (inventory <= 0) {
                console.log("Item is out of stock.  Select another product to purchase.")
                start();
            }
        })
}

function listAllProductIDs() {
    let productIdArray = [];
    connection.query("SELECT productId FROM products", function (err, res) {
        if (err) throw err;
        res.forEach(product => {
            productIdArray.push(product.productId);
        })
        console.log(productIdArray);
    });
}

function logProducts(products) {
    products.forEach(product => {
        let total = product.price * orderedQuantity;
        console.log(`
          Sale Summary:
          ==============================
          productID: ${product.productId}
          department: ${product.department}
          product_name: ${product.product_name}
          price: ${'$' + product.price}
          quantity: ${product.quantity}
          Total: ${'$'+ total}
        `)

    })
}

function orderSummary(products) {
    products.forEach(product => {
        let total = product.price * orderedQuantity;
        console.log(`
          Order Summary:
          ==============================
          Department: ${product.department}
          Item: ${product.product_name}
          ProductID: ${product.productId}
          Price: ${'$' + product.price}
          Quantity: ${orderedQuantity}
          Total: ${'$'+ total}
        `)

    })
}

// getAllProducts
//
// only receives one argument, the callback function to be called
// when the products have been successfully retrieved. The callback
// will be supplied with the restults of the query (the products)
function getAllProducts(onResultsLoaded) {
    connection.query('SELECT * FROM products', function (err, res) {
        if (err) throw err;
        onResultsLoaded(res);
    })
}

function getProductInfo(itemId, orderSummary, shopAgain) {
    connection.query('SELECT * FROM products WHERE productId = ?', [itemId], function (err, res) {
        if (err) throw err;
        orderSummary(res);
        shopAgain();
    })
}