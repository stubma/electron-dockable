'use strict';

const DomUtils = require('../dom_utils');
const DockUtils = require('../dock_utils');

/**
 * custom tag <dock-tab-bar>, it display dock view tabs
 */
class DockTabBar extends window.HTMLElement {
	static get tagName() {
		return "DOCK-TAB-BAR";
	}

	createdCallback() {
		// create shadow dom, append content and set style
		let root = this.attachShadow({ mode : 'open' });
		root.innerHTML = `
			<div class="border">
				<div id="content" class="tab-bar">
					<content select="dock-tab"></content>
				</div>
			</div>`;
		root.insertBefore(
			DomUtils.createStyleElement('theme://elements/dock-tab-bar.css'),
			root.firstChild
		);

		// find elements
		this.eList = {
			content : root.querySelector("#content")
		};

		// active tab index
		this._activeTabIndex = -1;

		// hide by default
		this.hide();
	}

	get content() {
		return this.eList.content;
	}

	hide() {
		this.style.display = 'none';
	}

	show() {
		this.style.display = 'inline';
	}

	get dockNode() {
		return this.getRootNode().host;
	}

	indexOf(tab) {
		return Array.from(this.content.getElementsByTagName("dock-tab")).indexOf(tab);
	}

	tabAt(index) {
		let count = this.tabCount;
		if(index >= 0 && index < count) {
			let children = this.content.getElementsByTagName("dock-tab");
			return children.item(index);
		} else {
			return null;
		}
	}

	get tabCount() {
		return this.content.getElementsByTagName("dock-tab").length;
	}

	_deactiveTab(index) {
		let tabEL = this.tabAt(index);
		tabEL.active = false;
	}

	_activeTab(index) {
		let tabEL = this.tabAt(index);
		tabEL.active = true;
	}

	get activeTabIndex() {
		return this._activeTabIndex;
	}

	set activeTabIndex(val) {
		// deactivate current
		if(this._activeTabIndex !== -1) {
			this._deactiveTab(this._activeTabIndex);
			this._activeTabIndex = -1;
		}

		// activate new
		this._activeTab(val);
		this._activeTabIndex = val;
	}
}

// export
module.exports = DockTabBar;