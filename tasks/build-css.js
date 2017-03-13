'use strict';

const Async = require('async');
const globby = require('globby');
const Path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const yargs = require('yargs');
const Less = require('less');
const LessPluginCleanCSS = require('less-plugin-clean-css');

// command line options
yargs.help('help').options({
	'min' : {
		type : 'boolean',
		global : true,
		desc : 'Build compress version.'
	},
});

// some variables
let argv = yargs.argv;
let srcDir = './styles';
let destDir = './themes/default';
let absSrcDir = Path.resolve(srcDir);

// create a clean dest dir
fs.emptyDirSync(destDir);

Async.series([
	// build less
	next => {
		let paths = globby.sync([
			`${srcDir}/**/*.less`,
			`!${srcDir}/*.less`,
			`!${srcDir}/themes/**/*.less`,
		]);
		Async.eachSeries(paths, (path, done) => {
			path = Path.normalize(path);

			let relpath = Path.relative(absSrcDir, path);
			let content = fs.readFileSync(path, { encoding : 'utf8' });
			let dest = Path.join(destDir, Path.dirname(relpath), Path.basename(relpath, '.less')) + '.css';

			process.stdout.write(chalk.blue('compile ') + chalk.cyan(relpath) + ' ...... ');

			let plugins;
			if(argv.min) {
				plugins = [
					new LessPluginCleanCSS({
						advanced : true,
					})
				];
			} else {
				plugins = [];
			}

			Less.render(content, {
				paths : ['./styles'],
				plugins : plugins,
			}, (e, output) => {
				if(e) {
					process.stdout.write(chalk.red('error\n'));
					done(e);
					return;
				}

				fs.ensureDirSync(Path.dirname(dest));
				fs.writeFileSync(dest, output.css, 'utf8');

				process.stdout.write(chalk.green('done\n'));
				done();
			});
		}, next);
	},

	// copy other files
	next => {
		let paths = globby.sync([
			`${srcDir}/**/*.*`,
			`!${srcDir}/**/*.less`
		]);
		Async.eachLimit(paths, 5, (path, done) => {
			path = Path.normalize(path);

			let relpath = Path.relative(absSrcDir, path);
			let content = fs.readFileSync(path);
			let dest = Path.join(destDir, relpath);

			process.stdout.write(chalk.blue('copy ') + chalk.cyan(relpath) + ' ...... ');

			fs.ensureDirSync(Path.dirname(dest));
			fs.writeFileSync(dest, content);

			process.stdout.write(chalk.green('done\n'));
			done();
		}, next);
	}
], err => {
	if(err) {
		console.error(chalk.red(err));
	}

	console.log(chalk.green('finish'));
});

