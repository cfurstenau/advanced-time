var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var config = require('./../../config/sql.js');


module.exports.testQuery = function() {
  var connection = new Connection(config);

  var request = new Request("select emp_name from PJEMPLOY where employee = 'CFURSTENAU'", function(err, rowCount) {
      if (err) {
        console.log(err);
      } else {
        console.log(rowCount + ' rows');
      }
  });
  request.on('row', function(columns) {
      columns.forEach(function(column) {
        console.log(column.metadata.colName + " = " + column.value);
      });
  });
  connection.on('connect', function(err){
    console.log(err);
    connection.execSql(request);
  });

};

module.exports.payperiodButton= function(currentdate){
	var TYPES = require('tedious').TYPES;
	var connection = new Connection(config);
	var sql = "select we_date from PJWEEK where we_date >= @currentdate ";
	
	
	var payperiods = [];
	
	var request = new Request(sql, function(err, rowCount) {
      if (err) {
        console.log(err);
      } else {
        console.log(rowCount + ' rows');
      }
  });
  
  request.addParameter('currentdate',TYPES.SmallDateTime, currentdate);
  
   request.on('row', function(columns) {
      	payperiods.push(columns[0].value);
			return payperiods;
      });
  
     connection.on('connect', function(err){
    	console.log(err);   	
		connection.execSql(request);
 	 });
	
};

module.exports.getTimecard = function(user, date) {
	var TYPES = require('tedious').TYPES;
	var connection = new Connection(config);
	var sql = "select * from PJLABHDR join PJLABDET on PJLABHDR.docnbr = PJLABDET.docnbr where employee = @user and pe_date = @date";

 	var request = new Request(sql, function(err, rowCount) {
      if (err) {
        console.log(err);
      } else {
        console.log(rowCount + ' rows');
      }
  });
  
  request.addParameter('user',TYPES.VarChar, user);
  request.addParameter('date',TYPES.SmallDateTime, date);
  
  
  request.on('row', function(columns) {
      columns.forEach(function(column) {
        console.log(column.metadata.colName + " = " + column.value);
      });
  });
  
   connection.on('connect', function(err){
    console.log(err);
    connection.execSql(request);
  });
};
