'use strict';

const { ipcRenderer } = require('electron');
const EDock = require('../edock');
const ResourceManager = require('./res_mgr');
const DockRoot = require('./element/dock_root');
const DockNode = require('./element/dock_node');
const DockTabBar = require('./element/dock_tab_bar');
const DockTab = require('./element/dock_tab');
const DockClientArea = require('./element/dock_client_area');
const DockPanelFrame = require('./element/dock_panel_frame');
const DockSplitter = require('./element/dock_splitter');
const DockUtils = require('./dock_utils');
const path = require('path');

// import stylesheets
ResourceManager.importResources([
	// dock elements
	'theme://elements/dock-splitter.css',
	'theme://elements/dock-tab.css',
	'theme://elements/dock-tab-bar.css',
	'theme://elements/dock-node.css',
	'theme://elements/dock-client-area.css',
	'theme://elements/dock-panel-frame.css',

	// ui elements
	'theme://elements/box-container.css',
	'theme://elements/button.css',
	'theme://elements/checkbox.css',
	'theme://elements/color-picker.css',
	'theme://elements/color.css',
	'theme://elements/hint.css',
	'theme://elements/input.css',
	'theme://elements/loader.css',
	'theme://elements/markdown.css',
	'theme://elements/num-input.css',
	'theme://elements/progress.css',
	'theme://elements/prop.css',
	'theme://elements/section.css',
	'theme://elements/select.css',
	'theme://elements/slider.css',
	'theme://elements/text-area.css',

	// template
	"electron-dockable://static/default-panel.html"
]).then(() => {
	// registry dock elements
	[
		DockRoot,
		DockNode,
		DockTabBar,
		DockTab,
		DockClientArea,
		DockPanelFrame,
		DockSplitter
	].forEach(cls => {
		document.registerElement(cls.tagName, cls);
	});
});

// insert stylesheet when page is ready
document.onreadystatechange = () => {
	if(document.readyState === 'interactive') {
		// NOTE: we don't use url such as theme://globals/common.css
		// that will cause a crash if we frequently open and close window
		const dir = window.edock.url2path('theme://globals');

		// insert stylesheet link to head
		[
			path.join(dir, 'common.css'),
			path.join(dir, 'layout.css'),
		].forEach(url => {
			let link = document.createElement('link');
			link.setAttribute('type', 'text/css');
			link.setAttribute('rel', 'stylesheet');
			link.setAttribute('href', url);
			document.head.insertBefore(link, document.head.firstChild);
		});
	}
};

// when resized, maintain some layout
window.addEventListener('resize', (event) => {
	DockUtils.root.relayoutSplitters();
});

// debug flag checking moethod in renderer process
window.isDebug = function() {
	return process.env.DEBUG == 1;
};

// code for handle debug menu actions
if(window.isDebug()) {
	ipcRenderer.on('edock:debug-dock-panel', (event, ...args) => {
		let side = DockUtils._string2side(args[1]);
		DockUtils.dockPanel(args[0], window.debugSelectedNode, side);
	});
}

// export
module.exports = EDock;