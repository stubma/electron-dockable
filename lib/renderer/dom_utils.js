'use strict';

const ResourceManager = require('./res_mgr');

/**
 * Utilities for manipulate dom tree
 */
class DomUtils {
	/**
	 * @method createStyleElement
	 * @param {string} url
	 *
	 * Load `url` content and create a style element to wrap it.
	 */
	static createStyleElement(url) {
		// get resource from cache
		let content = ResourceManager.getResource(url) || '';
		if(!content) {
			console.error(`${url} not preloaded`);
			return null;
		}

		// create style
		let styleElement = document.createElement('style');
		styleElement.type = 'text/css';
		styleElement.textContent = content;

		// return
		return styleElement;
	}

	static removeAllChildren(element) {
		while(element.firstChild) {
			element.removeChild(element.firstChild);
		}
	}

	/**
	 * trigger a custom event
	 * @param element event start element
	 * @param eventName event name
	 * @param opts event option
	 */
	static fire(element, eventName, opts) {
		opts = opts || {};
		element.dispatchEvent(new window.CustomEvent(eventName, opts));
	}

	/**
	 * @method addDragGhost
	 * @param {String} cursor - CSS cursor
	 *
	 * Add a dragging mask to keep the cursor not changed while dragging
	 */
	static addDragGhost(cursor) {
		// add drag-ghost
		if(DomUtils._dragGhost === null) {
			DomUtils._dragGhost = document.createElement('div');
			DomUtils._dragGhost.classList.add('drag-ghost');
			DomUtils._dragGhost.style.position = 'absolute';
			DomUtils._dragGhost.style.zIndex = '999';
			DomUtils._dragGhost.style.top = '0';
			DomUtils._dragGhost.style.right = '0';
			DomUtils._dragGhost.style.bottom = '0';
			DomUtils._dragGhost.style.left = '0';
			DomUtils._dragGhost.oncontextmenu = function() {
				return false;
			};
		}
		DomUtils._dragGhost.style.cursor = cursor;
		document.body.appendChild(DomUtils._dragGhost);

		return DomUtils._dragGhost;
	}

	/**
	 * @method removeDragGhost
	 *
	 * Remove the dragging mask
	 */
	static removeDragGhost() {
		if(DomUtils._dragGhost !== null) {
			DomUtils._dragGhost.style.cursor = 'auto';
			if(DomUtils._dragGhost.parentElement !== null) {
				DomUtils._dragGhost.parentElement.removeChild(DomUtils._dragGhost);
			}
			DomUtils._dragGhost = null;
		}
	}
}

// static members
DomUtils._dragGhost = null;

// export
module.exports = DomUtils;
