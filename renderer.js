'use strict';

(() => {
	const { webFrame, remote } = require('electron');
	const path = require('path');

	// set error handler
	window.onerror = function(message, filename, lineno, colno, err) {
		// Just let default handler run.
		return false;
	}

	// prevent default drag
	document.addEventListener('dragstart', event => {
		event.preventDefault();
		event.stopPropagation();
	});
	document.addEventListener('drop', event => {
		event.preventDefault();
		event.stopPropagation();
	});
	document.addEventListener('dragover', event => {
		event.preventDefault();
		event.stopPropagation();
		event.dataTransfer.dropEffect = 'none';
	});

	// limit zooming
	webFrame.setLayoutZoomLevelLimits(1, 1);

	// init & cache remote
	let rootWin = remote.getCurrentWindow();
	let eDockM = rootWin.edock;
	let appPath = eDockM.url2path('app://');
	let frameworkPath = eDockM.url2path(eDockM.frameworkName + '://');

	// add builtin node_modules search path for page-level
	require('module').globalPaths.push(path.join(appPath, 'node_modules'));

	// load dock for render process
	const EDock = require(`${frameworkPath}/lib/renderer`);
	let eDockR = new EDock(null, appPath);
	eDockR.remote = eDockM;
	eDockR.lang = eDockM.lang;
	window.edock = eDockR;
})();