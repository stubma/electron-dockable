'use strict';

const DomUtils = require('../dom_utils');
const DockUtils = require('../dock_utils');
const EDock = require('../../edock');

/**
 * custom tag <dock-splitter>, it display a draggable resizer between dock nodes
 */
class DockSplitter extends window.HTMLElement {
	static get tagName() {
		return "DOCK-SPLITTER";
	}

	createdCallback() {
		// create shadow dom, append content and set style
		let root = this.attachShadow({ mode : 'open' });
		root.innerHTML = `<div class="bar"></div>`;
		root.insertBefore(
			DomUtils.createStyleElement('theme://elements/dock-splitter.css'),
			root.firstChild
		);

		// add style
		this.style.left = "0px";
		this.style.top = "0px";

		// event
		this.addEventListener('mousedown', this._onMouseDown);
	}

	_onMouseDown(event) {
		event.stopPropagation();

		// save position
		this._startX = event.clientX;
		this._startY = event.clientY;

		// set dragging flag
		this._dragging = true;

		// current position
		let pos = parseFloat(this.vertical ? this.style.left : this.style.top);

		// get related node, so we can confine splitter position
		let idx = this.parentNode.indexOfSplitter(this);
		let node1 = this.parentNode.childAt(idx);
		let node2 = this.parentNode.childAt(idx + 1);
		let rect1 = node1.getBoundingClientRect();
		let rect2 = node2.getBoundingClientRect();
		if(this.vertical) {
			this._dragMin = pos - rect1.width + node1.minWidth;
			this._dragMax = pos + rect2.width - node2.minWidth;
			this._minBorder = pos - rect1.width;
			this._totalSpan = rect1.width + rect2.width;
		} else {
			this._dragMin = pos - rect1.height + node1.minHeight;
			this._dragMax = pos + rect2.height - node2.minHeight;
			this._minBorder = pos - rect1.height;
			this._totalSpan = rect1.height + rect2.height;
		}

		// get total flex those two nodes cover
		this._totalFlex = parseFloat(node1.style.flex) + parseFloat(node2.style.flex);

		// save related node for later adjust
		this._node1 = node1;
		this._node2 = node2;

		// add drag-ghost
		if(EDock.isWin32) {
			DomUtils.addDragGhost(this.vertical ? 'ew-resize' : 'ns-resize');
		} else {
			DomUtils.addDragGhost(this.vertical ? 'col-resize' : 'row-resize');
		}

		// add a global mouse handler
		this._mouseMoveListener = this._onMouseMove.bind(this);
		this._mouseUpListener = this._onMouseUp.bind(this);
		document.addEventListener('mousemove', this._mouseMoveListener);
		document.addEventListener('mouseup', this._mouseUpListener);
	}

	_onMouseMove(event) {
		event.stopPropagation();

		if(this._dragging) {
			this._resizeNodes(event);
		}
	}

	_onMouseUp(event) {
		event.stopPropagation();

		// re-layout
		let dragPos = this._resizeNodes(event);

		// place splitter
		if(this.vertical) {
			this.style.left = String(dragPos) + "px";
		} else {
			this.style.top = String(dragPos) + "px";
		}

		// reset flag
		this._dragging = false;

		// remove listener
		document.removeEventListener('mousemove', this._mouseMoveListener);
		document.removeEventListener('mouseup', this._mouseUpListener);

		// remove drag cursor
		DomUtils.removeDragGhost();

		// more clear
		this._node1 = null;
		this._node2 = null;
	}

	_resizeNodes(event) {
		// calculate move delta
		let deltaX = event.clientX - this._startX;
		let deltaY = event.clientY - this._startY;

		// get current dragged position
		let dragPos = 0;
		if(this.vertical) {
			let left = parseFloat(this.style.left);
			left += deltaX;
			dragPos = Math.min(Math.max(left, this._dragMin), this._dragMax);
		} else {
			let top = parseFloat(this.style.top);
			top += deltaY;
			dragPos = Math.min(Math.max(top, this._dragMin), this._dragMax);
		}

		// recalculate flex for nodes
		let percent = (dragPos - this._minBorder) / this._totalSpan;
		let flex = this._totalFlex * percent;
		this._node1.style.flex = String(flex);
		this._node2.style.flex = String(this._totalFlex - flex);

		// return dragged position
		return dragPos;
	}

	get parentNode() {
		return this.getRootNode().host;
	}

	get horizontal() {
		return this.hasAttribute('horizontal');
	}

	set horizontal(val) {
		if(val) {
			this.setAttribute('horizontal', '');
			this.removeAttribute('vertical');
		} else {
			this.removeAttribute('horizontal');
			this.setAttribute('vertical', '');
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
}

// export
module.exports = DockSplitter;