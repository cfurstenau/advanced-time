var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
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

module.exports.getUserData = function(currentdate, employee, res){
	var connection = new Connection(config);
  	var startWeeks = [];
  	var endWeeks = [];
	var sql = "select we_date from PJWEEK where we_date >= @currentdate";

	var request = new Request(sql, function(err, rowCount) {
      if (err) {
        console.log(err);
      } else {
        //query was successful, send response
        console.log(rowCount + ' rows');
        getProjects(employee, startWeeks, endWeeks, res);
      }
  });
  request.addParameter('currentdate',TYPES.SmallDateTime, currentdate);
  	request.on('row', function(columns) {
  	startDate = new Date(columns[0].value);
  	startDate.setDate(startDate.getDate() - 5);
  	startWeeks.push(startDate.toLocaleDateString());
  	endDate = new Date(columns[0].value);
    endDate.setDate(endDate.getDate() + 1);
    endWeeks.push((endDate).toLocaleDateString());
  });

  connection.on('connect', function(err){
  	console.log(err);
		connection.execSql(request);
 	});

};

module.exports.getTimecard = function(user, date) {
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

function getProjects(employee, startWeeks, endWeeks, res){
  var projects = [];
  var tasks = [];

  var connection = new Connection(config);
  var sql = "select DISTINCT(PJPENTEM.Pjt_entity) Task, PJPENT.pjt_entity_desc TaskDesc, " +
            "PJPENTEM.Project Proj, PJPROJ.project_desc ProjDesc, " +
            "PJPENT.pe_id01 TaskSub, PJPROJ.gl_subacct ProjSub " +
            "from dbo.PJPENTEM " +
            "inner join dbo.PJPENT " +
            "on PJPENT.pjt_entity = PJPENTEM.Pjt_entity " +
            "inner join dbo.PJPROJ " +
            "on PJPROJ.project = PJPENTEM.Project " +
            "where (PJPENTEM.Employee = @employee " +
            "OR PJPENT.project = 'WWTAS1FRNG1020') " +
            "AND PJPROJ.status_pa = 'A' " +
            "AND PJPENT.status_pa = 'A'";

   var request = new Request(sql, function(err, rowCount) {
      if (err) {
        console.log(err);
      } else {
        console.log(rowCount + ' rows');
        res.send({success: true, userId: employee, startWeeks: startWeeks,
                  endWeeks: endWeeks, projects: projects, tasks: tasks});
      }
  });

  request.addParameter('employee',TYPES.VarChar, employee);


  request.on('row', function(columns) {
      var rowProject = {proj: columns[2].value.trim(), projDesc: columns[3].value.trim()};
      if (alreadyIn(projects, rowProject) == false){
        projects.push(rowProject);
      }

      var subAcct;
      if (columns[4].value){
        subAcct = columns[4].value.trim();
      } else {
        subAcct = columns[5].value.trim();
      }
      tasks.push({task: columns[0].value.trim(), taskDesc: columns[1].value.trim(),
                  proj: columns[2].value.trim(), projDesc: columns[3].value.trim(),
                  subAcct: subAcct});
  });

  connection.on('connect', function(err){
    console.log(err);
    connection.execSql(request);
  });
}

function alreadyIn(array, obj){
  for (each in array) {
    if (each.proj = obj.proj){
      return true;
    }
  }
  return false;
}
