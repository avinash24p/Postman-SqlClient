
const os = require('os');
const Request = require("request");
const handle_db = require('../lib/db')
const configObj = require('../lib/config')
const Moment = require('moment');
const MomentRange = require('moment-range');
const axios = require('axios');
const moment = MomentRange.extendMoment(Moment);
const StringDecoder = require('string_decoder').StringDecoder;
var asyncLoop = require('node-async-loop');
var rp = require('request-promise');


//-----------------------------------------------api-sql page call------------------------------------------------------
exports.action = async function (req, res) {
    var message = '';
    if (req.method == "POST") {
        var post = req.body;
        var activeObject = post.active;

        if (activeObject === 'dbs') {

            var query = post.sql;
            var dbName = post.dbSelect.toLowerCase();
            console.log(dbName);

            handle_db.handleDBPool(dbName, query, function (err, data) {
                if(err){
                    res.send(err); 
                }else{
                res.send(data);
                }
            });

        } 
        // else if (activeObject === 'log') {

        //     // del.sync('./public/append4.log', {
        //     //     force: true
        //     // });

        //     var dataCheckBox =  post.myCheckboxes;
        //     var _instance = dataCheckBox.substr(0,dataCheckBox.indexOf(','))
        //     var _instanceMP = dataCheckBox.substr(dataCheckBox.indexOf(',')+1,dataCheckBox.length)
        //     console.log(_instanceMP)
        //     let _mpObj = _instanceMP.split(",").reduce(function(obj, str, index) {
        //         let strRequest = str+'Request';
        //         let strResponse = str+'Response';

        //         obj[strRequest] = (_instance==='pumaRadio')?configObj.pumaLogs[strRequest]:(_instance==='coracleRadio')?configObj.coracleLogs[strRequest]:(_instance==='APACERadio')?configObj.apaceLogs[strRequest]:0; 
        //         obj[strResponse] = (_instance==='pumaRadio')?configObj.pumaLogs[strResponse]:(_instance==='coracleRadio')?configObj.coracleLogs[strResponse]:(_instance==='APACERadio')?configObj.apaceLogs[strResponse]:0; 
        //         return obj;
        //       }, {});

        //       console.log(_mpObj)

        //     var start = post.start.trim().replace(" ", "_");
        //     var end = post.end.trim().replace(" ", "_");

        //     start = start.substr(0, start.indexOf(":"))
        //     end = end.substr(0, end.indexOf(":"))

        //     console.log(start, ' ', end);
        //     var sku = post.sku.trim();

        //     let _data = await logs(start, end, sku, _mpObj)
        //    // console.log(_data);
        //   //  fse.writeFileSync('./public/append4.log', _data, 'utf8');
        //     res.send(_data);

        //     //    unlinkIfUnused('../append4.log')


        // } 
        else {

            var baseURL = post.baseURL;
            var headers = post.headers;
            var method = post.method;
            var body = post.body;

            console.log(post);
            if (headers.length !== 0) {
                let foo = headers.trim().split(";").reduce(function (obj, str, index) {
                    let strParts = str.split(":");
                    if (strParts[0] && strParts[1]) { //<-- Make sure the key & value are not undefined
                        obj[strParts[0].replace(/\s+/g, '')] = strParts[1].trim(); //<-- Get rid of extra spaces at beginning of value strings
                    }
                    return obj;
                }, {});

                console.log(foo);
                headers = foo;
            }
            var options = {
                url: baseURL,
                method: method,
                headers: headers,
                body: body,
                agent: false,
                pool: {
                    maxSockets: 100
                }
            }

            Request(options, function (error, response, body) {
                if (error) {
                    res.send({
                        'Error': 'bad request'
                    });
                } else {
                    //  res.setContentType('Content-Type':'application/json');
                    res.status(response.statusCode).send(body);
                }
            });
        }
    } else {
        res.render('action', {
            message: ''
        });
    }

};


//==============================================check if file is written completely-=====================================

var exec = require('child_process').exec;

function unlinkIfUnused(path) {
    exec('lsof ' + path, function (err, stdout, stderr) {
        if (stdout.length === 0) {
            console.log(path, " not in use. unlinking...");
            return true;
            // fs.unlink...
        } else {
            console.log(path, "IN USE. Ignoring...");
            return false;
        }
    });
}


//-----------------------------------------------logs page call------------------------------------------------------------------------------------------------

