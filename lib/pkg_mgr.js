'use strict';

const path = require('path');
const fs = require('fs');

/**
 * It maintains a cache for package info
 */
class PackageManager {
	constructor() {
	}

	/**
	 * is this package json is loaded or not
	 * @param pkgNameOrPath package name or path
	 * @returns {boolean} true means loaded
	 */
	static isLoaded(pkgNameOrPath) {
		return !!PackageManager._namePathMap[pkgNameOrPath] || !!PackageManager._pathJsonMap[pkgNameOrPath];
	}

	/**
	 * load package json
	 * @param pkgName package name
	 */
	static load(pkgPath, cb) {
		// check existence
		if(PackageManager.isLoaded(pkgPath)) {
			return;
		}

		// load package.json
		let pkgJsonPath = path.join(pkgPath, 'package.json');
		let pkgJson;
		try {
			pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath));
		} catch(err) {
			if(cb) {
				cb(new Error(`Failed to load 'package.json': ${err.message}`));
			}
			return;
		}

		// save json
		let pkgName = pkgJson.name;
		PackageManager._namePathMap[pkgName] = pkgPath;
		PackageManager._pathJsonMap[pkgPath] = pkgJson;

		// return json object
		return pkgJson;
	}

	/**
	 * get package name from package name
	 * @param pkgName package name
	 * @returns path or null if package is not loaded
	 */
	static getPath(pkgName) {
		return PackageManager._namePathMap[pkgName];
	}

	/**
	 * get package json from package path
	 * @param pkgPath package path
	 * @returns json object of 'package.json' or null if package is not loaded
	 */
	static getJson(pkgPath) {
		return PackageManager._pathJsonMap[pkgPath];
	}
}

// map from package name to path
PackageManager._namePathMap = {};

// map from package path to package json
PackageManager._pathJsonMap = {};

// export
module.exports = PackageManager;
