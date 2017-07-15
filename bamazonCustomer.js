var inquirer = require("inquirer");
var mysql = require("mysql");
require("console.table");

console.log("**************************   WELCOME TO BAMAZON   ***************************");
console.log("                ONE STOP SHOP FOR ALL YOUR MUSICAL NEEDS");
console.log("\n          Are you ready to get ALL the instruments?????????\n");

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
		displayItems();
	}
});

function displayItems() {

	connection.query("SELECT * from products", function(err, res) {
		if (err) throw err;
		
		console.table(res);
		
		displayCustOptions();
	});
}

function displayCustOptions() {
	
	inquirer.prompt([
		{
			type: "input",
			name: "itemId",
			message: "Please enter the Item_Id of the item you want to purchase :"
		}
	]).then(function(answers){
		connection.query("SELECT * from products where item_id = ?", [answers.itemId], function(err, res) {
			if (err) throw err;
			if (res.length != 1) {
				console.log("\nPlease enter a correct ItemId from the list above\n");
				displayCustOptions();
			} else {
				inquirer.prompt([
					{type: "input",
					name: "quantity",
					message: "Please enter the quantity to purchase"
					}
				]).then(function(answers2) {
					var newQuantity = res[0].qty_available - parseInt(answers2.quantity); 
					if (newQuantity < 0) {
						console.log("\n Insufficient Qty Entered. Please re-enter your Order\n");
						displayCustOptions();
					} else {
						connection.query("UPDATE products SET qty_available = ? where item_id = ?", [newQuantity, answers.itemId], function(err) {
							if (err) throw err;
								
							console.log("\n");
							console.log("_________________________________________________________________________________________");
							console.log("Thank you for your order. Cost of your order is : " + answers2.quantity * res[0].item_price);
							console.log("_________________________________________________________________________________________");
							console.log("\n");
							inquirer.prompt([
									{
										type: "list",
										name: "exityn",
										message: "Do you want to exit the Order Entry System",
										choices: ["Y", "N"]
									}
								]).then(function(choice) {
									if (choice.exityn === "Y") {
										console.log("**** GoodBye ****")
										process.exit(0);
									} else {
										//recursive call
										displayItems();
									}
								}); //end of exit y/n inquirer prompt
						}); //end of UPDATE callback
					} //end of else when the qty entered is valid
				});		
			}
		});
	});
}