var logs = async function (start, end, sku, _mpObj) {

    var parseStart = getDate(start);
    var parseEnd = getDate(end);

    var startRange = parseStart[0] + ' ' + parseStart[1] + ':00'
    var endRange = parseEnd[0] + ' ' + parseEnd[1] + ':00'

    console.log('start : ', startRange, ' end : ', endRange)
    const range = moment.range(startRange, endRange);

    var loopString = '';
    var buffer = '';
    var decoder = new StringDecoder('utf-8');




    //loop through config objects

    loop1: for (var key in _mpObj) {
        //   async.forEachOf(configObj.pumaLogs, async (value, key, callback) => {
        //  console.log(key,value)
        //  await delay()


        loop2: for (var month of range.by('hour')) {
            var appendLogText = month.format('DD-MM-YYYY_HH') + '.log'.toString();
            loopString = _mpObj[key] + appendLogText;
            console.log(loopString)
            var _dataGet;
            try{
                 _dataGet= await axios(loopString);
            }catch(err){
                console.log('Response status not 200 for ',loopString)
                continue loop2;
            }
            // console.log(_dataGet.data);

            if (_dataGet.status !== 200) {
                console.log('Response status not 200 for ',loopString)
                continue loop2;
            }

                var _temp = [];
                var searchString = sku;
                var array = _dataGet.data.toString().toLowerCase().split('\n');
                //  asyncLoop(array,  function (line, next){
                for (let line = 0; line < array.length; line++) {
                    array[line] = array[line].replace(/\\/g,'')
                    //  console.log(line)
                    _temp.push(array[line]);
                    
                    if (array[line].indexOf(searchString) > -1) {
                       
                        if (loopString.indexOf(configObj.pumaLogs.pumaResponse)>-1) {
                            searchString = '"' + searchString + '"' + ':"updated"'
                         //   console.log(array[line])
                            if(array[line].indexOf(searchString) > -1){
                            console.log("Searching for ", searchString)
                            var _prevLine = _temp[_temp.length - 2];

                            var _dateTime = _prevLine.substr(_prevLine.indexOf("["), _prevLine.indexOf("]") + 1)
                            console.log(loopString, ' = > ', _dateTime, array[line], '\n\n')
                            buffer += decoder.write('<strong>' +loopString +' = > ' + _dateTime +'</strong><br><em>'+ array[line] + '</em></br></br>')
                            continue loop1;
                            }

                        } else if(loopString.indexOf(configObj.pumaLogs.myntraRequest) > -1 || loopString.indexOf(configObj.pumaLogs.myntraResponse) > -1 
                        || loopString.indexOf(configObj.coracleLogs.myntraRequest) > -1 || loopString.indexOf(configObj.coracleLogs.myntraResponse) > -1
                        || loopString.indexOf(configObj.apaceLogs.myntraResponse) > -1 || loopString.indexOf(configObj.apaceLogs.myntraRequest) > -1){
                            if(array[line].indexOf(searchString)>-1 && array[line].indexOf('inventorycount')>-1){
                                var _dateTime = array[line].substr(array[line].search("["), array[line].indexOf("]") + 1)
                                console.log("Searching for ", searchString)
                                console.log(loopString, ' = > ', _dateTime, '\n\n')
                                buffer += decoder.write('<strong>' +loopString +' = > ' + _dateTime +'</strong><br><em>'+ array[line] + '</em></br></br>')
                                continue loop1;
                            }

                        } else if(loopString.indexOf(configObj.pumaLogs.paytmRequest) > -1 || loopString.indexOf(configObj.coracleLogs.paytmRequest) > -1 || loopString.indexOf(configObj.apaceLogs.paytmRequest) > -1){
                            if(array[line].indexOf(searchString)>-1 && array[line].indexOf('request data')>-1 && array[line].indexOf('inventory')>-1){
                                var _dateTime = array[line].substr(array[line].indexOf("["), array[line].indexOf("]") + 1)
                                console.log("Searching for ", searchString)
                                console.log(loopString, ' = > ', _dateTime, '\n\n')
                                buffer += decoder.write('<strong>' +loopString +' = > ' + _dateTime +'</strong><br><em>'+ array[line] + '</em></br></br>')
                                continue loop1;
                            }

                        } else if(loopString.indexOf(configObj.pumaLogs.paytmResponse) > -1 || loopString.indexOf(configObj.coracleLogs.paytmResponse) > -1 || loopString.indexOf(configObj.apaceLogs.paytmResponse) > -1){
                            if(array[line].indexOf(searchString)>-1 && array[line].indexOf('"message":"success","action":"updated"')>-1){
                                var _dateTime = array[line].substr(array[line].indexOf("["), array[line].indexOf("]") + 1)
                                console.log("Searching for ", searchString)
                                console.log(loopString, ' = > ', _dateTime, '\n\n')
                                buffer += decoder.write('<strong>' +loopString +' = > ' + _dateTime +'</strong><br><em>'+ array[line] + '</em></br></br>')
                                continue loop1;
                            }

                        }else if(loopString.indexOf(configObj.pumaLogs.flipkartRequest) > -1 || loopString.indexOf(configObj.coracleLogs.flipkartRequest) > -1 || loopString.indexOf(configObj.apaceLogs.flipkartRequest) > -1){
                            if(array[line].indexOf(searchString)>-1){
                                var _dateTime = array[line].substr(array[line].indexOf("["), array[line].indexOf("]") + 1)
                                console.log("Searching for ", searchString)
                                console.log(loopString, ' = > ', _dateTime, '\n\n')
                                buffer += decoder.write('<strong>' +loopString +' = > ' + _dateTime +'</strong><br><em>'+ array[line] + '</em></br></br>')
                                continue loop1;
                            }

                        }else if(loopString.indexOf(configObj.pumaLogs.flipkartResponse) > -1 || loopString.indexOf(configObj.coracleLogs.flipkartResponse) > -1 || loopString.indexOf(configObj.apaceLogs.flipkartResponse) > -1){
                            if(array[line].indexOf(searchString) >-1 && array[line].indexOf('"status":"updated","errors":[]')>-1){
                                var _dateTime = array[line].substr(array[line].indexOf("["), array[line].indexOf("]") + 1)
                                console.log("Searching for ", searchString)
                                console.log(loopString, ' = > ', _dateTime, '\n\n')
                                buffer += decoder.write('<strong>' +loopString +' = > ' + _dateTime +'</strong><br><em>'+ array[line] + '</em></br></br>')
                                continue loop1;
                            }

                        }else if(loopString.indexOf(configObj.pumaLogs.amazonResponse) > -1 || loopString.indexOf(configObj.coracleLogs.amazonResponse) > -1 || loopString.indexOf(configObj.apaceLogs.amazonResponse) > -1){
                            if(array[line].indexOf(searchString)>-1 && array[line].indexOf('updated successfully')>-1){
                                var _dateTime = array[line].substr(array[line].indexOf("["), array[line].indexOf("]") + 1)
                                console.log("Searching for ", searchString)
                                console.log(loopString, ' = > ', _dateTime, '\n\n')
                                buffer += decoder.write('<strong>' +loopString +' = > ' + _dateTime +'</strong><br><em>'+ array[line] + '</em></br></br>')
                                continue loop1;
                            }
                        
                        }
                        // else {

                        //     var _dateTime = array[line].substr(array[line].indexOf("["), array[line].indexOf("]") + 1)
                        //     console.log("Searching for ", searchString)
                        //     console.log(loopString, ' = > ', _dateTime, '\n\n')
                        //     buffer += decoder.write('<strong>' +loopString +' = > ' + _dateTime +'</strong><br><em>'+ array[line] + '</em></br></br>')
                        //     continue loop1;

                        // }
                    }
                }
            
        }
        console.log('End of monemt range')
        continue loop1;
       
    }
    buffer += decoder.end();
    return buffer;
}


