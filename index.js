'use strict';

const chalk = require('chalk');
const EDock = require('./lib/edock');

// this will prevent default electron uncaughtException
process.removeAllListeners('uncaughtException');
process.on('uncaughtException', err => {
	console.log(chalk.red.inverse.bold('Uncaught Exception: ') + chalk.red(err.stack || err));
});

// export
module.exports = EDock;