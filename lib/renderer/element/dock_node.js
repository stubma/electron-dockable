'use strict';

const DomUtils = require('../dom_utils');
const DockUtils = require('../dock_utils');
const uuid = require('uuid');

/**
 * custom tag <dock-node>, it can be child of dock-root or dock-node
 */
class DockNode extends window.HTMLElement {
	static get tagName() {
		return "DOCK-NODE";
	}

	createdCallback() {
		// create shadow root
		let root = this.attachShadow({ mode : 'open' });

		// a debug select node button, click this button can make
		// belonged node active
		let debugSelectNodeButton = ``;
		if(window.isDebug()) {
			debugSelectNodeButton = `<div id="debug-select-node"></div>`;
		}

		// set inner html and style
		root.innerHTML = `
			<div id="empty-hint">
				<h1>Empty Dock Node</h1>
			</div>
			${debugSelectNodeButton}
			<div id="content" class="content">
				<content select="dock-node,dock-tab-bar,dock-client-area,dock-splitter"/>
			</div>`;
		root.insertBefore(
			DomUtils.createStyleElement('theme://elements/dock-node.css'),
			root.firstChild
		);

		// set id if it is not root
		if(this.getAttribute("id") == null) {
			this.setAttribute("id", uuid.v1());
		}

		// set flex
		this.style.flex = "1";

		// content
		let content = root.querySelector("#content");

		// insert tab bar
		let tabBarEL = document.createElement("dock-tab-bar");
		content.appendChild(tabBarEL);

		// insert client area
		let clientAreaEL = document.createElement("dock-client-area");
		content.appendChild(clientAreaEL);

		// find elements
		this.eList = {
			content : content,
			tabBar : tabBarEL,
			clientArea : clientAreaEL
		};

		// select node button
		if(window.isDebug()) {
			let selectNode = root.querySelector("#debug-select-node");
			selectNode.addEventListener('click', this._onSelectNode.bind(this));
		}

		// event
		if(!this.isRoot) {
			this.addEventListener("dragenter", this._onDragEnter.bind(this));
			this.addEventListener("dragover", this._onDragOver.bind(this));
			this.addEventListener("dragleave", this._onDragLeave.bind(this));
		}
	}

	_onDragEnter(event) {
		event.stopPropagation();
	}

	_onDragOver(event) {
		event.stopPropagation();
	}

	_onDragLeave(event) {
		event.stopPropagation();
	}

	_onSelectNode(event) {
		event.stopPropagation();
		window.debugSelectedNode = this;
		console.log("select node: " + this.getAttribute("id"));
	}

	get parentNode() {
		return this.getRootNode().host;
	}

	get content() {
		return this.eList.content;
	}

	get tabBar() {
		return this.eList.tabBar;
	}

	get clientArea() {
		return this.eList.clientArea;
	}

	get id() {
		return this.getAttribute("id");
	}

	get isRoot() {
		return this.id === "root";
	}

	/**
	 * @returns count of child dock-node element in content
	 */
	get childCount() {
		return this.content.getElementsByTagName("dock-node").length;
	}

	/**
	 * get child node by index, returns null if index is invalid
	 * @param idx index, starts from zero
	 * @returns child node, or null if index if invalid
	 */
	childAt(idx) {
		let nodes = this.content.getElementsByTagName("dock-node");
		if(idx >= 0 && idx < nodes.length) {
			return nodes.item(idx);
		} else {
			return null;
		}
	}

	/**
	 * find index of sub node element
	 * @param child sub node element
	 * @returns {number}
	 */
	indexOfChild(child) {
		return Array.from(this.content.getElementsByTagName("dock-node")).indexOf(child);
	}

	/**
	 * create a new node element in content
	 * @param idx
	 * @returns {Element}
	 */
	newChild(idx = -1) {
		let child = document.createElement("dock-node");
		if(idx == -1) {
			this.content.appendChild(child);
		} else {
			let cc = this.childCount;
			if(idx >= cc) {
				this.content.insertBefore(child, null);
			} else {
				this.content.insertBefore(child, this.childAt(idx));
			}
		}
		return child;
	}

	/**
	 * create a new splitter element in content
	 * @returns {Element}
	 */
	newSplitter() {
		let splitter = document.createElement("dock-splitter");
		this.content.appendChild(splitter);
		return splitter;
	}

	/**
	 * get splitter element by index
	 * @param idx index
	 * @returns splitter node, or null if index is invalid
	 */
	splitterAt(idx) {
		let splitters = this.content.getElementsByTagName("dock-splitter");
		if(idx >= 0 && idx < splitters.length) {
			return splitters.item(idx);
		} else {
			return null;
		}
	}

	/**
	 * find index of splitter element
	 * @param splitter splitter element
	 * @returns {number}
	 */
	indexOfSplitter(splitter) {
		return Array.from(this.content.getElementsByTagName("dock-splitter")).indexOf(splitter);
	}

	/**
	 * get splitter element count
	 * @returns splitter element count
	 */
	get splitterCount() {
		return Math.max(0, this.childCount - 1);
	}

	/**
	 * perform a relayout from this node and all its descendants
	 */
	relayoutTree() {
		// layout splitters
		let splitters = this.content.getElementsByTagName("dock-splitter");
		let nodes = this.content.getElementsByTagName("dock-node");
		let horizontal = this.horizontal;
		for(let i = 0; i < splitters.length; i++) {
			let splitter = splitters.item(i);
			let prevSplitter = i > 0 ? splitters.item(i - 1) : null;
			let prevPos = 0;
			if(prevSplitter != null) {
				prevPos = horizontal ? parseFloat(prevSplitter.style.left) : parseFloat(prevSplitter.style.top);
			}
			let node = nodes.item(i);
			let rect = node.getBoundingClientRect();
			if(horizontal) {
				splitter.style.left = String(prevPos + rect.width) + "px";
			} else {
				splitter.style.top = String(prevPos + rect.height) + "px";
			}
		}

		// propagate to sub nodes
		for(let i = 0; i < nodes.length; i++) {
			let node = nodes.item(i);
			node.relayoutTree();
		}
	}

	get horizontal() {
		return this.hasAttribute('horizontal');
	}

	set horizontal(val) {
		if(val) {
			this.setAttribute('horizontal', '');
			this.removeAttribute('vertical');
		} else {
			this.setAttribute('vertical', '');
			this.removeAttribute('horizontal');
		}
	}

	get vertical() {
		return !this.hasAttribute('horizontal');
	}

	set vertical(val) {
		if(val) {
			this.setAttribute('vertical', '');
			this.removeAttribute('horizontal');
		} else {
			this.setAttribute('horizontal', '');
			this.removeAttribute('vertical');
		}
	}

	get minWidth() {
		let nodes = this.content.getElementsByTagName("dock-node");
		if(nodes.length > 0) {
			let minWidth = 0;
			for(let i = 0; i < nodes.length; i++) {
				let node = nodes.item(i);
				minWidth = Math.max(minWidth, node.minWidth);
			}
			return minWidth;
		} else {
			return this.clientArea.minWidth;
		}
	}

	get minHeight() {
		let nodes = this.content.getElementsByTagName("dock-node");
		if(nodes.length > 0) {
			let minHeight = 0;
			for(let i = 0; i < nodes.length; i++) {
				let node = nodes.item(i);
				minHeight = Math.max(minHeight, node.minHeight);
			}
			return minHeight;
		} else {
			let rect = this.tabBar.getBoundingClientRect();
			return this.clientArea.minHeight + rect.height;
		}
	}
}

// export
module.exports = DockNode;