function delay() {
    return new Promise(resolve => setTimeout(resolve, 300));
}

async function getLogs(loopString, searchString, cb) {


    var options = {
        method: 'GET',
        uri: loopString
    };


    var _temp = [];
    rp(options)
        .then(async function (body) {
            //if (!error && response.statusCode == 200) {
            var array = body.toString().split('\n')
            asyncLoop(array, function (line, next) {
                // for(let line=0;line<array.length; line++) {

                //  console.log(line)
                _temp.push(line);
                if (line.indexOf(searchString) > -1) {

                    if (loopString.indexOf(configObj.pumaLogs.pumaResponse) > -1) {
                        searchString = '"' + searchString + '"' + ':"Updated"'
                        console.log("Searching for ", searchString)
                        var _prevLine = _temp[_temp.length - 2];

                        var _dateTime = _prevLine.substr(_prevLine.indexOf("["), _prevLine.indexOf("]") + 1)
                        console.log(loopString, ' = > ', _dateTime, line, '\n\n')
                        //   break;
                        // await delay()
                        return cb(200, _dateTime)
                        //  cb(200, _dateTime);
                    } else {
                        // _temp.pop(line);
                        var _dateTime = line.substr(line.indexOf("["), line.indexOf("]") + 1)
                        console.log("Searching for ", searchString)
                        console.log(loopString, ' = > ', _dateTime, '\n\n')
                        //  break;
                        return cb(200, _dateTime)
                    }
                } else {
                    next()
                }
            })
            //  }
        }).catch(function (err) {
            // POST failed...
        });

    var callback = function (sc, data) {
        cb(sc, data)
    }

    //  Request(options, callback)

}

const options = {
    flag: 'a'
};
const fse = require('fs');
async function writeToFile(text, file) {
    await fse.appendFileSync(file, `${text}${os.EOL}`);
}

function getDate(logDate) {
    var hour = logDate.substr(logDate.indexOf('_') + 1, logDate.length);
    var dd = logDate.substr(0, logDate.indexOf('_'));
    dd = dd.split("-").reverse().join("-")
    console.log(hour);
    console.log(dd);

    return [dd, hour];

}





process.on('uncaughtException', function (err) {
    console.log('Uncaught Exception', err);
});




