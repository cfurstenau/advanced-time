var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
var config = require('./../../config/sql.js');


module.exports.getUserData = function(currentdate, employee, res){
	var connection = new Connection(config);
  	var startWeeks = [];
  	var endWeeks = [];
    var peDates = [];
	var sql = "select we_date from PJWEEK where we_date >= @currentdate";

	var request = new Request(sql, function(err, rowCount) {
      if (err) {
        console.log(err);
        res.send(500, {success: false});
      } else {
        //query was successful, send response
        getProjects(employee, startWeeks, endWeeks, peDates, res);
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
    peDates.push(columns[0].value);
  });

  connection.on('connect', function(err){
  	if (err) {
        console.log(err);
    } else {
        connection.execSql(request);
    }
 	});

};

module.exports.getTimecard = function(user, date, res) {
  var timecard = [];
	var connection = new Connection(config);
	var sql = "select project_desc projDesc, pjt_entity_desc taskDesc, day1_hr1 monHours, day2_hr1 tueHours, "+
            "day3_hr1 wedHours, day4_hr1 thuHours,day5_hr1 friHours, day6_hr1 satHours, day7_hr1 sunHours, "+
            "day1_hr2 monOT, day2_hr2 tueOT, day3_hr2 wedOT, day4_hr2 thuOT, "+
            "day5_hr2 friOT, day6_hr2 satOT, day7_hr2 sunOT, "+
            "PJLABDET.pjt_entity task, PJLABDET.project proj "+
            "from dbo.PJLABHDR "+
            "join dbo.PJLABDET "+
            "on PJLABHDR.docnbr = PJLABDET.docnbr "+
            "join dbo.PJPENT "+
            "on PJLABDET.pjt_entity = PJPENT.pjt_entity "+
            "join dbo.PJPROJ "+
            "on PJLABDET.project = PJPROJ.project "+
            "where PJLABHDR.employee = @user and PJLABHDR.pe_date = @date";

 	var request = new Request(sql, function(err, rowCount) {
      if (err) {
        console.log(err);
      } else {
        res.send({success:true, timecard: timecard});
      }
  });

  dateObj = new Date(date);
  request.addParameter('user',TYPES.VarChar, user);
  request.addParameter('date',TYPES.SmallDateTime, dateObj);


  request.on('row', function(columns) {
      var line = {};
      columns.forEach(function(column) {
        line[column.metadata.colName] = column.value;
      });
      timecard.push(line);
  });

  connection.on('connect', function(err){
    if (err) {
        console.log(err);
    } else {
        connection.execSql(request);
    }
  });
};

function getProjects(employee, startWeeks, endWeeks, peDates, res){
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
        res.send({success: true, userId: employee, startWeeks: startWeeks,
                  endWeeks: endWeeks, peDates: peDates, projects: projects, tasks: tasks});
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
    if (err) {
        console.log(err);
    } else {
        connection.execSql(request);
    }
  });
}

function alreadyIn(array, obj){
  for (i=0;i<array.length;i++) {
    if (array[i].proj == obj.proj){
      return true;
    }
  }
  return false;
}
