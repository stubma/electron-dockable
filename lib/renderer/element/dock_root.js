'use strict';

const DockUtils = require('../dock_utils');

/**
 * custom tag <dock-root>
 */
class DockRoot extends window.HTMLElement {
	static get tagName() {
		return "DOCK-ROOT";
	}

	createdCallback() {
		// add root dock node
		this.innerHTML = `<dock-node id="root"></dock-node>`;

		// save root node
		DockUtils.root = this.querySelector('#root');

		// set initial selected node to root
		if(window.isDebug()) {
			window.debugSelectedNode = DockUtils.root;
		}
	}
}

// export
module.exports = DockRoot;