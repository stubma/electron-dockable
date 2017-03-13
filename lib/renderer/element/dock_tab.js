'use strict';

const DomUtils = require('../dom_utils');

/**
 * custom tag <dock-tab>, it display dock window icon and name
 */
class DockTab extends window.HTMLElement {
	static get tagName() {
		return "DOCK-TAB";
	}

	createdCallback() {
		// create shadow dom, append content and set style
		let root = this.attachShadow({ mode : 'open' });
		root.innerHTML = `
			<div class="border">
				<div id="title" class="title">
					<div id="icon"></div>
					<span id="name"></span>
					<div id="close"></div>
				</div>
			</div>`;
		root.insertBefore(
			DomUtils.createStyleElement('theme://elements/dock-tab.css'),
			root.firstChild
		);

		// find elements
		this.eList = {
			title : root.querySelector("#title"),
			icon : root.querySelector("#icon"),
			name : root.querySelector("#name"),
			close : root.querySelector("#close")
		};

		// event
		this.eList.close.addEventListener("click", this._onClose.bind(this));
		this.eList.title.addEventListener("click", this._onClick.bind(this));
	}

	get tabBar() {
		return this.getRootNode().host;
	}

	get dockNode() {
		return this.tabBar.getRootNode().host;
	}

	_onClose(event) {
		event.stopPropagation();
	}

	_onClick(event) {
		event.stopPropagation();
		if(!this.active) {
			// set self active
			let tabBar = this.tabBar;
			tabBar.activeTabIndex = tabBar.indexOf(this);

			// set related panel active
			let clientArea = this.dockNode.clientArea;
			clientArea.activePanelIndex = tabBar.activeTabIndex;
		}
	}

	set active(val) {
		if(this.active != val) {
			this.eList.title.classList.toggle("active");
		}
	}

	get active() {
		return this.eList.title.classList.contains("active");
	}

	/**
	 * set the tab can be closed or not
	 * @param val boolean indicating tab is closable or not
	 */
	set closable(val) {
		if(val) {
			this.eList.close.style.display = 'inline';
		} else {
			this.eList.close.style.display = 'none';
		}
	}

	/**
	 * set tab icon
	 * @param val icon url
	 */
	set icon(val) {
		if(!!val) {
			// get icon div
			let iconEL = this.eList.icon;

			// if no img tag, create it
			let img = iconEL.firstChild;
			if(img == null) {
				// append img tag
				img = document.createElement('img');
				iconEL.appendChild(img);

				// NOTE: this will prevent icon been dragged
				img.setAttribute( 'draggable', 'false' );
			}

			// set src
			img.setAttribute('src', val);
		}
	}

	/**
	 * get tab title
	 * @returns {string}
	 */
	get title() {
		if(!!this.eList) {
			return this.eList.name.innerText;
		} else {
			return "";
		}
	}

	/**
	 * set tab title
	 * @param val title string
	 */
	set title(val) {
		if(!!this.eList) {
			this.eList.name.innerText = val;
		}
	}
}

// export
module.exports = DockTab;