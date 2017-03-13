'use strict';

/**
 * Class manages cache of resource files
 */
class ResourceManager {
	static hasResource(url) {
		return !!ResourceManager._cache[url];
	}

	static getResource(url) {
		return ResourceManager._cache[url];
	}

	static importResource(url) {
		let cached = ResourceManager._cache[url];
		if(cached !== undefined) {
			return new Promise(function(resolve) {
				resolve(cached);
			});
		} else {
			return ResourceManager._loadResourcePromise(url).then(
				ResourceManager._cacheResource.bind(this, url),
				ResourceManager._cacheResource.bind(this, url, undefined)
			);
		}
	}

	static importResources(urls) {
		if(!Array.isArray(urls)) {
			console.error('Call to `importResources` failed. The`urls` parameter must be an array');
		} else {
			let promises = [];
			for(let i = 0; i < urls.length; ++i) {
				let url = urls[i];
				promises.push(ResourceManager.importResource(url));
			}
			return Promise.all(promises);
		}
	}

	static _cacheResource(url, content) {
		if(content === undefined) {
			console.error(`Failed to load resource: ${url}`);
			ResourceManager._cache[url] = undefined;
			return "";
		} else {
			ResourceManager._cache[url] = content;
			return content;
		}
	}

	static _loadResourcePromise(url) {
		return new Promise(load);

		function load(resolve, reject) {
			let xhr = new window.XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.onreadystatechange = function(e) {
				if(xhr.readyState !== 4) {
					return;
				}

				// Testing harness file:/// results in 0.
				if([0, 200, 304].indexOf(xhr.status) === -1) {
					reject(new Error(`While loading from url ${url} server responded with a status of ${xhr.status}`));
				} else {
					resolve(e.target.response);
				}
			};
			xhr.send();
		}
	}
}

// cache
ResourceManager._cache = {};

// export
module.exports = ResourceManager;