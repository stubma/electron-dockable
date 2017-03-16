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
		let tabBar = document.createElement("dock-tab-bar");
		content.appendChild(tabBar);

		// insert client area
		let clientArea = document.createElement("dock-client-area");
		content.appendChild(clientArea);

		// find elements
		this.eList = {
			content : content,
			tabBar : tabBar,
			clientArea : clientArea
		};

		// select node button
		if(window.isDebug()) {
			let selectNode = root.querySelector("#debug-select-node");
			selectNode.addEventListener('click', this._onSelectNode.bind(this));
		}

		// counter to track whether pointer is in node
		this._stayCounter = 0;

		// event
		if(!this.isRoot) {
			this.addEventListener("dragenter", this._onDragEnter);
			this.addEventListener("dragover", this._onDragOver);
			this.addEventListener("dragleave", this._onDragLeave);
			this.addEventListener("drop", this._onDrop);
		}
	}

	_onDragEnter(event) {
		// check drag type
		if(DockUtils.dragType === "tab") {
			// stop propagation
			event.preventDefault();
			event.stopPropagation();

			// set effect
			event.dataTransfer.dropEffect = "move";

			// add drop indicator
			this._stayCounter++;
			DomUtils.addDropSideIndicator(this);

			// update drag feedback
			this._updateDropSide(event);
		}
	}

	_onDragOver(event) {
		// check drag type
		if(DockUtils.dragType === "tab") {
			// stop propagation event
			event.preventDefault();
			event.stopPropagation();

			// set effect
			event.dataTransfer.dropEffect = "move";

			// drag feedback
			this._updateDropSide(event);
		}
	}

	_onDragLeave(event) {
		// check drag type
		if(DockUtils.dragType === "tab") {
			// stop propagation
			event.preventDefault();
			event.stopPropagation();

			// set effect
			event.dataTransfer.dropEffect = "none";

			// remove drop indicator
			this._stayCounter--;
			if(this._stayCounter <= 0) {
				DomUtils.removeDropSideIndicator(this);
			}
		}
	}

	_onDrop(event) {
		// check drag type
		if(DockUtils.dragType === "tab") {
			// stop propagation
			event.preventDefault();
			event.stopPropagation();

			// reset
			this._stayCounter = 0;
			DomUtils.removeDropSideIndicator(this);

			// get source
			let srcNode = DockUtils.draggedTab.dockNode;
			let srcTabBar = DockUtils.draggedTab.tabBar;
			let srcTabCount = srcTabBar.tabCount;
			let srcTabIndex = srcTabBar.indexOf(DockUtils.draggedTab);
			let srcPanel = srcNode.clientArea.panelAt(srcTabIndex);
			let srcPanelId = srcPanel.panelId;

			// check drop target
			if(this == srcNode) {
				// if same node, and only one tab, we need to do nothing
				// if more than one, then it depends on drop side
				if(srcTabCount > 1) {
					// if drop in center, nothing to do
					// if not, the we need split
					if(DockUtils.dropSide != DockUtils.DOCK_CENTER) {
						// remove dragged tab and panel first
						this.closePanelAt(srcTabIndex);

						// dock panel at new side
						DockUtils.dockPanel(srcPanelId, this, DockUtils.dropSide, srcPanel);
					}
				}
			} else {
				// close panel
				srcNode.closePanelAt(srcTabIndex);
				let parent = srcNode.parentNode;

				// if src has only one tab, need remove it
				if(srcTabCount <= 1) {
					// adjust sibling flex
					let flex = parseFloat(srcNode.style.flexGrow);
					let index = parent.indexOf(srcNode);
					let cc = parent.nodeCount;
					let sibling = (index < cc - 1) ? parent.nodeAt(index + 1) : parent.nodeAt(index - 1);
					let siblingFlex = parseFloat(sibling.style.flexGrow);
					sibling.style.flexGrow = `${siblingFlex + flex}`;

					// remove src node
					srcNode.remove();

					// remove a splitter
					let splitter = parent.splitterAt(0);
					if(splitter != null) {
						splitter.remove();
					}

					// relayout splitter
					parent.relayoutSplitters();
				}

				// dock panel to this node
				DockUtils.dockPanel(srcPanelId, this, DockUtils.dropSide, srcPanel);

				// check parent, remove duplicate level
				if(parent.nodeCount === 1) {
					let child = parent.nodeAt(0);
					if(child.nodeCount > 0) {
						// if child has grandchild, then move all grandchild to parent
						parent.vertical = child.vertical;
						let nodes = child.content.getElementsByTagName("dock-node");
						let splitters = child.content.getElementsByTagName("dock-splitter");
						while(nodes.length > 0) {
							let n = nodes.item(0);
							n.remove();
							parent.content.appendChild(n);
						}
						while(splitters.length > 0) {
							let s = splitters.item(0);
							s.remove();
							parent.content.appendChild(s);
						}
						child.remove();
						parent.relayoutSplitters();
					} else if(!parent.isRoot) {
						// if child is also a leaf node, promote it to replace parent
						let grandpa = parent.parentNode;
						let parentIndex = grandpa.indexOf(parent);
						child.style.flexGrow = parent.style.flexGrow;
						child.remove();
						parent.remove();
						grandpa.insertNode(child, parentIndex);
					}
				}
			}
		}
	}

	_onSelectNode(event) {
		event.stopPropagation();
		window.debugSelectedNode = this;
		console.log("select node: " + this.getAttribute("id"));
	}

	_updateDropSide(event) {
		// get offset relative to this node
		let rect = this.getBoundingClientRect();
		let offsetX = event.clientX - rect.left;
		let offsetY = event.clientY - rect.top;

		// divide node as a nine-patch, detect which part where we are
		let side = DockUtils.DOCK_CENTER;
		let gridX = rect.width / 3;
		let gridY = rect.height / 3;
		let k = rect.width / rect.height;
		if(offsetX >= offsetY * k) {
			if(offsetX <= gridX * 2 && offsetY >= gridY) {
				side = DockUtils.DOCK_CENTER;
			} else if(rect.width - offsetX >= offsetY * k) {
				side = DockUtils.DOCK_NORTH;
			} else {
				side = DockUtils.DOCK_EAST;
			}
		} else {
			if(offsetX >= gridX && offsetY <= gridY * 2) {
				side = DockUtils.DOCK_CENTER;
			} else if(rect.width - offsetX >= offsetY * k) {
				side = DockUtils.DOCK_WEST;
			} else {
				side = DockUtils.DOCK_SOUTH;
			}
		}

		// if side changes
		if(side !== DockUtils.dropSide) {
			// save drop side
			DockUtils.dropSide = side;

			// update indicator
			DomUtils.updateDropSideIndicator(this, side);
		}
	}

	get parentNode() {
		if(this.isRoot) {
			return null;
		} else {
			return this.getRootNode().host;
		}
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
	get nodeCount() {
		return this.content.getElementsByTagName("dock-node").length;
	}

	/**
	 * get child node by index, returns null if index is invalid
	 * @param idx index, starts from zero
	 * @returns child node, or null if index if invalid
	 */
	nodeAt(idx) {
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
	indexOf(child) {
		return Array.from(this.content.getElementsByTagName("dock-node")).indexOf(child);
	}

	/**
	 * create a new node element in content
	 * @param idx
	 * @returns {Element}
	 */
	newNode(idx = -1) {
		let child = document.createElement("dock-node");
		if(idx == -1) {
			this.content.appendChild(child);
		} else {
			let cc = this.nodeCount;
			if(idx >= cc) {
				this.content.insertBefore(child, null);
			} else {
				this.content.insertBefore(child, this.nodeAt(idx));
			}
		}
		return child;
	}

	insertNode(child, idx = -1) {
		if(idx == -1) {
			this.content.appendChild(child);
		} else {
			let cc = this.nodeCount;
			if(idx >= cc) {
				this.content.appendChild(child);
			} else {
				this.content.insertBefore(child, this.nodeAt(idx));
			}
		}
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
		return Math.max(0, this.nodeCount - 1);
	}

	/**
	 * relayout all splitters from this node to all its descendants
	 */
	relayoutSplitters() {
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
				splitter.style.left = `${prevPos + rect.width}px`;
			} else {
				splitter.style.top = `${prevPos + rect.height}px`;
			}
		}

		// propagate to sub nodes
		for(let i = 0; i < nodes.length; i++) {
			let node = nodes.item(i);
			node.relayoutSplitters();
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

	/**
	 * Close a panel at given index
	 * @param index panel index
	 * @param notify true means it will trigger a lifecycle event for panel
	 */
	closePanelAt(index, notify = false) {
		// get child
		let clientArea = this.clientArea;
		let tabBar = this.tabBar;

		// validate
		if(index < 0 || index >= tabBar.tabCount) {
			return;
		}

		// get index
		let activeIndex = tabBar.activeTabIndex;
		let active = activeIndex == index;

		// deactivate old
		if(active) {
			tabBar.activeTabIndex = -1;
			clientArea.activePanelIndex = -1;
		}

		// remove tab and panel
		clientArea.removePanelAt(index);
		tabBar.removeTabAt(index);

		// maintain active state
		if(active) {
			if(tabBar.tabCount > 0) {
				let activeIndex = Math.max(0, index - 1);
				tabBar.activeTabIndex = activeIndex;
				clientArea.activePanelIndex = activeIndex;
			} else {
				// no more tabs, hide tab bar and client area
				tabBar.hide();
				clientArea.hide();
			}
		} else if(index < activeIndex) {
			tabBar.setActiveTabIndexQuitely(activeIndex - 1);
			clientArea.setActivePanelIndexQuitely(activeIndex - 1);
		}

		// TODO event notify
		if(notify) {

		}
	}
}

// export
module.exports = DockNode;