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

}
