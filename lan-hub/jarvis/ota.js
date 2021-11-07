import util from 'util'
import cp from 'child_process'
import {app} from '../http/server.js'


const exec = util.promisify(cp.exec)

const HTTP_STATUS_OK = 200

/*
app.post('/ota', (req, res) => {
    console.log('--- POST ---')
    console.log(req.header("accept"));
    console.log(req.header("expect"));
    console.log('req.query', req.query)
    console.log('req.body', req.body)
	//res.status(HTTP_STATUS_OK).send('OK')
	//res.status(100).send()
  // was this a conditional request?
  if (req.checkContinue === true) {
    req.checkContinue = false;
    // send 100 Continue response
    res.writeContinue();
    
    // client will now send us the request body
  }
	res.writeContinue()

	var chunks = []
	req.once('readable', () => {
		var chunk
		while ((chunk = req.read()) !== null) {
			chunks.push(chunk)
		}
		console.log('chunks', chunks)
		req.on('chunk', () => {
			console.log('chunk')
		})
		req.on('end', () => {
			console.log('end')
		})
	})

})
*/


var express = require('express');    //Express Web Server 
var busboy = require('connect-busboy'); //middleware for form/file upload
var path = require('path');     //used for file path
var fs = require('fs-extra');       //File System - for file manipulation

var app = express();
app.use(busboy());
app.use(express.static(path.join(__dirname, 'public')));

/* ========================================================== 
Create a Route (/upload) to handle the Form submission 
(handle POST requests to /upload)
Express v4  Route definition
============================================================ */
app.post('/ota', (req, res) => {

	var fstream;
	req.pipe(req.busboy);
	req.busboy.on('file', function (fieldname, file, filename) {
		console.log("Uploading: " + filename);

		//Path where image will be uploaded
		fstream = fs.createWriteStream(__dirname + '/img/' + filename);
		file.pipe(fstream);
		fstream.on('close', function () {    
			console.log("Upload Finished of " + filename);              
			res.redirect('back');           //where to go next
		});
	});
});










async function runOta(deviceName) {
    console.log('~ runOta', deviceName)
	// log last commit id
	await exec('mos build --platform esp32')
}
/*
mos build --platform esp32
curl -v -F file=@build/fw.zip http://jarvis-iot-testlight.lan/update
*/