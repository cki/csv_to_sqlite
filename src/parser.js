const fs = require('fs')
const csv = require('csv-parser')

function turnObjectIntoArray(obj) {
    return Object.keys(obj).map(function(key) {
	return obj[key];
    });
}

module.exports.getHeadline = getHeadline;
async function getHeadline(path) {
    return new Promise( (resolve) => {
	const readstream = fs.createReadStream(path);
	const csvstream = csv({ separator: '|', headers: false});
	let firstRow = true;

	csvstream
	    .on('data', (data) => {
		readstream.close();
		if(firstRow) {
		    resolve(turnObjectIntoArray(data));
		    firstRow = false;
		}
	    })
	    .on('end', () => {
		console.log('END');
	    });

	readstream.pipe(csvstream);
    });
}

module.exports.getTaillines = getTaillines;
function getTaillines(path, cb, endCB) {
    return new Promise( (resolve) => {
	const readstream = fs.createReadStream(path);
	const csvstream = csv({ separator: '|', headers: false, skipLines: 1});

	csvstream
	    .on('data', (data) => {
		cb(turnObjectIntoArray(data));
	    })
	    .on('end', () => {
		endCB();
	    });

	readstream.pipe(csvstream);
    });
}


