'use strict';

const path = require('path');
const fs = require('fs');
const URL = require('url');
const { app, protocol } = require('electron');
const PackageManager = require('./pkg_mgr');
const EDockConfig = require('./edock_cfg');
const FsUtils = require('./fs_utils');

/**
 * EDock manages dock states for a window
 */
class EDock {
	/**
	 * init some static members
	 */
	constructor(rootWin, appPath = null) {
		// process
		this.isMain = !!rootWin;

		// root window, only useful in main process
		this.rootWin = rootWin;

		// current theme name
		this.theme = 'default';

		// default protocol scheme
		this._defaultSchemes = [
			'http:',
			'https:',
			'ftp:',
			'ssh:',
			'file:'
		];

		// registered schemes
		// key is scheme name, value is resolver function
		this._registeredSchemes = {};

		// path of electron-dockable framework
		this.frameworkPath = path.join(__dirname, '..');

		// load package.json
		this._pkgJson = JSON.parse(fs.readFileSync(path.join(this.frameworkPath, 'package.json')));

		// path of electron app
		this.appPath = !!appPath ? appPath : app.getAppPath();

		// register custom file protocol to electron
		this._registerCustomFileProtocols();

		// theme search paths
		this.themePaths = [
			this.url2path(this._pkgJson.name + '://themes'),
			this.url2path('app://themes')
		];

		// register panels
		this.config = new EDockConfig();
		if(this.isMain) {
			this._registerAppPanels();
		}
	}

	static makeWindowDockable(win) {
		win.edock = new EDock(win);
	}

	static isDebug() {
		return process.env.NODE_ENV != 'production'
	}

	static get isWin32() {
		return process.platform === 'win32';
	}

	static get isMacOS() {
		return process.platform === 'darwin';
	}

	/**
	 * return name of this framework
	 */
	get frameworkName() {
		return this._pkgJson.name;
	}

	/**
	 * register a package to framework, the package json will be loaded and cached
	 * for later use. the EDock config will be loaded.
	 * @param pkgName package name
	 */
	registerPanels(pkgName) {
		let pkgPath = this.url2path('package://' + pkgName);
		this.config.addConfig(pkgPath);
	}

	/**
	 * register panels in app packages
	 * @private
	 */
	_registerAppPanels() {
		this.config.addConfig(this.appPath);
	}

	_registerCustomFileProtocols() {
		if(this.isMain) {
			// register scheme of framework name
			protocol.registerFileProtocol(this.frameworkName, (request, cb) => {
				if(!request.url) {
					cb(-3); // ABORTED
				} else {
					cb(this._framework2path(request.url));
				}
			}, err => {
				if(err) {
					console.error('failed to register protocol %s, %s', this.frameworkName, err.message);
				} else {
					console.log('protocol %s registered', this.frameworkName);
				}
			});

			// register for access app resources
			protocol.registerFileProtocol('app', (request, cb) => {
				if(!request.url) {
					cb(-3); // ABORTED
				} else {
					cb(this._app2path(request.url));
				}
			}, err => {
				if(err) {
					console.error('Failed to register protocol app, %s', err.message);
				} else {
					console.log('protocol app registered');
				}
			});

			// register for access package resources
			// example: package://electron-dockable/themes/button.css
			protocol.registerFileProtocol('package', (request, cb) => {
				// null check
				if(!request.url) {
					cb(-3); // ABORTED
				} else {
					cb(this._package2path(request.url));
				}
			}, err => {
				if(err) {
					console.error('Failed to register protocol package, %s', err.message);
				} else {
					console.log('protocol package registered');
				}
			});

			// register protocol theme://
			protocol.registerFileProtocol('theme', (request, cb) => {
				// null check
				if(!request.url) {
					cb(-3); // ABORTED
				} else {
					let filePath = this._theme2path(request.url);
					if(!filePath) {
						cb(-6); // net::ERR_FILE_NOT_FOUND
					} else {
						cb(filePath);
					}
				}
			}, err => {
				if(err) {
					console.error('Failed to register protocol theme, %s', err.message);
				} else {
					console.log('protocol theme registered');
				}
			});
		}

		// register internally
		this._registeredSchemes[this.frameworkName + ':'] = this._framework2path;
		this._registeredSchemes['app:'] = this._app2path;
		if(this.isMain) {
			this._registeredSchemes['theme:'] = this._theme2path;
			this._registeredSchemes['package:'] = this._package2path;
		}
	}

	/**
	 * resolve a custom scheme url into filesystem path
	 * @param url url which can have custom schemes, you must register the scheme first.
	 *        for a standard url, it just return without changes
	 */
	url2path(url) {
		let uri = URL.parse(url);
		if(this._defaultSchemes.indexOf(uri.protocol) !== -1) {
			return url;
		} else {
			let f = this._registeredSchemes[uri.protocol];
			if(f) {
				return f.call(this, url);
			} else {
				return url;
			}
		}
	}

	_framework2path(_url) {
		// resolve url
		let url = decodeURIComponent(_url);
		let uri = URL.parse(url);
		let relativePath = uri.hostname;
		if(uri.pathname) {
			relativePath = path.join(relativePath, uri.pathname);
		}

		// return file path
		return path.join(this.frameworkPath, relativePath);
	}

	_app2path(_url) {
		// resolve url
		let url = decodeURIComponent(_url);
		let uri = URL.parse(url);
		let relativePath = uri.hostname;
		if(uri.pathname) {
			relativePath = path.join(relativePath, uri.pathname);
		}

		// return file path
		return path.join(this.appPath, relativePath);
	}

	_theme2path(_url) {
		// resolve path
		let url = decodeURIComponent(_url);
		let uri = URL.parse(url);
		let relativePath = uri.hostname;
		if(uri.pathname) {
			relativePath = path.join(relativePath, uri.pathname);
		}

		// search theme in every search path
		let filePath;
		for(let i = 0; i < this.themePaths.length; ++i) {
			let searchPath = path.join(this.themePaths[i], this.theme);
			if(FsUtils.isDirSync(searchPath)) {
				filePath = path.join(searchPath, relativePath);
				break;
			}
		}

		// return file path
		return filePath;
	}

	_package2path(_url) {
		// check package name, hostname part should be a package name
		let url = decodeURIComponent(_url);
		let uri = URL.parse(url);
		let packagePath = PackageManager.getPath(uri.hostname);
		if(!packagePath) {
			return cb(-6); // net::ERR_FILE_NOT_FOUND
		}

		// get package json info
		let packageInfo = PackageManager.getJson(packagePath);
		if(!packageInfo) {
			return cb(-6); // net::ERR_FILE_NOT_FOUND
		}

		// pass file path to callback
		// if it is a test package, use package path directly
		if(uri.pathname.indexOf('/test') === 0) {
			return path.join(packagePath, uri.pathname);
		} else {
			return path.join(packageInfo._destPath, uri.pathname);
		}
	}
}

// export
module.exports = EDock;
