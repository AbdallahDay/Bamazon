var inquirer = require("inquirer");
var mysql = require("mysql");

const connection = mysql.createConnection({
    host: "localhost",
  
    // Your port; if not 3306
    port: 3306,
  
    // Your username
    user: "root",
  
    // Your password
    password: "",
    database: "bamazon_DB"
});

connection.connect((err) => {
    if (err) throw err;

    console.log("connected as id " + connection.threadId);
    start();
});

function start() {
    inquirer.prompt([
        {
            type: "list",
            name: "action",
            message: "What would you like to do?",
            choices: [
                "View Products for Sale",
                "View Low Inventory",
                "Add to Inventory",
                "Add New Product"
            ]
        }
    ]).then(function(response) {
        switch (response.action) {
            case "View Products for Sale":
                viewProductsForSale();
                break;
            case "View Low Inventory":
                viewLowInventory();
                break;
            case "Add to Inventory":
                addToInventory();
                break;
            case "Add New Product":
                addNewProduct();
                break;
        }
    });
}

function viewProductsForSale() {
    
    connection.query("SELECT item_id, product_name, price, stock_quantity FROM products", (err, res) => {
        if (err) {
            console.log(err);
            console.log(res.sql);
        }

        printPrettyData(res);

        start();
    });
}

function viewLowInventory() {
    
    connection.query("SELECT item_id, product_name, price, stock_quantity FROM products WHERE stock_quantity < 5", (err, res) => {
        if (err) {
            console.log(err);
            console.log(res.sql);
        }

        printPrettyData(res);

        start();
    });
}

function addToInventory() {
    inquirer.prompt([
        {
            type: "input",
            name: "id",
            message: "Which item would you like to update? (Enter item ID)",
            validate: function(input) {
                if (!parseInt(input)) {
                    console.log('\nError! ID must be an integer.\n');
                    return false;
                } else if (parseInt(input) < 1) {
                    console.log('\nError! ID number must be at least 1.\n');
                    return false;
                }

                return true;
            }
        },
        {
            type: "input",
            name: "quantity",
            message: "How many would you like to add?",
            validate: function(input) {
                if (!parseInt(input)) {
                    console.log('\nError! Please enter a valid number.\n');
                    return false;
                } else if (parseInt(input) < 1) {
                    console.log('\nError! Quantity must be at least 1.\n');
                    return false;
                }

                return true;
            }
        }
    ]).then(function(response) {
        const id = parseInt(response.id);
        const quantity = parseInt(response.quantity);

        updateInventory(id, quantity);
    });
}

function addNewProduct() {
    console.log("\nEnter product details:\n");

    inquirer.prompt([
        {
            type: "input",
            name: "name",
            message: "Name:",
            validate: function(input) {
                if (!input.trim()) {
                    console.log("\nName cannot be empty\n");
                    return false;
                }

                return true;
            }
        },
        {
            type: "input",
            name: "department",
            message: "Department name:",
            validate: function(input) {
                if (!input.trim()) {
                    console.log("\nDepartment name cannot be empty\n");
                    return false;
                }

                return true;
            }
        },
        {
            type: "input",
            name: "price",
            message: "Price:",
            validate: function(input) {
                if (!parseFloat(input)) {
                    console.log("\nInvalid entry\n");
                    return false;
                }

                if (parseFloat(input) <= 0) {
                    console.log("\nPrice must be greater than zero\n");
                    return false;
                }

                return true;
            }
        },
        {
            type: "input",
            name: "quantity",
            message: "Quantity:",
            validate: function(input) {
                if (!parseInt(input)) {
                    console.log("\nInvalid entry\n");
                    return false;
                }

                if (parseInt(input) < 0) {
                    console.log("\nQuantity cannot be negative\n");
                    return false;
                }

                return true;
            }
        }
    ]).then(function(response) {

        connection.query(
            "INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES" +
            `('${response.name}', '${response.department}', '${response.price}', '${response.quantity}')`,
            function (err, res) {
                if (err) {
                    console.log(err);
                    console.log(res.sql);
                }
        
                console.log("");

                if (res.affectedRows > 0) {
                    console.log(`Success! ${response.name} has been added!`);
                } else {
                    console.log("Error updating records. Could not add item.");
                }

                console.log("");
        
                start();
            }
        );
    });
}

function printPrettyData(dataset) {
    
    console.log("");

    var col1width = Math.max.apply(Math, dataset.map(function(o) { return o.item_id.toString().length; }));
    var col2width = Math.max.apply(Math, dataset.map(function(o) { return o.product_name.length; }));
    var col3width = Math.max.apply(Math, dataset.map(function(o) { return o.price.toString().length; }));
    var col4width = Math.max.apply(Math, dataset.map(function(o) { return o.stock_quantity.toString().length; }));

    const col1heading = "ID";
    const col2heading = "Product Name";
    const col3heading = "Price";
    const col4heading = "QOH";

    if (col1heading.length > col1width) col1width = col1heading.length;
    if (col2heading.length > col2width) col2width = col2heading.length;
    if (col3heading.length > col3width) col3width = col3heading.length;
    if (col4heading.length > col4width) col4width = col4heading.length;

    //print table headings
    console.log([
        col1heading + ((col1width > col1heading.length) ? " ".repeat(col1width - col1heading.length) : ""),
        col2heading + ((col2width > col2heading.length) ? " ".repeat(col2width - col2heading.length) : ""),
        col3heading + ((col3width > col3heading.length) ? " ".repeat(col3width - col3heading.length) : ""),
        col4heading + ((col4width > col4heading.length) ? " ".repeat(col4width - col4heading.length) : "")
    ].join(" "));

    //print --- under headings
    console.log([
        "-".repeat(col1width),
        "-".repeat(col2width),
        "-".repeat(col3width),
        "-".repeat(col4width)
    ].join(" "));

    //print rows
    dataset.forEach(element => {
        const col1spaces = col1width - element.item_id.toString().length;
        const col2spaces = col2width - element.product_name.length;
        const col3spaces = col3width - element.price.toString().length;
        const col4spaces = col4width - element.stock_quantity.toString().length;

        console.log([
            element.item_id + " ".repeat(col1spaces),
            element.product_name + " ".repeat(col2spaces),
            element.price + " ".repeat(col3spaces),
            element.stock_quantity + " ".repeat(col4spaces)
        ].join(" "));
    });

    console.log("");
}

function updateInventory(id, quantity) {
    // update database

    connection.query(
        "UPDATE products SET stock_quantity = stock_quantity + ? WHERE item_id=?",
        [
            quantity,
            id
        ],
        function (err, res) {
            console.log("");

            if (err) {
                console.log(err);
                console.log(res.sql);
            }

            // display total
            if (res.affectedRows > 0) {
                console.log("Success! Inventory updated!");
            } else {
                console.log("Error updating records. Could not complete your order.");
            }

            console.log("");

            start();
        }
    );
}