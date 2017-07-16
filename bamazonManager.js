var inquirer = require("inquirer");
var mysql = require("mysql");
require("console.table");

console.log("\n**************************   WELCOME TO BAMAZON   ***************************");
console.log("                ONE STOP SHOP FOR ALL YOUR MUSICAL NEEDS");
console.log("\n                                MANAGER VIEW\n");

var connection = mysql.createConnection({
	hostname: 'localhost',
	port: 3306,
	user: 'root',
	password: 'root',
	database: 'Bamazon'
});

connection.connect(function(err) {
	if(err) {
		console.log("Error in connection with database. Pls see details of the error log");
		console.log(err);
		throw err;
	} else {
		displayMgrOptions();
	}
});


 
function displayMgrOptions() {

	inquirer.prompt([
		{
			type: "list",
			name: "option",
			message: "\nPlease select one of the below options\n",
			choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product", "EXIT"]
		}
	]).then(function(mgrSelection) {
	
			switch(mgrSelection.option) {
				case "View Products for Sale":
					displayItems(); 
					break;
				case "View Low Inventory":
					displayLowInventory();
					break;
				case "Add to Inventory":
					addInventory();
					break;
				case "Add New Product":
					addProduct();
					break;
				case "EXIT":
					console.log("\nThanks for using Bamazon..Good Bye\n");
					process.exit(0);
					break;
				default :
					console.log("\n**** No Valid Option Chosen. GoodBye ****\n");
					process.exit(0);
			}	

		});
}; //end of mgrSelection inquirer prompt

function displayItems() {

	connection.query("SELECT * from products", function(err, res) {
		if (err) throw err;
		
		console.log("\n");
		console.table(res);
		
		//This is a recursive call. Using here by intention assuming this code will not be invoked again and again. Other options could've 
		//been used which avoid recursion.
		displayMgrOptions();
	});
}


function displayLowInventory() {
	connection.query("SELECT * FROM products WHERE qty_available < 5", function(err, res) {
		if (err) throw err;
		if (res.length == 0) {
			console.log("\nYou don't have low inventory on any of your items. Low Inventory means < 5 Available quantity\n");
		} else {
			console.table(res);	
		}
		
		//This is a recursive call. Using here by intention assuming this code will not be invoked again and again. Other options could've 
		//been used which avoid recursion.
		displayMgrOptions();
	});
}


function addInventory() {
	inquirer.prompt([
		{ 	type: "input",
			name: "itemId",
			message: "\nPlease enter the Item Id for which you want to update the quantity : "
		},

		{
			type: "input",
			name: "qtyToAdd",
			message: "Please enter the quantity to add for this item :"
		}
	]).then(function(answers) {
		connection.query("SELECT qty_available FROM products WHERE item_id = ?", [answers.itemId], function(err, res) {
			if (err) throw err;
			if (res.length == 0) {
				console.log("\nItem Not Found. Please enter the correct details again\n");
				addInventory();
			} else {
				var newQuantity = parseInt(res[0].qty_available) + parseInt(answers.qtyToAdd);
				connection.query("UPDATE products SET qty_available = ? where item_id = ?", [newQuantity, answers.itemId], function(err, res) {
					if (err) throw err;
					console.log("\nItem Id " + answers.itemId + " is updated. New quantity is " + newQuantity + "\n");
					displayMgrOptions();
				})
			}
		})
	});
}

function addProduct() {
	console.log("\nPlease enter details of the new Product that you want add :\n")
	inquirer.prompt([
		{	type: "input",
			name: "itemId",
			message: "Item Id :",
		},
		{
			type: "input",
			name: "productName",
			message: "Product Name :"	
		},
		{
			type: "input",
			name: "deptName",
			message: "Department Name :"	
		},
		{
			type: "input",
			name: "price",
			message: "Price per Unit in USD :"	
		},
		{
			type: "input",
			name: "quantity",
			message: "Available Quantity :"	
		}
	]).then(function(answers) {
		//Ideally I should validate the item id to make sure it doesn't exist in the database as soon as the item id 
		//is entered and before accepting the other details and also validate the price and quantity to be numbers. 
		//I could use the validate function associated with inquiry. However need to understand that usage better and need to test
		//So for now, handling myself, though it results in not so good user experience.
		connection.query("SELECT * from products where item_id = ?", [answers.itemId], function(err, res) {
			if (err) throw err;
			if (res.length != 0) {
				console.log("\nItem Id already existing. Please re-enter details making sure of the details being entered\n");
				addProduct();
			} else {
				connection.query("INSERT INTO products (item_id, product_name, department_name, item_price, qty_available) VALUES (?, ?, ?, ?, ?)",
					[answers.itemId, answers.productName, answers.deptName, answers.price, answers.quantity], function(err, res) {
						if (err) throw err;
						console.log("\nNew Product Added to Database. Here is the updated inventory\n");
						displayItems();
					});
			}
		});
	});
}
