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
    connection.query("SELECT item_id, product_name, price, stock_quantity FROM products WHERE stock_quantity > 0", (err, res) => {
        if (err) throw err;

        printPrettyData(res);

        buyerPrompt();
    });
}

function buyerPrompt() {
    inquirer.prompt([
        {
            type: "input",
            name: "id",
            message: "Enter the ID of the item you would like to purchase:",
            validate: function (input) {
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
            message: "How many would you like?",
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
    ]).then(function(responses) {
        const id = parseInt(responses.id);
        const quantity = parseInt(responses.quantity);

        connection.query(
            "SELECT * FROM products WHERE ?",
            {
                item_id: id
            },
            function(err, res) {
                if (err) throw err;

                if (res.length) {
                    if (quantity > res[0].stock_quantity) {
                        console.log("Insufficient quantity!");
                        
                        buyerPrompt();
                    } else {
                        purchaseItem(res[0], quantity);
                    }
                } else {
                    console.log(`Could not find item with ID= ${id}.`);
                    buyerPrompt();
                }
            }
        );

        console.log("Verifying availability...");
    })
}

function purchaseItem(item, quantityPurchased) {
    // update database

    connection.query(
        "UPDATE products SET stock_quantity=? WHERE item_id=?",
        [
            item.stock_quantity - quantityPurchased,
            item.item_id
        ],
        function (err, res) {
            if (err) throw err;

            // display total
            if (res.affectedRows > 0) {
                console.log("Order complete! Your total is $" + (item.price * quantityPurchased));
            } else {
                console.log("Error updating records. Could not complete your order.");
            }

            buyerPrompt();
        }
    );
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