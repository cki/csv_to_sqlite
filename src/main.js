const sqlite3 = require('sqlite3').verbose();
const { Writable } = require('stream');

const fileLib = require('./files');
const dbLib = require('./db');
const parser = require('./parser');

module.exports = createDB;
async function createDB(csvFilePath, sqliteFilePath, 
			appendToSqliteDB,
			tablename, separator) {

    let csvExists = await fileLib.fileExists(csvFilePath); 
    let sqliteExists = await fileLib.fileExists(sqliteFilePath);

    if (!csvExists) 
	throw new Error('CSVFileDoesNotExist');

    if (!appendToSqliteDB && sqliteExists)
	throw new Error('SQLFileExists');
    
    if (appendToSqliteDB) 
	throw new Error('Unimplemented');

    let db = new sqlite3.Database(sqliteFilePath);

    // get headline, create table and prepare statement for insert
    const parsedStream = parser(csvFilePath, separator);
    const insertStream = new InsertStream(db, tablename);

    return new Promise( (resolve) => {
	parsedStream.on('end', resolve);
	parsedStream.pipe(insertStream);
    });
}


class InsertStream extends Writable {
    constructor(db, tablename) {
	super({highWaterMark: 5, objectMode: true})
	this.db = db;
	this.insertStmt = false,
	this.tablename = tablename;
    }
    async _write(splits, encoding, next) {
	// first result creates table
	if (!this.insertStmt) {
	    this.insertStmt = await this.create(splits);
	}
	// other results insert into table
	else {
	    await this.insert(splits);
	}
	next();
    }
    async create(columns) {
	await dbLib.create(this.db, this.tablename, columns);
	return dbLib.createInsertStmt(this.db, this.tablename, columns);
    }
    async insert(values) {
	await new Promise( (resolve) => {
	    this.insertStmt.run(values, resolve);
	});
    }
}
