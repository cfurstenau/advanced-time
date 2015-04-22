var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
var config = require('./../../config/sql.js');

//this file has all the database interactions

//to do some day: make a generic sql query function. may not be possible
//also could try making all the log in requests on one connection (see tedious docs)

//log in, step one
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
        //got the relevant dates, move on to their projects
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

//log in, step two
function getProjects(employee, startWeeks, endWeeks, peDates, res){
  var projects = [];
  var tasks = [];

  var connection = new Connection(config);
  var sql = "select DISTINCT(PJPENTEM.Pjt_entity) Task, PJPENT.pjt_entity_desc TaskDesc, " +
            "PJPENTEM.Project Proj, PJPROJ.project_desc ProjDesc, " +
            "PJPENT.pe_id01 TaskSub, PJPROJ.gl_subacct ProjSub, " +
						"PJPENT.pe_id03 EarnType, PJPROJ.alloc_method_cd BillTo " +
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
				res.send(500, {success: false});
      } else {
				//we've got what we can from this pull and started building the response
				//next step is get default GL Account info
        getGLDefaults({success: true, userId: employee, startWeeks: startWeeks,
                  endWeeks: endWeeks, peDates: peDates, projects: projects, tasks: tasks}, res);
      }
  });

  request.addParameter('employee',TYPES.VarChar, employee);


  request.on('row', function(columns) {
      var rowProject = {proj: columns[2].value.trim(), projDesc: columns[3].value.trim()};
      if (alreadyIn(projects, rowProject) == false){
        projects.push(rowProject);
      }


      var subAcct;
      if (columns[4].value.trim()){
        subAcct = columns[4].value.trim();
      } else {
        subAcct = columns[5].value.trim();
      }
			var billable;
			if (columns[7].value.trim()){
				billable = true;
			} else {
				billable = false;
			}

      tasks.push({task: columns[0].value.trim(), taskDesc: columns[1].value.trim(),
                  proj: columns[2].value.trim(), projDesc: columns[3].value.trim(),
                  subAcct: subAcct, earnType: columns[6].value.trim(), billable: billable});
  });

  connection.on('connect', function(err){
    if (err) {
        console.log(err);
    } else {
        connection.execSql(request);
    }
  });
}

//log in, step three
function getGLDefaults(responseObj, res){
	var defaultAcct;
	var connection = new Connection(config);
	var sql = "select gl_subacct, user1 from dbo.PJEMPLOY where employee = @employee";
	var request = new Request(sql, function(err, rowCount) {
		if (err) {
			console.log(err);
			res.send(500, {success: false});
		} else {
			addGLAccount(responseObj, res, defaultAcct, 0);
		}
	});
	request.addParameter('employee',TYPES.VarChar, responseObj.userId);
	request.on('row', function(columns) {
		responseObj.defaultSubacct = columns[0].value.trim();
		defaultAcct = columns[1].value.trim();
	});
	connection.on('connect', function(err){
		if (err) {
			console.log(err);
		} else {
			connection.execSql(request);
		}
	});
}

//log in, step four, called recursively because that's the only way I know how to handle multiple asyc calls
function addGLAccount(responseObj, res, defaultAcct, index){
	//add it for each task
		var eachTask = responseObj.tasks[index];

		if (eachTask.billable == false) {
			//non-billable projects look at the task for gl account
			var connection = new Connection(config);
			var sql = "select pe_id23 from dbo.PJPENTEX where project = @project " +
								"and pjt_entity = @task";

			var request = new Request(sql, function(err, rowCount) {
				if (err) {
					console.log(err);
					res.send(500, {success: false});
				} else {
					//if we're done, move on to labor cat
					if (index == responseObj.tasks.length - 1) {
						//get labor cat
						addLaborCat(responseObj, res);
					} else {
						addGLAccount(responseObj, res, defaultAcct, index+1);
					}
				}
			});

			request.addParameter('project',TYPES.VarChar, eachTask.proj);
			request.addParameter('task',TYPES.VarChar, eachTask.task);
			request.on('row', function(columns) {
				responseObj.tasks[index].glAccount = columns[0].value.trim();
			});
			connection.on('connect', function(err){
				if (err) {
					console.log(err);
				} else {
					connection.execSql(request);
				}
			});

		} else {
			//all other projects use employee default
			responseObj.tasks[index].glAccount = defaultAcct;
			if (index == responseObj.tasks.length - 1) {
				//get labor cat
				addLaborCat(responseObj, res);
			} else {
				addGLAccount(responseObj, res, defaultAcct, index+1);
			}
		}
}

