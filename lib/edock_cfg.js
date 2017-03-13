'use strict';

const PackageManager = require('./pkg_mgr');

/**
 * it represents the 'edock' keyword in package.json
 */
class EDockConfig {
	constructor() {
		// map from panel id to panel info
		this._idPanelMap = {};
	}

	/**
	 * add a edock configuration to global
	 * @param pkgName package name
	 */
	addConfig(pkgPath) {
		// load package json
		let pkgJson = PackageManager.load(pkgPath);

		// if has edock config
		if(!!pkgJson.edock) {
			// iterate panel info
			let cfgJson = pkgJson.edock;
			if(!!cfgJson.panels) {
				for(let i in cfgJson.panels) {
					// get panel id, if null, get title as id
					let pJson = cfgJson.panels[i];
					let pid = pJson.id;
					if(pid == null) {
						pid = pJson.title;
					}

					// check id conflict
					if(!!this._idPanelMap[pid]) {
						console.warn("Panel %s is already registered, can not add duplicate panel", pid);
					} else {
						// save panel json with package name appended
						pJson.pkgName = pkgJson.name;
						pJson.pkgPath = pkgPath;
						this._idPanelMap[pid] = pJson;
					}
				}
			}
		}
	}

	/**
	 * get panel info by panel id
	 * @param pid panel id
	 */
	getPanelInfo(pid) {
		return this._idPanelMap[pid];
	}
}

// export
module.exports = EDockConfig;