'use strict';

const DomUtils = require('../dom_utils');

/**
 * custom tag <dock-client-area>, it holds dock window
 */
class DockClientArea extends window.HTMLElement {
	static get tagName() {
		return "DOCK-CLIENT-AREA";
	}

	createdCallback() {
		// create shadow root, append content and set style
		let root = this.attachShadow({ mode : 'open' });
		root.innerHTML = `
			<div id="panel-container">
				<content select="dock-panel-frame"></content>
			</div>`;
		root.insertBefore(
			DomUtils.createStyleElement('theme://elements/dock-client-area.css'),
			root.firstChild
		);

		// find elements
		this.eList = {
			panelContainer : root.querySelector("#panel-container")
		}

		// hide by default
		this.hide();

		// active panel index
		this._activePanelIndex = -1;
	}

	get dockNode() {
		return this.getRootNode().host;
	}

	get panelContainer() {
		return this.eList.panelContainer;
	}

	_deactivePanel(index) {
		let panel = this.panelAt(index);
		panel.active = false;
	}

	_activePanel(index) {
		let panel = this.panelAt(index);
		panel.active = true;
	}

	get activePanelIndex() {
		return this._activePanelIndex;
	}

	set activePanelIndex(val) {
		// deactivate current
		if(this._activePanelIndex !== -1) {
			this._deactivePanel(this._activePanelIndex);
			this._activePanelIndex = -1;
		}

		// activate new
		this._activePanel(val);
		this._activePanelIndex = val;
	}

	get minWidth() {
		if(this.panelCount <= 0) {
			// TODO better way?
			return 20;
		} else {
			let eDockM = window.edock.remote;
			let panels = this.panelContainer.getElementsByTagName("dock-panel-frame");
			let minWidth = 0;
			for(let i = 0; i < panels.length; i++) {
				let panel = panels.item(i);
				let pid = panel.panelId;
				let panelInfo = eDockM.config.getPanelInfo(pid);
				if(panelInfo.minWidth != null) {
					minWidth = Math.max(minWidth, panelInfo.minWidth);
				}
			}
			return minWidth;
		}
	}

	get minHeight() {
		if(this.panelCount <= 0) {
			// TODO better way?
			return 20;
		} else {
			let eDockM = window.edock.remote;
			let panels = this.panelContainer.getElementsByTagName("dock-panel-frame");
			let minHeight = 0;
			for(let i = 0; i < panels.length; i++) {
				let panel = panels.item(i);
				let pid = panel.panelId;
				let panelInfo = eDockM.config.getPanelInfo(pid);
				if(panelInfo.minWidth != null) {
					minHeight = Math.max(minHeight, panelInfo.minHeight);
				}
			}
			return minHeight;
		}
	}

	panelAt(index) {
		let count = this.panelCount;
		if(index >= 0 && index < count) {
			let children = this.panelContainer.getElementsByTagName("dock-panel-frame");
			return children.item(index);
		} else {
			return null;
		}
	}

	get panelCount() {
		return this.panelContainer.getElementsByTagName("dock-panel-frame").length;
	}

	hide() {
		this.style.display = 'none';
	}

	show() {
		this.style.display = 'inline';
	}
}

// export
module.exports = DockClientArea;