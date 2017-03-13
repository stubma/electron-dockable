'use strict';

const DomUtils = require('../dom_utils');
const DockUtils = require('../dock_utils');
const ResourceManager = require('../res_mgr');

/**
 * custom tag <dock-root>
 */
class DockPanelFrame extends window.HTMLElement {
	static get tagName() {
		return "DOCK-PANEL-FRAME";
	}

	createdCallback() {
		// create shadow dom
		this.attachShadow({ mode : 'open' });
	}

	/**
	 * set panel inner html by a template url, if the template is not loaded yet, it
	 * will be loaded first
	 * @param tpl template url
	 */
	set template(tpl) {
		if(!!tpl) {
			if(ResourceManager.hasResource(tpl)) {
				this._setInnerHTML(tpl);
			} else {
				ResourceManager.importResource(tpl).then(() => {
					this._setInnerHTML(tpl);
				});
			}
		} else {
			this._setInnerHTML(eDockR.frameworkName + "://static/default-panel.html");
		}
	}

	get panelId() {
		return this.getAttribute("panel-id");
	}

	get active() {
		return this.style.display != "none";
	}

	set active(val) {
		if(val) {
			this.style.display = "flex";
		} else {
			this.style.display = "none";
		}
	}

	_setInnerHTML(template) {
		// get shadow root
		let root = this.shadowRoot;

		// set template
		root.innerHTML = ResourceManager.getResource(template);

		// insert style
		root.insertBefore(
			DomUtils.createStyleElement('theme://elements/dock-panel-frame.css'),
			root.firstChild
		);
	}
}

// export
module.exports = DockPanelFrame;