//log in, step five, final step
function addLaborCat(responseObj, res){
	var laborCats = {};
	var connection = new Connection(config);
	var sql = "select project, labor_class_cd from dbo.PJEMPPJT where employee = @employee order by effect_date";
	var request = new Request(sql, function(err, rowCount) {
		if (err) {
			console.log(err);
			res.send(500, {success: false});
		} else {
			//apply options to response
			for (var i=0;i<responseObj.tasks.length;i++){
				if (responseObj.tasks[i].proj in laborCats) {
					responseObj.tasks[i].labcat = laborCats[responseObj.tasks[i].proj];
				} else {
					responseObj.tasks[i].labcat = laborCats.na;
				}
			}
			//send response
			res.send(responseObj);
		}
	});
	request.addParameter('employee',TYPES.VarChar, responseObj.userId);
	request.on('row', function(columns) {
		var tempArray = [];
		//build option object
		var rowObject = {proj: columns[0].value.trim(), labcat: columns[1].value.trim()};
		if (alreadyIn(tempArray, rowObject) == false){
			tempArray.push(rowObject);
			laborCats[rowObject.proj] = rowObject.labcat;
		}
	});
	connection.on('connect', function(err){
		if (err) {
			console.log(err);
		} else {
			connection.execSql(request);
		}
	});
}

module.exports.getTimecard = function(user, date, res) {
	var timecard = [];
	var docnbr;
	var connection = new Connection(config);
	var sql = "select project_desc projDesc, pjt_entity_desc taskDesc, day1_hr1 monHours, day2_hr1 tueHours, "+
						"day3_hr1 wedHours, day4_hr1 thuHours,day5_hr1 friHours, day6_hr1 satHours, day7_hr1 sunHours, "+
						"day1_hr2 monOT, day2_hr2 tueOT, day3_hr2 wedOT, day4_hr2 thuOT, "+
						"day5_hr2 friOT, day6_hr2 satOT, day7_hr2 sunOT, "+
						"PJLABDET.pjt_entity task, PJLABDET.project proj, "+
						"linenbr, PJLABHDR.docnbr, le_status status, le_type type, ld_desc comment "+
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
				res.send({success:true, timecard: timecard, docnbr: docnbr});
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
			docnbr = columns[19].value.trim();
	});

	connection.on('connect', function(err){
		if (err) {
				console.log(err);
		} else {
				connection.execSql(request);
		}
	});
};

//update timecard, distributes lines to be updated, created, or deleted
module.exports.updateTimecard = function(employee, timecard, docnbr, defaultSubacct, res){
	//idea: var sortedLines = {creates: [], deletes: [], updates: []}
	//handleLines(sortedLines)

	var connection = new Connection(config);
	var sql = "select pjt_entity from dbo.PJLABDET where docnbr = @docnbr";
	var request = new Request(sql, function(err, rowCount) {
		if (err) {
			console.log(err);
			res.send(500, {success: false});
		} else {
			//done with old lines, send remaining lines to be created
			for (var i=0;i<timecard.length;i++){
				createLine(docnbr, timecard[i], defaultSubacct);
			}
		}
	});
	request.addParameter('docnbr',TYPES.VarChar, docnbr);
	request.on('row', function(columns) {
		var foundFlag = false;
		var foundIndex;
		for (var i=0;i<timecard.length;i++) {
			if (columns[0].value.trim() == timecard[i].task.trim()){
				updateLine(docnbr, timecard[i]);
				foundFlag = true;
				foundIndex = i;
			}
		}
		if (!foundFlag){
			deleteLine(docnbr, columns[0].value.trim())
		} else {
			//timecard line has been updated, remove it from array
			timecard.splice(foundIndex, 1);
		}
	});
	connection.on('connect', function(err){
		if (err) {
			console.log(err);
		} else {
			connection.execSql(request);
		}
	});
};

//utility
function alreadyIn(array, obj){
	for (var i=0;i<array.length;i++) {
		if (array[i].proj == obj.proj){
			return true;
		}
	}
	return false;
}
