'use strict';

const fs = require('fs');

/**
 * Utilities for file system
 */
class FsUtils {
	static isDirSync(path) {
		if(!path) {
			return false;
		}

		try {
			var stats = fs.statSync(path);
			if(stats.isDirectory()) {
				return true;
			} else {
				return false;
			}
		} catch(err) {
			console.log('fail to check path is dir: %s', err.message);
		}
	}
}

// export
module.exports = FsUtils;
