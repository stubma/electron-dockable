'use strict';

/**
 * Utilities for docking logic
 */
class DockUtils {
	/**
	 * Create a panel by panel id, then dock it at side of a dock node, the dock node
	 * will hold the panel if side is center. If dock side is not center, parent dock node
	 * will hold the panel
	 * @param pid panel id
	 * @param node dock node which accepts the dock drag
	 * @param side dock side constant
	 * @param reusedPanel a reused dock-panel-frame element, if has, then it doesn't
	 * create new dock-panel-frame element
	 */
	static dockPanel(pid, node, side, reusedPanel = null) {
		// get panel info
		let eDockM = window.edock.remote;
		let panelInfo = eDockM.config.getPanelInfo(pid);

		// check side, then dock
		if(side == DockUtils.DOCK_CENTER) {
			// if node is root, create a child node to hold panel
			let nid = node.getAttribute("id");
			if(nid == "root") {
				node = node.newNode();
			}

			// dock panel
			this._appendPanel(panelInfo, node, reusedPanel);

			// activate panel
			this._activateLastPanel(node);
		} else if(side == DockUtils.DOCK_EAST) {
			this._dockPanelH(pid, node, false, reusedPanel);
		} else if(side == DockUtils.DOCK_WEST) {
			this._dockPanelH(pid, node, true, reusedPanel);
		} else if(side == DockUtils.DOCK_SOUTH) {
			this._dockPanelV(pid, node, false, reusedPanel);
		} else if(side == DockUtils.DOCK_NORTH) {
			this._dockPanelV(pid, node, true, reusedPanel);
		}
	}

	static _dockPanelV(pid, node, before, reusedPanel = null) {
		// if node is root, treat it as center
		let nid = node.getAttribute("id");
		if(nid == "root") {
			this.dockPanel(pid, node, DockUtils.DOCK_CENTER);
		} else {
			// if parent already has a defined direction, we can't change it
			let topNode = node.parentNode;
			let parentNode = topNode;
			if(!parentNode.vertical && parentNode.nodeCount > 1) {
				let idx = parentNode.indexOf(node);
				node.remove();
				let newParentNode = parentNode.newNode(idx);
				newParentNode.content.appendChild(node);
				parentNode = newParentNode;

				// copy node flex to new container and reset node to flex 1
				newParentNode.style.flexGrow = node.style.flexGrow;
				node.style.flex = "1";
			}

			// set parent node to vertical layout
			parentNode.vertical = true;

			// create a new child node
			let idx = parentNode.indexOf(node);
			let child = parentNode.newNode(idx + (before ? 0 : 1));

			// create a new splitter
			let splitter = parentNode.newSplitter();
			splitter.horizontal = true;

			// half flex for old and new node
			let flex = parseFloat(node.style.flexGrow);
			node.style.flexGrow = `${flex / 2}`;
			child.style.flexGrow = `${flex / 2}`;

			// now dock panel in this new child
			this.dockPanel(pid, child, DockUtils.DOCK_CENTER, reusedPanel);

			// position splitter
			topNode.relayoutSplitters();
		}
	}

	static _dockPanelH(pid, node, before, reusedPanel = null) {
		// if node is root, treat it as center
		let nid = node.getAttribute("id");
		if(nid == "root") {
			this.dockPanel(pid, node, DockUtils.DOCK_CENTER);
		} else {
			// if parent already has a defined direction, we can't change it
			// we can create a new parent node to hold dock target
			let topNode = node.parentNode;
			let parentNode = topNode;
			if(!parentNode.horizontal && parentNode.nodeCount > 1) {
				let idx = parentNode.indexOf(node);
				node.remove();
				let newParentNode = parentNode.newNode(idx);
				newParentNode.content.appendChild(node);
				parentNode = newParentNode;

				// copy node flex to new container and reset node to flex 1
				newParentNode.style.flexGrow = node.style.flexGrow;
				node.style.flex = "1";
			}

			// set parent node to horizontal layout
			parentNode.horizontal = true;

			// create a new child node
			let idx = parentNode.indexOf(node);
			let child = parentNode.newNode(idx + (before ? 0 : 1));

			// create a new splitter
			let splitter = parentNode.newSplitter();
			splitter.vertical = true;

			// half flex for old and new node
			let flex = parseFloat(node.style.flexGrow);
			node.style.flexGrow = `${flex / 2}`;
			child.style.flexGrow = `${flex / 2}`;

			// now dock panel in this new child
			this.dockPanel(pid, child, DockUtils.DOCK_CENTER, reusedPanel);

			// position splitter
			topNode.relayoutSplitters();
		}
	}

	static _activateLastPanel(node) {
		// show
		node.tabBar.show();
		node.clientArea.show();

		// set this panel active
		node.tabBar.activeTabIndex = node.tabBar.tabCount - 1;
		node.clientArea.activePanelIndex = node.clientArea.panelCount - 1;
	}

	static _appendPanel(panelInfo, node, reusedPanel = null) {
		// create dock tab node and append it
		// we save panel id in its attribute so that renderer process
		// can check it
		let tabBar = node.tabBar;
		let tab = document.createElement("dock-tab");
		tab.setAttribute("panel-id", panelInfo.id);
		tabBar.content.appendChild(tab);
		tab.title = panelInfo.title;
		tab.icon = panelInfo.icon;
		tab.closable = panelInfo.closable;

		// add panel frame
		let clientArea = node.clientArea;
		let pFrame = reusedPanel;
		if(pFrame == null) {
			pFrame = document.createElement("dock-panel-frame");
			pFrame.setAttribute("panel-id", panelInfo.id);
		}
		clientArea.panelContainer.appendChild(pFrame);

		// if no reused panel, load panel content
		if(reusedPanel == null) {
			pFrame.template = panelInfo.template;
		}
	}

	static _string2side(str) {
		str = str.toLowerCase();
		if(str == "east") {
			return DockUtils.DOCK_EAST;
		} else if(str == "west") {
			return DockUtils.DOCK_WEST;
		} else if(str == "south") {
			return DockUtils.DOCK_SOUTH;
		} else if(str == "north") {
			return DockUtils.DOCK_NORTH;
		} else {
			return DockUtils.DOCK_CENTER;
		}
	}

	static _side2string(side) {
		if(side == DockUtils.DOCK_WEST) {
			return "west";
		} else if(side == DockUtils.DOCK_SOUTH) {
			return "south";
		} else if(side == DockUtils.DOCK_NORTH) {
			return "north";
		} else if(side == DockUtils.DOCK_EAST) {
			return "east";
		} else {
			return "center";
		}
	}

}

// side constant
DockUtils.DOCK_CENTER = 0;
DockUtils.DOCK_EAST = 1;
DockUtils.DOCK_WEST = 2;
DockUtils.DOCK_SOUTH = 3;
DockUtils.DOCK_NORTH = 4;

// root dock node
DockUtils.root = null;

// global drag data
DockUtils.dragType = null;
DockUtils.dropSide = -1;
DockUtils.draggedTab = null;

// export
module.exports = DockUtils;
