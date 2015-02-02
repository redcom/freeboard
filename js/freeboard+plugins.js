// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

DatasourceModel = function(theFreeboardModel, datasourcePlugins) {
	var self = this;

	function disposeDatasourceInstance()
	{
		if(!_.isUndefined(self.datasourceInstance))
		{
			if(_.isFunction(self.datasourceInstance.onDispose))
			{
				self.datasourceInstance.onDispose();
			}

			self.datasourceInstance = undefined;
		}
	}

	this.isEditing = ko.observable(false); // editing by PluginEditor
	this.name = ko.observable();
	this.latestData = ko.observable();
	this.settings = ko.observable({});
	this.settings.subscribe(function(newValue)
	{
		if(!_.isUndefined(self.datasourceInstance) && _.isFunction(self.datasourceInstance.onSettingsChanged))
		{
			self.datasourceInstance.onSettingsChanged(newValue);
		}
	});

	this.updateCallback = function(newData)
	{
		theFreeboardModel.processDatasourceUpdate(self, newData);

		self.latestData(newData);

		var now = new Date();
		self.last_updated(now.toLocaleTimeString());
	}

	this.type = ko.observable();
	this.type.subscribe(function(newValue)
	{
		disposeDatasourceInstance();

		if((newValue in datasourcePlugins) && _.isFunction(datasourcePlugins[newValue].newInstance))
		{
			var datasourceType = datasourcePlugins[newValue];

			function finishLoad()
			{
				datasourceType.newInstance(self.settings(), function(datasourceInstance)
				{

					self.datasourceInstance = datasourceInstance;
					datasourceInstance.updateNow();

				}, self.updateCallback);
			}

			// Do we need to load any external scripts?
			if(datasourceType.external_scripts)
			{
				head.js(datasourceType.external_scripts.slice(0), finishLoad); // Need to clone the array because head.js adds some weird functions to it
			}
			else
			{
				finishLoad();
			}
		}
	});

	this.last_updated = ko.observable("never");
	this.last_error = ko.observable();

	this.serialize = function()
	{
		return {
			name    : self.name(),
			type    : self.type(),
			settings: self.settings()
		};
	}

	this.deserialize = function(object)
	{
		self.settings(object.settings);
		self.name(object.name);
		self.type(object.type);
	}

	this.getDataRepresentation = function(dataPath)
	{
		var valueFunction = new Function("data", "return " + dataPath + ";");
		return valueFunction.call(undefined, self.latestData());
	}

	this.updateNow = function()
	{
		if(!_.isUndefined(self.datasourceInstance) && _.isFunction(self.datasourceInstance.updateNow))
		{
			self.datasourceInstance.updateNow();
		}
	}

	this.dispose = function()
	{
		disposeDatasourceInstance();
	}
}

// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

DeveloperConsole = function(theFreeboardModel)
{
	function showDeveloperConsole()
	{
		var pluginScriptsInputs = [];
		var container = $('<div></div>');
		var addScript = $('<div class="table-operation text-button">ADD</div>');
		var table = $('<table class="table table-condensed sub-table"></table>');

		table.append($('<thead style=""><tr><th>Plugin Script URL</th></tr></thead>'));

		var tableBody = $("<tbody></tbody>");

		table.append(tableBody);

		container.append($("<p>Here you can add references to other scripts to load datasource or widget plugins.</p>"))
			.append(table)
			.append(addScript)
			.append('<p>To learn how to build plugins for freeboard, please visit <a target="_blank" href="http://freeboard.github.io/freeboard/docs/plugin_example.html">http://freeboard.github.io/freeboard/docs/plugin_example.html</a></p>');

		function refreshScript(scriptURL)
		{
			$('script[src="' + scriptURL + '"]').remove();
		}

		function addNewScriptRow(scriptURL)
		{
			var tableRow = $('<tr></tr>');
			var tableOperations = $('<ul class="board-toolbar"></ul>');
			var scriptInput = $('<input class="table-row-value" style="width:100%;" type="text">');
			var deleteOperation = $('<li><i class="icon-trash icon-white"></i></li>').click(function(e){
				pluginScriptsInputs = _.without(pluginScriptsInputs, scriptInput);
				tableRow.remove();
			});

			pluginScriptsInputs.push(scriptInput);

			if(scriptURL)
			{
				scriptInput.val(scriptURL);
			}

			tableOperations.append(deleteOperation);
			tableBody
				.append(tableRow
				.append($('<td></td>').append(scriptInput))
					.append($('<td class="table-row-operation">').append(tableOperations)));
		}

		_.each(theFreeboardModel.plugins(), function(pluginSource){

			addNewScriptRow(pluginSource);

		});

		addScript.click(function(e)
		{
			addNewScriptRow();
		});

		new DialogBox(container, "Developer Console", "OK", null, function(okcancel){
			if (okcancel == 'ok') {
				// Unload our previous scripts
				_.each(theFreeboardModel.plugins(), function(pluginSource){

					$('script[src^="' + pluginSource + '"]').remove();

				});

				theFreeboardModel.plugins.removeAll();

				_.each(pluginScriptsInputs, function(scriptInput){

					var scriptURL = scriptInput.val();

					if(scriptURL && scriptURL.length > 0)
					{
						theFreeboardModel.addPluginSource(scriptURL);

						// Load the script with a cache buster
						head.js(scriptURL + "?" + Date.now());
					}
				});
			}
		});
	}

	// Public API
	return {
		showDeveloperConsole : function()
		{
			showDeveloperConsole();
		}
	}
}

// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

function DialogBox(contentElement, title, okTitle, cancelTitle, closeCallback)
{
	var modal_width = 900;

	// Initialize our modal overlay
	var overlay = $('<div id="modal_overlay" style="display:none;"></div>');

	var modalDialog = $('<div class="modal"></div>');

	function closeModal()
	{
		overlay.fadeOut(200, function()
		{
			$(this).remove();
		});
	}

	// Create our header
	modalDialog.append('<header><h2 class="title">' + title + "</h2></header>");

	$('<section></section>').appendTo(modalDialog).append(contentElement);

	// Create our footer
	var footer = $('<footer></footer>').appendTo(modalDialog);

	if(okTitle)
	{
		$('<span id="dialog-ok" class="text-button">' + okTitle + '</span>').appendTo(footer).click(function()
		{
			var hold = false;

			if (!$("#plugin-editor").validationEngine('validate'))
				return false;

			if(_.isFunction(closeCallback))
				hold = closeCallback("ok");

			if(!hold)
				closeModal();
		});
	}

	if(cancelTitle)
	{
		$('<span id="dialog-cancel" class="text-button">' + cancelTitle + '</span>').appendTo(footer).click(function()
		{
			closeCallback("cancel");
			closeModal();
		});
	}

	overlay.append(modalDialog);
	$("body").append(overlay);
	overlay.fadeIn(200);

	// ValidationEngine initialize
	$.validationEngine.defaults.autoPositionUpdate = true;
	// media query max-width : 960px
	$.validationEngine.defaults.promptPosition = ($("#hamburger").css("display") == "none") ? "topRight" : "topLeft";
	$("#plugin-editor").validationEngine();
}

// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

function FreeboardModel(datasourcePlugins, widgetPlugins, freeboardUI)
{
	var self = this;

	var SERIALIZATION_VERSION = 1;

	this.version = 0;
	this.isEditing = ko.observable(false);
	this.allow_edit = ko.observable(false);
	this.allow_edit.subscribe(function(newValue)
	{
		if(newValue)
		{
			$("#main-header").show();
			$("#datasources").show();
		}
		else
		{
			$("#main-header").hide();
			$("#datasources").hide();
		}
	});

	this.isVisibleDatasources = ko.observable(false);
	this.isVisibleBoardTools = ko.observable(false);

	this.header_image = ko.observable();
	this.plugins = ko.observableArray();
	this.datasources = ko.observableArray();
	this.panes = ko.observableArray();
	this.datasourceData = {};
	this.processDatasourceUpdate = function(datasourceModel, newData)
	{
		var datasourceName = datasourceModel.name();

		self.datasourceData[datasourceName] = newData;

		_.each(self.panes(), function(pane)
		{
			_.each(pane.widgets(), function(widget)
			{
				widget.processDatasourceUpdate(datasourceName);
			});
		});
	}

	this._datasourceTypes = ko.observable();
	this.datasourceTypes = ko.computed({
		read: function()
		{
			self._datasourceTypes();

			var returnTypes = [];

			_.each(datasourcePlugins, function(datasourcePluginType)
			{
				var typeName = datasourcePluginType.type_name;
				var displayName = typeName;

				if(!_.isUndefined(datasourcePluginType.display_name))
				{
					displayName = datasourcePluginType.display_name;
				}

				returnTypes.push({
					name        : typeName,
					display_name: displayName
				});
			});

			return returnTypes;
		}
	});

	this._widgetTypes = ko.observable();
	this.widgetTypes = ko.computed({
		read: function()
		{
			self._widgetTypes();

			var returnTypes = [];

			_.each(widgetPlugins, function(widgetPluginType)
			{
				var typeName = widgetPluginType.type_name;
				var displayName = typeName;

				if(!_.isUndefined(widgetPluginType.display_name))
				{
					displayName = widgetPluginType.display_name;
				}

				returnTypes.push({
					name        : typeName,
					display_name: displayName
				});
			});

			return returnTypes;
		}
	});

	this.addPluginSource = function(pluginSource)
	{
		if(pluginSource && self.plugins.indexOf(pluginSource) == -1)
		{
			self.plugins.push(pluginSource);
		}
	}

	this.serialize = function()
	{
		var panes = [];

		_.each(self.panes(), function(pane)
		{
			panes.push(pane.serialize());
		});

		var datasources = [];

		_.each(self.datasources(), function(datasource)
		{
			datasources.push(datasource.serialize());
		});

		return {
			version     : SERIALIZATION_VERSION,
			header_image: self.header_image(),
			allow_edit  : self.allow_edit(),
			plugins     : self.plugins(),
			panes       : panes,
			datasources : datasources,
			columns     : freeboardUI.getUserColumns()
		};
	}

	this.deserialize = function(object, finishedCallback)
	{
		self.clearDashboard();

		function finishLoad()
		{
			freeboardUI.setUserColumns(object.columns);

			if(!_.isUndefined(object.allow_edit))
			{
				self.allow_edit(object.allow_edit);
			}
			else
			{
				self.allow_edit(true);
			}
			self.version = object.version || 0;
			self.header_image(object.header_image);

			_.each(object.datasources, function(datasourceConfig)
			{
				var datasource = new DatasourceModel(self, datasourcePlugins);
				datasource.deserialize(datasourceConfig);
				self.addDatasource(datasource);
			});

			var sortedPanes = _.sortBy(object.panes, function(pane){
				return freeboardUI.getPositionForScreenSize(pane).row;
			});

			_.each(sortedPanes, function(paneConfig)
			{
				var pane = new PaneModel(self, widgetPlugins);
				pane.deserialize(paneConfig);
				self.panes.push(pane);
			});

			if(self.allow_edit() && self.panes().length == 0)
			{
				self.setEditing(true);
			}

			if(_.isFunction(finishedCallback))
			{
				finishedCallback();
			}

			freeboardUI.processResize(true);
		}

		// This could have been self.plugins(object.plugins), but for some weird reason head.js was causing a function to be added to the list of plugins.
		_.each(object.plugins, function(plugin)
		{
			self.addPluginSource(plugin);
		});

		// Load any plugins referenced in this definition
		if(_.isArray(object.plugins) && object.plugins.length > 0)
		{
			head.js(object.plugins, function()
			{
				finishLoad();
			});
		}
		else
		{
			finishLoad();
		}
	}

	this.clearDashboard = function()
	{
		freeboardUI.removeAllPanes();

		_.each(self.datasources(), function(datasource)
		{
			datasource.dispose();
		});

		_.each(self.panes(), function(pane)
		{
			pane.dispose();
		});

		self.plugins.removeAll();
		self.datasources.removeAll();
		self.panes.removeAll();
	}

	this.loadDashboard = function(dashboardData, callback)
	{
		freeboardUI.showLoadingIndicator(true);
		self.deserialize(dashboardData, function()
		{
			freeboardUI.showLoadingIndicator(false);

			if(_.isFunction(callback))
			{
				callback();
			}

			freeboard.emit("dashboard_loaded");
		});
	}

	this.loadDashboardFromLocalFile = function()
	{
		// Check for the various File API support.
		if(window.File && window.FileReader && window.FileList && window.Blob)
		{
			var input = document.createElement('input');
			input.id = "myfile";
			input.type = "file";
			$(input).css({
				'visibility':'hidden'
			});
			$(input).on("change", function(event)
			{
				var files = event.target.files;

				if(files && files.length > 0)
				{
					var file = files[0];
					var reader = new FileReader();

					reader.addEventListener("load", function(fileReaderEvent)
					{

						var textFile = fileReaderEvent.target;
						var jsonObject = JSON.parse(textFile.result);


						self.loadDashboard(jsonObject);
						self.setEditing(false);
					});

					reader.readAsText(file);
				}
				if (/*@cc_on ! @*/ false || document.documentMode) {   // for IE
					$("#myfile").remove();
				}
			});
			if (/*@cc_on ! @*/ false || document.documentMode) {   // for IE
				document.body.appendChild(input);
				var evt = document.createEvent('MouseEvents');
				evt.initEvent('click',true,true,window,0,0,0,0,0,false,false,false,false,0,null);
				input.dispatchEvent(evt);
			} else {
				$(input).trigger("click");
			}
		}
		else
		{
			alert('Unable to load a file in this browser.');
		}
	}

	this.saveDashboard = function()
	{
		var contentType = 'application/octet-stream';
		var blob = new Blob([JSON.stringify(self.serialize())], {'type': contentType});
		var file = "dashboard.json";

		if (/*@cc_on ! @*/ false || document.documentMode) {   // for IE
			window.navigator.msSaveBlob(blob, file);
		} else {
			var url = (window.URL || window.webkitURL);
			var data = url.createObjectURL(blob);
			var e = document.createEvent("MouseEvents");
			e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			var a = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
			a.href = data;
			a.download = file;
			a.dispatchEvent(e);
		}
	}

	this.addDatasource = function(datasource)
	{
		self.datasources.push(datasource);
	}

	this.deleteDatasource = function(datasource)
	{
		delete self.datasourceData[datasource.name()];
		datasource.dispose();
		self.datasources.remove(datasource);
	}

	this.createPane = function()
	{
		var newPane = new PaneModel(self, widgetPlugins);
		self.addPane(newPane);
	}

	this.addGridColumnLeft = function()
	{
		freeboardUI.addGridColumnLeft();
	}

	this.addGridColumnRight = function()
	{
		freeboardUI.addGridColumnRight();
	}

	this.subGridColumnLeft = function()
	{
		freeboardUI.subGridColumnLeft();
	}

	this.subGridColumnRight = function()
	{
		freeboardUI.subGridColumnRight();
	}

	this.addPane = function(pane)
	{
		self.panes.push(pane);
	}

	this.deletePane = function(pane)
	{
		pane.dispose();
		self.panes.remove(pane);
	}

	this.deleteWidget = function(widget)
	{
		ko.utils.arrayForEach(self.panes(), function(pane)
		{
			pane.widgets.remove(widget);
		});

		widget.dispose();
	}

	$.fn.transform = function(axis){
		var ret = 0;
		var elem = this;
		var matrix = elem.css('transform').replace(/[^0-9\-.,]/g, '').split(',');
		if (axis == 'y')
			ret = matrix[13] || matrix[5];
		else if (axis == 'x')
			ret = matrix[12] || matrix[4];
		if (_.isUndefined(ret))
			ret = 0;
		return ret;
	}

	this.setEditing = function(editing, animate)
	{
		// Don't allow editing if it's not allowed
		if(!self.allow_edit() && editing)
		{
			return;
		}

		self.isEditing(editing);

		if (editing == false) {
			if (self.isVisibleDatasources())
				self.setVisibilityDatasources(false);
			if (self.isVisibleBoardTools())
				self.setVisibilityBoardTools(false);
		}

		if(_.isUndefined(animate))
		{
			animate = true;
		}

		var elems = {
			main: $("#main-header"),
			board: $("#board-content")
		};

		var animateLength = (animate) ? 0.25 : 0;
		var barHeight = $("#admin-bar").outerHeight();
		var headerHeight = $("#main-header").outerHeight();

		_.each(elems, function(elem) {
			elem.css("transition", "transform");
			elem.css("transition-duration", animateLength + "s");
		});

		if(!editing)
		{
			$("#toggle-header-icon").addClass("icon-wrench").removeClass("icon-chevron-up");
			$(".gridster .gs_w").css({cursor: "default"});
			elems["main"].css("transform", "translateY(-" + barHeight + "px)");
			elems["board"].css("transform", "translateY(20px)");
			$("#main-header").data().shown = false;
			$(".sub-section").unbind();
			freeboardUI.disableGrid();
		}
		else
		{
			$("#toggle-header-icon").addClass("icon-chevron-up").removeClass("icon-wrench");
			$(".gridster .gs_w").css({cursor: "pointer"});
			elems["main"].css("transform", "translateY(0px)");
			elems["board"].css("transform", "translateY(" + headerHeight + "px)");
			$("#main-header").data().shown = true;
			freeboardUI.attachWidgetEditIcons($(".sub-section"));
			freeboardUI.enableGrid();
		}

		freeboardUI.showPaneEditIcons(editing, animate);
	}

	this.setVisibilityDatasources = function(visibility, animate)
	{
		// Don't allow editing if it's not allowed
		if(!self.allow_edit())
			return;

		if(_.isUndefined(animate))
			animate = true;

		self.isVisibleDatasources(visibility);

		var barElem = $("#datasources");

		var barWidth = barElem.outerWidth();

		var animateLength = (animate) ? 0.25  : 0;

		barElem.css("transition", "transform");
		barElem.css("transition-duration", animateLength + "s");

		if (visibility == true) {
			barElem.css("transform", "translateX(-" + barWidth + "px)");
		} else {
			barElem.css("transform", "translateX(" + barWidth + "px)");
		}
	}

	this.setVisibilityBoardTools = function(visibility, animate)
	{
		// Don't allow editing if it's not allowed
		if (!self.allow_edit())
			return;

		if (_.isUndefined(animate))
			animate = true;

		self.isVisibleBoardTools(visibility);

		var elems = {
			main: $("#main-header"),
			board: $("#board-content")
		};

		var barWidth = $("#board-tools").outerWidth();

		var animateLength = (animate) ? 0.25 : 0;

		var debounce = _.debounce(function() {
			// media query max-width : 960px
			if ($("#hamburger").css("display") == "none") {
				self.setVisibilityBoardTools(false);
				$(window).off("resize", debounce);
			}
		}, 200);

		_.each(elems, function(elem) {
			elem.css("transition", "transform");
			elem.css("transition-duration", animateLength + "s");
		});

		if (visibility == true) {
			$("html").addClass("boardtools-opening");
			$("#board-actions > ul").removeClass("collapse");
			_.each(elems, function(elem) {
				elem.css("transform", "translate(" + barWidth + "px, " + elem.transform('y') + "px)");
			});
			$(window).resize(debounce);
		} else {
			$("html").removeClass("boardtools-opening");
			$("#board-actions > ul").addClass("collapse");
			_.each(elems, function(elem) {
				elem.css("transform", "translate(0px, " + elem.transform('y') + "px)");
			});
			$(window).off("resize", debounce);
		}
	}

	this.toggleEditing = function()
	{
		self.setEditing(!self.isEditing());
	}

	this.toggleDatasources = function()
	{
		self.setVisibilityDatasources(!self.isVisibleDatasources());
	}

	this.toggleBoardTools = function()
	{
		self.setVisibilityBoardTools(!self.isVisibleBoardTools());
	}
}

// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

function FreeboardUI()
{
	var PANE_MARGIN = 10;
	var PANE_WIDTH = 300;
	var MIN_COLUMNS = 3;
	var COLUMN_WIDTH = PANE_MARGIN + PANE_WIDTH + PANE_MARGIN;

	var userColumns = MIN_COLUMNS;

	var loadingIndicator = $('<div class="wrapperloading"><div class="loading up" ></div><div class="loading down"></div></div>');
	var grid;

	function processResize(layoutWidgets)
	{
		var maxDisplayableColumns = getMaxDisplayableColumnCount();
		var repositionFunction = function(){};
		if(layoutWidgets)
		{
			repositionFunction = function(index)
			{
				var paneElement = this;
				var paneModel = ko.dataFor(paneElement);

				var newPosition = getPositionForScreenSize(paneModel);
				$(paneElement).attr("data-sizex", Math.min(paneModel.col_width(),
					maxDisplayableColumns, grid.cols))
					.attr("data-row", newPosition.row)
					.attr("data-col", newPosition.col);

				paneModel.processSizeChange();
			}
		}

		updateGridWidth(Math.min(maxDisplayableColumns, userColumns));

		repositionGrid(repositionFunction);
		updateGridColumnControls();
	}

	function addGridColumn(shift)
	{
		var num_cols = grid.cols + 1;
		if(updateGridWidth(num_cols))
		{
			repositionGrid(function() {
				var paneElement = this;
				var paneModel = ko.dataFor(paneElement);

				var prevColumnIndex = grid.cols > 1 ? grid.cols - 1 : 1;
				var prevCol = paneModel.col[prevColumnIndex];
				var prevRow = paneModel.row[prevColumnIndex];
				var newPosition;
				if(shift)
				{
					leftPreviewCol = true;
					var newCol = prevCol < grid.cols ? prevCol + 1 : grid.cols;
					newPosition = {row: prevRow, col: newCol};
				}
				else
				{
					rightPreviewCol = true;
					newPosition = {row: prevRow, col: prevCol};
				}
				$(paneElement).attr("data-sizex", Math.min(paneModel.col_width(), grid.cols))
					.attr("data-row", newPosition.row)
					.attr("data-col", newPosition.col);
			});
		}
		updateGridColumnControls();
		userColumns = grid.cols;
	}

	function subtractGridColumn(shift)
	{
		var num_cols = grid.cols - 1;
		if(updateGridWidth(num_cols))
		{
			repositionGrid(function() {
				var paneElement = this;
				var paneModel = ko.dataFor(paneElement);

				var prevColumnIndex = grid.cols + 1;
				var prevCol = paneModel.col[prevColumnIndex];
				var prevRow = paneModel.row[prevColumnIndex];
				var newPosition;
				if(shift)
				{
					var newCol = prevCol > 1 ? prevCol - 1 : 1;
					newPosition = {row: prevRow, col: newCol};
				}
				else
				{
					var newCol = prevCol <= grid.cols ? prevCol : grid.cols;
					newPosition = {row: prevRow, col: newCol};
				}
				$(paneElement).attr("data-sizex", Math.min(paneModel.col_width(), grid.cols))
					.attr("data-row", newPosition.row)
					.attr("data-col", newPosition.col);
			});
		}
		updateGridColumnControls();
		userColumns = grid.cols;
	}

	function updateGridColumnControls()
	{
		var col_controls = $(".column-tool");
		var available_width = $("#board-content").width();
		var max_columns = Math.floor(available_width / COLUMN_WIDTH);

		if(grid.cols <= MIN_COLUMNS)
		{
			col_controls.addClass("min");
		}
		else
		{
			col_controls.removeClass("min");
		}

		if(grid.cols >= max_columns)
		{
			col_controls.addClass("max");
		}
		else
		{
			col_controls.removeClass("max");
		}
	}

	function getMaxDisplayableColumnCount()
	{
		var available_width = $("#board-content").width();
		return Math.floor(available_width / COLUMN_WIDTH);
	}

	function updateGridWidth(newCols)
	{
		if(newCols === undefined || newCols < MIN_COLUMNS)
		{
			newCols = MIN_COLUMNS;
		}

		var max_columns = getMaxDisplayableColumnCount();
		if(newCols > max_columns)
		{
			newCols = max_columns;
		}

		// +newCols to account for scaling on zoomed browsers
		var new_width = (COLUMN_WIDTH * newCols) + newCols;
		$(".responsive-column-width").css("max-width", new_width);

		if(newCols === grid.cols)
		{
			return false;
		}
		else
		{
			return true;
		}
	}

	function repositionGrid(repositionFunction)
	{
		var rootElement = grid.$el;

		rootElement.find("> li").unbind().removeData();
		$(".responsive-column-width").css("width", "");
		grid.generate_grid_and_stylesheet();

		rootElement.find("> li").each(repositionFunction);

		grid.init();
		$(".responsive-column-width").css("width", grid.cols * PANE_WIDTH + (grid.cols * PANE_MARGIN * 2));
	}

	function getUserColumns()
	{
		return userColumns;
	}

	function setUserColumns(numCols)
	{
		userColumns = Math.max(MIN_COLUMNS, numCols);
	}

	ko.bindingHandlers.grid = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			// Initialize our grid
			grid = $(element).gridster({
				widget_margins        : [PANE_MARGIN, PANE_MARGIN],
				widget_base_dimensions: [PANE_WIDTH, 10],
				resize: {
					enabled : false,
					axes : "x"
				}
			}).data("gridster");

			processResize(false)

			grid.disable();
		}
	}

	function addPane(element, viewModel, isEditing)
	{
		var position = getPositionForScreenSize(viewModel);
		var col = position.col;
		var row = position.row;
		var width = Number(viewModel.width());
		var height = Number(viewModel.getCalculatedHeight());

		grid.add_widget(element, width, height, col, row);

		if(isEditing)
		{
			showPaneEditIcons(true);
		}

		updatePositionForScreenSize(viewModel, row, col);

		$(element).attrchange({
			trackValues: true,
			callback   : function(event)
			{
				if(event.attributeName == "data-row")
				{
					updatePositionForScreenSize(viewModel, Number(event.newValue), undefined);
				}
				else if(event.attributeName == "data-col")
				{
					updatePositionForScreenSize(viewModel, undefined, Number(event.newValue));
				}
			}
		});
	}

	function updatePane(element, viewModel)
	{
		// If widget has been added or removed
		var calculatedHeight = viewModel.getCalculatedHeight();

		var elementHeight = Number($(element).attr("data-sizey"));
		var elementWidth = Number($(element).attr("data-sizex"));

		if(calculatedHeight != elementHeight || viewModel.col_width() !=  elementWidth)
		{
			grid.resize_widget($(element), viewModel.col_width(), calculatedHeight, function(){
				grid.set_dom_grid_height();
			});
		}
	}

	function updatePositionForScreenSize(paneModel, row, col)
	{
		var displayCols = grid.cols;

		if(!_.isUndefined(row)) paneModel.row[displayCols] = row;
		if(!_.isUndefined(col)) paneModel.col[displayCols] = col;
	}

	function showLoadingIndicator(show)
	{
		if(show)
		{
			loadingIndicator.fadeOut(0).appendTo("body").fadeIn(500);
		}
		else
		{
			loadingIndicator.fadeOut(500).remove();
		}
	}

	function showPaneEditIcons(show, animate)
	{
		if(_.isUndefined(animate))
		{
			animate = true;
		}

		var animateLength = (animate) ? 250 : 0;

		if(show)
		{
			$(".pane-tools").fadeIn(animateLength);//.css("display", "block").animate({opacity: 1.0}, animateLength);
			$("#column-tools").fadeIn(animateLength);
		}
		else
		{
			$(".pane-tools").fadeOut(animateLength);//.animate({opacity: 0.0}, animateLength).css("display", "none");//, function()
			$("#column-tools").fadeOut(animateLength);
		}
	}

	function attachWidgetEditIcons(element)
	{
		$(element).hover(function()
		{
			showWidgetEditIcons(this, true);
		}, function()
		{
			showWidgetEditIcons(this, false);
		});
	}

	function showWidgetEditIcons(element, show)
	{
		if(show)
		{
			$(element).find(".sub-section-tools").fadeIn(250);
		}
		else
		{
			$(element).find(".sub-section-tools").fadeOut(250);
		}
	}

	function getPositionForScreenSize(paneModel)
	{
		var cols = grid.cols;

		if(_.isNumber(paneModel.row) && _.isNumber(paneModel.col)) // Support for legacy format
		{
			var obj = {};
			obj[cols] = paneModel.row;
			paneModel.row = obj;


			obj = {};
			obj[cols] = paneModel.col;
			paneModel.col = obj;
		}

		var newColumnIndex = 1;
		var columnDiff = 1000;

		for(var columnIndex in paneModel.col)
		{
			if(columnIndex == cols)	 // If we already have a position defined for this number of columns, return that position
			{
				return {row: paneModel.row[columnIndex], col: paneModel.col[columnIndex]};
			}
			else if(paneModel.col[columnIndex] > cols) // If it's greater than our display columns, put it in the last column
			{
				newColumnIndex = cols;
			}
			else // If it's less than, pick whichever one is closest
			{
				var delta = cols - columnIndex;

				if(delta < columnDiff)
				{
					newColumnIndex = columnIndex;
					columnDiff = delta;
				}
			}
		}

		if(newColumnIndex in paneModel.col && newColumnIndex in paneModel.row)
		{
			return {row: paneModel.row[newColumnIndex], col: paneModel.col[newColumnIndex]};
		}

		return {row:1,col:newColumnIndex};
	}


	// Public Functions
	return {
		showLoadingIndicator : function(show)
		{
			showLoadingIndicator(show);
		},
		showPaneEditIcons : function(show, animate)
		{
			showPaneEditIcons(show, animate);
		},
		attachWidgetEditIcons : function(element)
		{
			attachWidgetEditIcons(element);
		},
		getPositionForScreenSize : function(paneModel)
		{
			return getPositionForScreenSize(paneModel);
		},
		processResize : function(layoutWidgets)
		{
			processResize(layoutWidgets);
		},
		disableGrid : function()
		{
			grid.disable();
		},
		enableGrid : function()
		{
			grid.enable();
		},
		addPane : function(element, viewModel, isEditing)
		{
			addPane(element, viewModel, isEditing);
		},
		updatePane : function(element, viewModel)
		{
			updatePane(element, viewModel);
		},
		removePane : function(element)
		{
			grid.remove_widget(element);
		},
		removeAllPanes : function()
		{
			grid.remove_all_widgets();
		},
		addGridColumnLeft : function()
		{
			addGridColumn(true);
		},
		addGridColumnRight : function()
		{
			addGridColumn(false);
		},
		subGridColumnLeft : function()
		{
			subtractGridColumn(true);
		},
		subGridColumnRight : function()
		{
			subtractGridColumn(false);
		},
		getUserColumns : function()
		{
			return getUserColumns();
		},
		setUserColumns : function(numCols)
		{
			setUserColumns(numCols);
		}
	}
}

// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

JSEditor = function () {
	var assetRoot = ""

	function setAssetRoot(_assetRoot) {
		assetRoot = _assetRoot;
	}

	function displayJSEditor(value, mode, callback) {

		var exampleText;
		var codeWindow = $('<div class="code-window"></div>');
		var codeMirrorWrapper = $('<div class="code-mirror-wrapper"></div>');
		var codeWindowFooter = $('<div class="code-window-footer"></div>');
		var codeWindowHeader = $('<div class="code-window-header cm-s-ambiance"></div>');
		var config = {};

		switch (mode) {
			case 'javascript':
				exampleText = "// 例: 摂氏から華氏へ変換、小数点2桁以下切り捨て。\n// return (datasources[\"MyDatasource\"].sensor.tempInF * 1.8 + 32).toFixed(2);";
				codeWindowHeader = $('<div class="code-window-header cm-s-ambiance">このJavaScriptは、参照データソースが更新されるたびに再評価されます。そして<span class="cm-keyword">戻り値</span>はウィジェットに表示されます。あなたは関数<code><span class="cm-keyword">function</span>(<span class="cm-def">datasources</span>)</code>の中身をJavaScriptで記述することができます。引数datasourcesは追加したデータソースの配列です。</div>');

				// If value is empty, go ahead and suggest something
				if (!value)
					value = exampleText;

				config = {
					value: value,
					mode: "javascript",
					theme: "ambiance",
					indentUnit: 4,
					lineNumbers: true,
					matchBrackets: true,
					autoCloseBrackets: true,
					gutters: ["CodeMirror-lint-markers"],
					lint: true
				};
				break;
			case 'json':
				exampleText = '// 例: {\n//    "title": "タイトル"\n//    "value": 10\n}';
				codeWindowHeader = $('<div class="code-window-header cm-s-ambiance"><span class="cm-keyword">"(ダブルクォーテーション)</span>で括った文字列の中では適切なエスケープシーケンスを使用して下さい。<br>例: "function(label, series){return (\\\"ID:\\\"+label);}" </div>');

				config = {
					value: value,
					mode: "javascript",
					json: true,
					theme: "ambiance",
					indentUnit: 4,
					lineNumbers: true,
					matchBrackets: true,
					autoCloseBrackets: true,
					gutters: ["CodeMirror-lint-markers"],
					lint: true
				};
				break;
		}

		codeWindow.append([codeWindowHeader, codeMirrorWrapper, codeWindowFooter]);

		$("body").append(codeWindow);

		var codeMirrorEditor = CodeMirror(codeMirrorWrapper.get(0), config);

		var closeButton = $('<span id="dialog-cancel" class="text-button">閉じる</span>').click(function () {
			if (callback) {
				var newValue = codeMirrorEditor.getValue();

				if (newValue === exampleText) {
					newValue = "";
				}

				var error = null;
				switch (mode) {
					case 'json':
						if (JSHINT.errors.length > 1) {
							alert("Please correct the json error.");
							return;
						}
						break;
				}
				callback(newValue);
				codeWindow.remove();
			}
		});

		codeWindowFooter.append(closeButton);
	}

	// Public API
	return {
		displayJSEditor: function (value, mode, callback) {
			displayJSEditor(value, mode, callback);
		},
		setAssetRoot: function (assetRoot) {
			setAssetRoot(assetRoot)
		}
	}
}

// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

function PaneModel(theFreeboardModel, widgetPlugins) {
	var self = this;

	this.title = ko.observable();
	this.width = ko.observable(1);
	this.row = {};
	this.col = {};

	this.col_width = ko.observable(1);
	this.col_width.subscribe(function(newValue)
	{
		self.processSizeChange();
	});

	this.widgets = ko.observableArray();

	this.addWidget = function (widget) {
		this.widgets.push(widget);
	}

	this.widgetCanMoveUp = function (widget) {
		return (self.widgets.indexOf(widget) >= 1);
	}

	this.widgetCanMoveDown = function (widget) {
		var i = self.widgets.indexOf(widget);

		return (i < self.widgets().length - 1);
	}

	this.moveWidgetUp = function (widget) {
		if (self.widgetCanMoveUp(widget)) {
			var i = self.widgets.indexOf(widget);
			var array = self.widgets();
			self.widgets.splice(i - 1, 2, array[i], array[i - 1]);
		}
	}

	this.moveWidgetDown = function (widget) {
		if (self.widgetCanMoveDown(widget)) {
			var i = self.widgets.indexOf(widget);
			var array = self.widgets();
			self.widgets.splice(i, 2, array[i + 1], array[i]);
		}
	}

	this.processSizeChange = function()
	{
		// Give the animation a moment to complete. Really hacky.
		// TODO: Make less hacky. Also, doesn't work when screen resizes.
		setTimeout(function(){
			_.each(self.widgets(), function (widget) {
				widget.processSizeChange();
			});
		}, 1000);
	}

	this.getCalculatedHeight = function () {
		var memo = 0;
		var sumHeights = _.reduce(self.widgets(), function (memo, widget) {
			return Number(memo) + (widget.height());
		}, 0);

		sumHeights *= 6;
		sumHeights += 3;

		sumHeights *= 10;

		var rows = Math.ceil((sumHeights + 20) / 30);

		return Math.max(4, rows);
	}

	this.serialize = function () {
		var widgets = [];

		_.each(self.widgets(), function (widget) {
			widgets.push(widget.serialize());
		});

		return {
			title: self.title(),
			width: self.width(),
			row: self.row,
			col: self.col,
			col_width: self.col_width(),
			widgets: widgets
		};
	}

	this.deserialize = function (object) {
		self.title(object.title);
		self.width(object.width);

		self.row = object.row;
		self.col = object.col;
		self.col_width(object.col_width || 1);

		_.each(object.widgets, function (widgetConfig) {
			var widget = new WidgetModel(theFreeboardModel, widgetPlugins);
			widget.deserialize(widgetConfig);
			self.widgets.push(widget);
		});
	}

	this.dispose = function () {
		_.each(self.widgets(), function (widget) {
			widget.dispose();
		});
	}
}

// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

PluginEditor = function(jsEditor, valueEditor)
{
	function _removeSettingsRows()
	{
		if($("#setting-row-instance-name").length)
		{
			$("#setting-row-instance-name").nextAll().remove();
		}
		else
		{
			$("#setting-row-plugin-types").nextAll().remove();
		}
	}

	function _toValidateClassString(validate, type) {
		var ret = "";
		if (!_.isUndefined(validate)) {
			var types = "";
			if (!_.isUndefined(type))
				types = " " + type;
			ret = "validate[" + validate + "]" + types;
		}
		return ret;
	}

	function _isNumerical(n)
	{
		return !isNaN(parseFloat(n)) && isFinite(n);
	}

	function _appendCalculatedSettingRow(valueCell, newSettings, settingDef, currentValue, includeRemove)
	{
		var input = $('<textarea></textarea>').addClass(_toValidateClassString(settingDef.validate, "text-input")).attr("style", settingDef.style);

		if(settingDef.multi_input) {
			input.change(function() {
				var arrayInput = [];
				$(valueCell).find('textarea').each(function() {
					var thisVal = $(this).val();
					if(thisVal) {
						arrayInput = arrayInput.concat(thisVal);
					}
				});
				newSettings.settings[settingDef.name] = arrayInput;
			});
		} else {
			input.change(function() {
				newSettings.settings[settingDef.name] = $(this).val();
			});
		}

		if(currentValue) {
			input.val(currentValue);
		}

		valueEditor.createValueEditor(input);

		var datasourceToolbox = $('<ul class="board-toolbar datasource-input-suffix"></ul>');
		var wrapperDiv = $('<div class="calculated-setting-row"></div>');

		wrapperDiv.append(input).append(datasourceToolbox);

		var datasourceTool = $('<li><i class="icon-plus icon-white"></i><label>データソース</label></li>')
			.mousedown(function(e) {
				e.preventDefault();
				$(input).val("").focus().insertAtCaret("datasources[\"").trigger("freeboard-eval");
			});
		datasourceToolbox.append(datasourceTool);

		var jsEditorTool = $('<li><i class="icon-fullscreen icon-white"></i><label>.JS EDITOR</label></li>')
			.mousedown(function(e) {
				e.preventDefault();
				jsEditor.displayJSEditor(input.val(), 'javascript', function(result) {
					input.val(result);
					input.change();
				});
			});
		datasourceToolbox.append(jsEditorTool);

		if(includeRemove) {
			var removeButton = $('<li class="remove-setting-row"><i class="icon-minus icon-white"></i><label></label></li>')
				.mousedown(function(e) {
					e.preventDefault();
					wrapperDiv.remove();
					$(valueCell).find('textarea:first').change();
			});
			datasourceToolbox.prepend(removeButton);
		}

		$(valueCell).append(wrapperDiv);
	}

	function createPluginEditor(title, pluginTypes, currentTypeName, currentSettingsValues, settingsSavedCallback)
	{
		var newSettings = {
			type    : currentTypeName,
			settings: {}
		};

		function createSettingRow(name, displayName)
		{
			var tr = $('<div id="setting-row-' + name + '" class="form-row"></div>').appendTo(form);

			tr.append('<div class="form-label"><label class="control-label">' + displayName + '</label></div>');
			return $('<div id="setting-value-container-' + name + '" class="form-value"></div>').appendTo(tr);
		}

		var selectedType;
		var form = $('<form id="plugin-editor"></form>');

		var pluginDescriptionElement = $('<div id="plugin-description"></div>').hide();
		form.append(pluginDescriptionElement);

		function createSettingsFromDefinition(settingsDefs)
		{
			var colorPickerID = 0;

			_.each(settingsDefs, function(settingDef)
			{
				// Set a default value if one doesn't exist
				if(!_.isUndefined(settingDef.default_value) && _.isUndefined(currentSettingsValues[settingDef.name]))
				{
					currentSettingsValues[settingDef.name] = settingDef.default_value;
				}

				var displayName = settingDef.name;

				if(!_.isUndefined(settingDef.display_name))
				{
					displayName = settingDef.display_name;
				}

				settingDef.style = _.isUndefined(settingDef.style) ? '' : settingDef.style;

				// modify required field name
				if(!_.isUndefined(settingDef.validate)) {
					if (settingDef.validate.indexOf("required") != -1) {
						displayName = "* " + displayName;
					}
				}

				var valueCell = createSettingRow(settingDef.name, displayName);

				switch (settingDef.type)
				{
					case "array":
					{
						var subTableDiv = $('<div class="form-table-value-subtable"></div>').appendTo(valueCell);

						var subTable = $('<table class="table table-condensed sub-table"></table>').appendTo(subTableDiv);
						var subTableHead = $("<thead></thead>").hide().appendTo(subTable);
						var subTableHeadRow = $("<tr></tr>").appendTo(subTableHead);
						var subTableBody = $('<tbody></tbody>').appendTo(subTable);

						var currentSubSettingValues = [];

						// Create our headers
						_.each(settingDef.settings, function(subSettingDef)
						{
							var subsettingDisplayName = subSettingDef.name;

							if(!_.isUndefined(subSettingDef.display_name))
							{
								subsettingDisplayName = subSettingDef.display_name;
							}

							$('<th>' + subsettingDisplayName + '</th>').appendTo(subTableHeadRow);
						});

						if(settingDef.name in currentSettingsValues)
						{
							currentSubSettingValues = currentSettingsValues[settingDef.name];
						}

						function processHeaderVisibility()
						{
							if(newSettings.settings[settingDef.name].length > 0)
							{
								subTableHead.show();
							}
							else
							{
								subTableHead.hide();
							}
						}

						function createSubsettingRow(subsettingValue)
						{
							var subsettingRow = $('<tr></tr>').appendTo(subTableBody);

							var newSetting = {};

							if(!_.isArray(newSettings.settings[settingDef.name]))
							{
								newSettings.settings[settingDef.name] = [];
							}

							newSettings.settings[settingDef.name].push(newSetting);

							_.each(settingDef.settings, function(subSettingDef)
							{
								var subsettingCol = $('<td></td>').appendTo(subsettingRow);
								var subsettingValueString = "";

								if(!_.isUndefined(subsettingValue[subSettingDef.name]))
								{
									subsettingValueString = subsettingValue[subSettingDef.name];
								}

								newSetting[subSettingDef.name] = subsettingValueString;

								$('<input class="table-row-value" type="text">')
										.addClass(_toValidateClassString(subSettingDef.validate, "text-input"))
										.attr("style", settingDef.style)
										.appendTo(subsettingCol).val(subsettingValueString).change(function()
								{
									newSetting[subSettingDef.name] = $(this).val();
								});
							});

							subsettingRow.append($('<td class="table-row-operation"></td>').append($('<ul class="board-toolbar"></ul>').append($('<li></li>').append($('<i class="icon-trash icon-white"></i>').click(function()
												{
													var subSettingIndex = newSettings.settings[settingDef.name].indexOf(newSetting);

													if(subSettingIndex != -1)
													{
														newSettings.settings[settingDef.name].splice(subSettingIndex, 1);
														subsettingRow.remove();
														processHeaderVisibility();
													}
												})))));

							subTableDiv.scrollTop(subTableDiv[0].scrollHeight);

							processHeaderVisibility();
						}

						$('<div class="table-operation text-button">追加</div>').appendTo(valueCell).click(function()
						{
							var newSubsettingValue = {};

							_.each(settingDef.settings, function(subSettingDef)
							{
								newSubsettingValue[subSettingDef.name] = "";
							});

							createSubsettingRow(newSubsettingValue);
						});

						// Create our rows
						_.each(currentSubSettingValues, function(currentSubSettingValue, subSettingIndex)
						{
							createSubsettingRow(currentSubSettingValue);
						});

						break;
					}
					case "boolean":
					{
						newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

						var onOffSwitch = $('<div class="onoffswitch"><label class="onoffswitch-label" for="' + settingDef.name + '-onoff"><div class="onoffswitch-inner"><span class="on">はい</span><span class="off">いいえ</span></div><div class="onoffswitch-switch"></div></label></div>').appendTo(valueCell);

						var input = $('<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="' + settingDef.name + '-onoff">').prependTo(onOffSwitch).change(function()
						{
							newSettings.settings[settingDef.name] = this.checked;
						});

						if(settingDef.name in currentSettingsValues)
						{
							input.prop("checked", currentSettingsValues[settingDef.name]);
						}

						break;
					}
					case "option":
					{
						var defaultValue = currentSettingsValues[settingDef.name];

						var input = $('<select></select>')
											.addClass(_toValidateClassString(settingDef.validate))
											.attr("style", settingDef.style)
											.appendTo($('<div class="styled-select"></div>')
											.appendTo(valueCell)).change(function()
						{
							newSettings.settings[settingDef.name] = $(this).val();
						});

						_.each(settingDef.options, function(option)
						{

							var optionName;
							var optionValue;

							if(_.isObject(option))
							{
								optionName = option.name;
								optionValue = option.value;
							}
							else
							{
								optionName = option;
							}

							if(_.isUndefined(optionValue))
							{
								optionValue = optionName;
							}

							if(_.isUndefined(defaultValue))
							{
								defaultValue = optionValue;
							}

							$("<option></option>").text(optionName).attr("value", optionValue).appendTo(input);
						});

						newSettings.settings[settingDef.name] = defaultValue;

						if(settingDef.name in currentSettingsValues)
						{
							input.val(currentSettingsValues[settingDef.name]);
						}

						break;
					}
					case "color":
					{
						var curColorPickerID = "picker-" + colorPickerID++;
						var thisColorPickerID = "#" + curColorPickerID;
						var defaultValue = currentSettingsValues[settingDef.name];
						var input = $('<input id="' + curColorPickerID + '" type="text">').addClass(_toValidateClassString(settingDef.validate, "text-input")).appendTo(valueCell);

						newSettings.settings[settingDef.name] = defaultValue;

						$(thisColorPickerID).css({
							"border-right":"30px solid green",
							"width":"80px"
						});

						$(thisColorPickerID).css('border-color', defaultValue);

						var defhex = defaultValue;
						defhex.replace("#", "");

						$(thisColorPickerID).colpick({
							layout:'hex',
							colorScheme:'dark',
							color: defhex,
							submit:0,
							onChange:function(hsb,hex,rgb,el,bySetColor) {
								$(el).css('border-color','#'+hex);
								newSettings.settings[settingDef.name] = '#'+hex;
								if(!bySetColor) {
									$(el).val('#'+hex);
								}
							}
						}).keyup(function(){
							$(this).colpickSetColor(this.value);
						});

						if(settingDef.name in currentSettingsValues) {
							input.val(currentSettingsValues[settingDef.name]);
						}

						break;
					}
					case 'json':
					{
						newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

						var input = $('<textarea class="calculated-value-input" style="z-index: 3000"></textarea>')
								.addClass(_toValidateClassString(settingDef.validate, "text-input"))
								.attr("style", settingDef.style)
								.appendTo(valueCell).change(function()
						{
							newSettings.settings[settingDef.name] = $(this).val();
						});

						if(settingDef.name in currentSettingsValues)
						{
							input.val(currentSettingsValues[settingDef.name]);
						}

						valueEditor.createValueEditor(input);

						var datasourceToolbox = $('<ul class="board-toolbar datasource-input-suffix"></ul>');

						var jsEditorTool = $('<li><i class="icon-fullscreen icon-white"></i><label>.JSON EDITOR</label></li>').mousedown(function(e)
						{
							e.preventDefault();

							jsEditor.displayJSEditor(input.val(), 'json', function(result){
								input.val(result);
								input.change();
							});
						});

						$(valueCell).append(datasourceToolbox.append(jsEditorTool));

						break;
					}
					default:
					{
						newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

						if(settingDef.type == "calculated")
						{
							if(settingDef.name in currentSettingsValues) {
								var currentValue = currentSettingsValues[settingDef.name];
								if(settingDef.multi_input && _.isArray(currentValue)) {
									var includeRemove = false;
									for(var i=0; i<currentValue.length; i++) {
										_appendCalculatedSettingRow(valueCell, newSettings, settingDef, currentValue[i], includeRemove);
										includeRemove = true;
									}
								} else {
									_appendCalculatedSettingRow(valueCell, newSettings, settingDef, currentValue, false);
								}
							} else {
								_appendCalculatedSettingRow(valueCell, newSettings, settingDef, null, false);
							}

							if(settingDef.multi_input) {
								var inputAdder = $('<ul class="board-toolbar"><li class="add-setting-row"><i class="icon-plus icon-white"></i><label>追加</label></li></ul>')
									.mousedown(function(e) {
										e.preventDefault();
										_appendCalculatedSettingRow(valueCell, newSettings, settingDef, null, true);
									});
								$(valueCell).siblings('.form-label').append(inputAdder);
							}
						}
						else
						{
							var input = $('<input type="text">')
												.addClass(_toValidateClassString(settingDef.validate, "text-input"))
												.attr("style", settingDef.style)
												.appendTo(valueCell).change(function() {
								newSettings.settings[settingDef.name] = $(this).val();
							});

							if(settingDef.name in currentSettingsValues)
							{
								input.val(currentSettingsValues[settingDef.name]);
							}
						}

						break;
					}
				}

				if(!_.isUndefined(settingDef.suffix))
				{
					valueCell.append($('<div class="input-suffix">' + settingDef.suffix + '</div>'));
				}

				if(!_.isUndefined(settingDef.description))
				{
					valueCell.append($('<div class="setting-description">' + settingDef.description + '</div>'));
				}
			});
		}

		new DialogBox(form, title, "保存", "キャンセル", function(okcancel)
		{
			if (okcancel == "ok") {
				if(_.isFunction(settingsSavedCallback))
				{
					settingsSavedCallback(newSettings);
				}
			}

			// Remove colorpick dom objects
			colorPickerID = 0;
			$("[id^=collorpicker]").remove();
		});

		// Create our body
		var pluginTypeNames = _.keys(pluginTypes);
		var typeSelect;

		if(pluginTypeNames.length > 1)
		{
			var typeRow = createSettingRow("plugin-types", "タイプ");
			typeSelect = $('<select></select>').appendTo($('<div class="styled-select"></div>').appendTo(typeRow));

			typeSelect.append($("<option>追加するタイプを選択してください。</option>").attr("value", "undefined"));

			_.each(pluginTypes, function(pluginType)
			{
				typeSelect.append($("<option></option>").text(pluginType.display_name).attr("value", pluginType.type_name));
			});

			typeSelect.change(function()
			{
				newSettings.type = $(this).val();
				newSettings.settings = {};

				// Remove all the previous settings
				_removeSettingsRows();

				selectedType = pluginTypes[typeSelect.val()];

				if(_.isUndefined(selectedType))
				{
					$("#setting-row-instance-name").hide();
					$("#dialog-ok").hide();
				}
				else
				{
					$("#setting-row-instance-name").show();

					if(selectedType.description && selectedType.description.length > 0)
					{
						pluginDescriptionElement.html(selectedType.description).show();
					}
					else
					{
						pluginDescriptionElement.hide();
					}

					$("#dialog-ok").show();
					createSettingsFromDefinition(selectedType.settings);
				}
			});
		}
		else if(pluginTypeNames.length == 1)
		{
			selectedType = pluginTypes[pluginTypeNames[0]];
			newSettings.type = selectedType.type_name;
			newSettings.settings = {};
			createSettingsFromDefinition(selectedType.settings);
		}

		if(typeSelect)
		{
			if(_.isUndefined(currentTypeName))
			{
				$("#setting-row-instance-name").hide();
				$("#dialog-ok").hide();
			}
			else
			{
				$("#dialog-ok").show();
				typeSelect.val(currentTypeName).trigger("change");
			}
		}
	}

	// Public API
	return {
		createPluginEditor : function(
					title,
					pluginTypes,
					currentInstanceName,
					currentTypeName,
					currentSettingsValues,
					settingsSavedCallback)
		{
			createPluginEditor(title, pluginTypes, currentInstanceName, currentTypeName, currentSettingsValues, settingsSavedCallback);
		}
	}
}

// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

ValueEditor = function(theFreeboardModel)
{
	var _veDatasourceRegex = new RegExp(".*datasources\\[\"([^\"]*)(\"\\])?(.*)$");

	var dropdown = null;
	var selectedOptionIndex = 0;
	var _autocompleteOptions = [];
	var currentValue = null;

	var EXPECTED_TYPE = {
		ANY : "any",
		ARRAY : "array",
		OBJECT : "object",
		STRING : "string",
		NUMBER : "number",
		BOOLEAN : "boolean"
	};

	function _isPotentialTypeMatch(value, expectsType)
	{
		if(_.isArray(value) || _.isObject(value))
		{
			return true;
		}
		return _isTypeMatch(value, expectsType);
	}

	function _isTypeMatch(value, expectsType) {
		switch(expectsType)
		{
		case EXPECTED_TYPE.ANY: return true;
		case EXPECTED_TYPE.ARRAY: return _.isArray(value);
		case EXPECTED_TYPE.OBJECT: return _.isObject(value);
		case EXPECTED_TYPE.STRING: return _.isString(value);
		case EXPECTED_TYPE.NUMBER: return _.isNumber(value);
		case EXPECTED_TYPE.BOOLEAN: return _.isBoolean(value);
		}
	}

	function _checkCurrentValueType(element, expectsType) {
		$(element).parent().find(".validation-error").remove();
		if(!_isTypeMatch(currentValue, expectsType)) {
			$(element).parent().append("<div class='validation-error'>" +
				"This field expects an expression that evaluates to type " +
				expectsType + ".</div>");
		}
	}

	function _resizeValueEditor(element)
	{
		var lineBreakCount = ($(element).val().match(/\n/g) || []).length;

		var newHeight = Math.min(200, 20 * (lineBreakCount + 1));

		$(element).css({height: newHeight + "px"});
	}

	function _autocompleteFromDatasource(inputString, datasources, expectsType)
	{
		var match = _veDatasourceRegex.exec(inputString);

		var options = [];

		if(match)
		{
			// Editor value is: datasources["; List all datasources
			if(match[1] == "")
			{
				_.each(datasources, function(datasource)
				{
					options.push({value: datasource.name(), entity: undefined,
						precede_char: "", follow_char: "\"]"});
				});
			}
			// Editor value is a partial match for a datasource; list matching datasources
			else if(match[1] != "" && _.isUndefined(match[2]))
			{
				var replacementString = match[1];

				_.each(datasources, function(datasource)
				{
					var dsName = datasource.name();

					if(dsName != replacementString && dsName.indexOf(replacementString) == 0)
					{
						options.push({value: dsName, entity: undefined,
							precede_char: "", follow_char: "\"]"});
					}
				});
			}
			// Editor value matches a datasources; parse JSON in order to populate list
			else
			{
				// We already have a datasource selected; find it
				var datasource = _.find(datasources, function(datasource)
				{
					return (datasource.name() === match[1]);
				});

				if(!_.isUndefined(datasource))
				{
					var dataPath = "data";
					var remainder = "";

					// Parse the partial JSON selectors
					if(!_.isUndefined(match[2]))
					{
						// Strip any incomplete field values, and store the remainder
						var remainderIndex = match[3].lastIndexOf("]") + 1;
						dataPath = dataPath + match[3].substring(0, remainderIndex);
						remainder = match[3].substring(remainderIndex, match[3].length);
						remainder = remainder.replace(/^[\[\"]*/, "");
						remainder = remainder.replace(/[\"\]]*$/, "");
					}

					// Get the data for the last complete JSON field
					var dataValue = datasource.getDataRepresentation(dataPath);
					currentValue = dataValue;

					// For arrays, list out the indices
					if(_.isArray(dataValue))
					{
						for(var index = 0; index < dataValue.length; index++)
						{
							if(index.toString().indexOf(remainder) == 0)
							{
								var value = dataValue[index];
								if(_isPotentialTypeMatch(value, expectsType))
								{
									options.push({value: index, entity: value,
										precede_char: "[", follow_char: "]",
										preview: value.toString()});
								}
							}
						}
					}
					// For objects, list out the keys
					else if(_.isObject(dataValue))
					{
						_.each(dataValue, function(value, name)
						{
							if(name.indexOf(remainder) == 0)
							{
								if(_isPotentialTypeMatch(value, expectsType))
								{
									options.push({value: name, entity: value,
										precede_char: "[\"", follow_char: "\"]"});
								}
							}
						});
					}
					// For everything else, do nothing (no further selection possible)
					else
					{
						// no-op
					}
				}
			}
		}
		_autocompleteOptions = options;
	}

	function _renderAutocompleteDropdown(element, expectsType)
	{
		var inputString = $(element).val().substring(0, $(element).getCaretPosition());

		// Weird issue where the textarea box was putting in ASCII (nbsp) for spaces.
		inputString = inputString.replace(String.fromCharCode(160), " ");

		_autocompleteFromDatasource(inputString, theFreeboardModel.datasources(), expectsType);

		if(_autocompleteOptions.length > 0)
		{
			if(!dropdown)
			{
				dropdown = $('<ul id="value-selector" class="value-dropdown"></ul>')
					.insertAfter(element)
					.width($(element).outerWidth() - 2)
					.css("left", $(element).position().left)
					.css("top", $(element).position().top + $(element).outerHeight() - 1);
			}

			dropdown.empty();
			dropdown.scrollTop(0);

			var selected = true;
			selectedOptionIndex = 0;

			_.each(_autocompleteOptions, function(option, index)
			{
				var li = _renderAutocompleteDropdownOption(element, inputString, option, index);
				if(selected)
				{
					$(li).addClass("selected");
					selected = false;
				}
			});
		}
		else
		{
			_checkCurrentValueType(element, expectsType);
			$(element).next("ul#value-selector").remove();
			dropdown = null;
			selectedOptionIndex = -1;
		}
	}

	function _renderAutocompleteDropdownOption(element, inputString, option, currentIndex)
	{
		var optionLabel = option.value;
		if(option.preview)
		{
			optionLabel = optionLabel + "<span class='preview'>" + option.preview + "</span>";
		}
		var li = $('<li>' + optionLabel + '</li>').appendTo(dropdown)
			.mouseenter(function()
			{
				$(this).trigger("freeboard-select");
			})
			.mousedown(function(event)
			{
				$(this).trigger("freeboard-insertValue");
				event.preventDefault();
			})
			.data("freeboard-optionIndex", currentIndex)
			.data("freeboard-optionValue", option.value)
			.bind("freeboard-insertValue", function()
			{
				var optionValue = option.value;
				optionValue = option.precede_char + optionValue + option.follow_char;

				var replacementIndex = inputString.lastIndexOf("]");
				if(replacementIndex != -1)
				{
					$(element).replaceTextAt(replacementIndex+1, $(element).val().length,
						optionValue);
				}
				else
				{
					$(element).insertAtCaret(optionValue);
				}

				currentValue = option.entity;
				$(element).triggerHandler("mouseup");
			})
			.bind("freeboard-select", function()
			{
				$(this).parent().find("li.selected").removeClass("selected");
				$(this).addClass("selected");
				selectedOptionIndex = $(this).data("freeboard-optionIndex");
			});
		return li;
	}

	function createValueEditor(element, expectsType)
	{
		$(element).addClass("calculated-value-input")
			.bind("keyup mouseup freeboard-eval", function(event) {
				// Ignore arrow keys and enter keys
				if(dropdown && event.type == "keyup"
					&& (event.keyCode == 38 || event.keyCode == 40 || event.keyCode == 13))
				{
					event.preventDefault();
					return;
				}
				_renderAutocompleteDropdown(element, expectsType);
			})
			.focus(function()
			{
				$(element).css({"z-index" : 3001});
				_resizeValueEditor(element);
			})
			.focusout(function()
			{
				_checkCurrentValueType(element, expectsType);
				$(element).css({
					"height": "",
					"z-index" : 3000
				});
				$(element).next("ul#value-selector").remove();
				dropdown = null;
				selectedOptionIndex = -1;
			})
			.bind("keydown", function(event)
			{

				if(dropdown)
				{
					if(event.keyCode == 38 || event.keyCode == 40) // Handle Arrow keys
					{
						event.preventDefault();

						var optionItems = $(dropdown).find("li");

						if(event.keyCode == 38) // Up Arrow
						{
							selectedOptionIndex--;
						}
						else if(event.keyCode == 40) // Down Arrow
						{
							selectedOptionIndex++;
						}

						if(selectedOptionIndex < 0)
						{
							selectedOptionIndex = optionItems.size() - 1;
						}
						else if(selectedOptionIndex >= optionItems.size())
						{
							selectedOptionIndex = 0;
						}

						var optionElement = $(optionItems).eq(selectedOptionIndex);

						optionElement.trigger("freeboard-select");
						$(dropdown).scrollTop($(optionElement).position().top);
					}
					else if(event.keyCode == 13) // Handle enter key
					{
						event.preventDefault();

						if(selectedOptionIndex != -1)
						{
							$(dropdown).find("li").eq(selectedOptionIndex)
								.trigger("freeboard-insertValue");
						}
					}
				}
			});
	}

	// Public API
	return {
		createValueEditor : function(element, expectsType)
		{
			if(expectsType)
			{
				createValueEditor(element, expectsType);
			}
			else {
				createValueEditor(element, EXPECTED_TYPE.ANY);
			}
		},
		EXPECTED_TYPE : EXPECTED_TYPE
	}
}

// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

function WidgetModel(theFreeboardModel, widgetPlugins) {
	function disposeWidgetInstance() {
		if (!_.isUndefined(self.widgetInstance)) {
			if (_.isFunction(self.widgetInstance.onDispose)) {
				self.widgetInstance.onDispose();
			}

			self.widgetInstance = undefined;
		}
	}

	var self = this;

	this.datasourceRefreshNotifications = {};
	this.calculatedSettingScripts = {};

	this.isEditing = ko.observable(false); // editing by PluginEditor
	this.title = ko.observable();
	this.fillSize = ko.observable(false);

	this.type = ko.observable();
	this.type.subscribe(function (newValue) {
		disposeWidgetInstance();

		if ((newValue in widgetPlugins) && _.isFunction(widgetPlugins[newValue].newInstance)) {
			var widgetType = widgetPlugins[newValue];

			function finishLoad() {
				widgetType.newInstance(self.settings(), function (widgetInstance) {

					self.fillSize((widgetType.fill_size === true));
					self.widgetInstance = widgetInstance;
					self.shouldRender(true);
					self._heightUpdate.valueHasMutated();

				});
			}

			// Do we need to load any external scripts?
			if (widgetType.external_scripts) {
				head.js(widgetType.external_scripts.slice(0), finishLoad); // Need to clone the array because head.js adds some weird functions to it
			}
			else {
				finishLoad();
			}
		}
	});

	this.settings = ko.observable({});
	this.settings.subscribe(function (newValue) {
		if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onSettingsChanged)) {
			self.widgetInstance.onSettingsChanged(newValue);
		}

		self.updateCalculatedSettings();
		self._heightUpdate.valueHasMutated();
	});

	this.processDatasourceUpdate = function (datasourceName) {
		var refreshSettingNames = self.datasourceRefreshNotifications[datasourceName];

		if (_.isArray(refreshSettingNames)) {
			_.each(refreshSettingNames, function (settingName) {
				self.processCalculatedSetting(settingName);
			});
		}
	}

	this.callValueFunction = function (theFunction) {
		return theFunction.call(undefined, theFreeboardModel.datasourceData);
	}

	this.processSizeChange = function () {
		if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onSizeChanged)) {
			self.widgetInstance.onSizeChanged();
		}
	}

	this.processCalculatedSetting = function (settingName) {
		if (_.isFunction(self.calculatedSettingScripts[settingName])) {
			var returnValue = undefined;

			try {
				returnValue = self.callValueFunction(self.calculatedSettingScripts[settingName]);
			}
			catch (e) {
				var rawValue = self.settings()[settingName];

				// If there is a reference error and the value just contains letters and numbers, then
				if (e instanceof ReferenceError && (/^\w+$/).test(rawValue)) {
					returnValue = rawValue;
				}
			}

			if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onCalculatedValueChanged) && !_.isUndefined(returnValue)) {
				try {
					self.widgetInstance.onCalculatedValueChanged(settingName, returnValue);
				}
				catch (e) {
					console.log(e.toString());
				}
			}
		}
	}

	this.updateCalculatedSettings = function () {
		self.datasourceRefreshNotifications = {};
		self.calculatedSettingScripts = {};

		if (_.isUndefined(self.type())) {
			return;
		}

		// Check for any calculated settings
		var settingsDefs = widgetPlugins[self.type()].settings;
		var datasourceRegex = new RegExp("datasources.([\\w_-]+)|datasources\\[['\"]([^'\"]+)", "g");
		var currentSettings = self.settings();

		_.each(settingsDefs, function (settingDef) {
			if (settingDef.type == "calculated") {
				var script = currentSettings[settingDef.name];

				if (!_.isUndefined(script)) {

					if(_.isArray(script)) {
						script = "[" + script.join(",") + "]";
					}

					// If there is no return, add one
					if ((script.match(/;/g) || []).length <= 1 && script.indexOf("return") == -1) {
						script = "return " + script;
					}

					var valueFunction;

 					try {
						valueFunction = new Function("datasources", script);
					}
					catch (e) {
						var literalText = currentSettings[settingDef.name].replace(/"/g, '\\"').replace(/[\r\n]/g, ' \\\n');

						// If the value function cannot be created, then go ahead and treat it as literal text
						valueFunction = new Function("datasources", "return \"" + literalText + "\";");
					}

					self.calculatedSettingScripts[settingDef.name] = valueFunction;
					self.processCalculatedSetting(settingDef.name);

					// Are there any datasources we need to be subscribed to?
					var matches;

					while (matches = datasourceRegex.exec(script)) {
						var dsName = (matches[1] || matches[2]);
						var refreshSettingNames = self.datasourceRefreshNotifications[dsName];

						if (_.isUndefined(refreshSettingNames)) {
							refreshSettingNames = [];
							self.datasourceRefreshNotifications[dsName] = refreshSettingNames;
						}

						if(_.indexOf(refreshSettingNames, settingDef.name) == -1) // Only subscribe to this notification once.
						{
							refreshSettingNames.push(settingDef.name);
						}
					}
				}
			}
		});
	}

	this._heightUpdate = ko.observable();
	this.height = ko.computed({
		read: function () {
			self._heightUpdate();

			if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.getHeight)) {
				return self.widgetInstance.getHeight();
			}

			return 1;
		}
	});

	this.shouldRender = ko.observable(false);
	this.render = function (element) {
		self.shouldRender(false);
		if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.render)) {
			self.widgetInstance.render(element);
			self.updateCalculatedSettings();
		}
	}

	this.dispose = function () {

	}

	this.serialize = function () {
		return {
			title: self.title(),
			type: self.type(),
			settings: self.settings()
		};
	}

	this.deserialize = function (object) {
		self.title(object.title);
		self.settings(object.settings);
		self.type(object.type);
	}
}

// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

// Jquery plugin to watch for attribute changes
(function($)
{
	function isDOMAttrModifiedSupported()
	{
		var p = document.createElement('p');
		var flag = false;

		if(p.addEventListener)
		{
			p.addEventListener('DOMAttrModified', function()
			{
				flag = true
			}, false);
		}
		else if(p.attachEvent)
		{
			p.attachEvent('onDOMAttrModified', function()
			{
				flag = true
			});
		}
		else
		{
			return false;
		}

		p.setAttribute('id', 'target');

		return flag;
	}

	function checkAttributes(chkAttr, e)
	{
		if(chkAttr)
		{
			var attributes = this.data('attr-old-value');

			if(e.attributeName.indexOf('style') >= 0)
			{
				if(!attributes['style'])
				{
					attributes['style'] = {};
				} //initialize
				var keys = e.attributeName.split('.');
				e.attributeName = keys[0];
				e.oldValue = attributes['style'][keys[1]]; //old value
				e.newValue = keys[1] + ':' + this.prop("style")[$.camelCase(keys[1])]; //new value
				attributes['style'][keys[1]] = e.newValue;
			}
			else
			{
				e.oldValue = attributes[e.attributeName];
				e.newValue = this.attr(e.attributeName);
				attributes[e.attributeName] = e.newValue;
			}

			this.data('attr-old-value', attributes); //update the old value object
		}
	}

	//initialize Mutation Observer
	var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

	$.fn.attrchange = function(o)
	{

		var cfg = {
			trackValues: false,
			callback   : $.noop
		};

		//for backward compatibility
		if(typeof o === "function")
		{
			cfg.callback = o;
		}
		else
		{
			$.extend(cfg, o);
		}

		if(cfg.trackValues)
		{ //get attributes old value
			$(this).each(function(i, el)
			{
				var attributes = {};
				for(var attr, i = 0, attrs = el.attributes, l = attrs.length; i < l; i++)
				{
					attr = attrs.item(i);
					attributes[attr.nodeName] = attr.value;
				}

				$(this).data('attr-old-value', attributes);
			});
		}

		if(MutationObserver)
		{ //Modern Browsers supporting MutationObserver
			/*
			 Mutation Observer is still new and not supported by all browsers.
			 http://lists.w3.org/Archives/Public/public-webapps/2011JulSep/1622.html
			 */
			var mOptions = {
				subtree          : false,
				attributes       : true,
				attributeOldValue: cfg.trackValues
			};

			var observer = new MutationObserver(function(mutations)
			{
				mutations.forEach(function(e)
				{
					var _this = e.target;

					//get new value if trackValues is true
					if(cfg.trackValues)
					{
						/**
						 * @KNOWN_ISSUE: The new value is buggy for STYLE attribute as we don't have
						 * any additional information on which style is getting updated.
						 * */
						e.newValue = $(_this).attr(e.attributeName);
					}

					cfg.callback.call(_this, e);
				});
			});

			return this.each(function()
			{
				observer.observe(this, mOptions);
			});
		}
		else if(isDOMAttrModifiedSupported())
		{ //Opera
			//Good old Mutation Events but the performance is no good
			//http://hacks.mozilla.org/2012/05/dom-mutationobserver-reacting-to-dom-changes-without-killing-browser-performance/
			return this.on('DOMAttrModified', function(event)
			{
				if(event.originalEvent)
				{
					event = event.originalEvent;
				} //jQuery normalization is not required for us
				event.attributeName = event.attrName; //property names to be consistent with MutationObserver
				event.oldValue = event.prevValue; //property names to be consistent with MutationObserver
				cfg.callback.call(this, event);
			});
		}
		else if('onpropertychange' in document.body)
		{ //works only in IE
			return this.on('propertychange', function(e)
			{
				e.attributeName = window.event.propertyName;
				//to set the attr old value
				checkAttributes.call($(this), cfg.trackValues, e);
				cfg.callback.call(this, e);
			});
		}

		return this;
	}
})(jQuery);

(function(jQuery) {

	jQuery.eventEmitter = {
		_JQInit: function() {
			this._JQ = jQuery(this);
		},
		emit: function(evt, data) {
			!this._JQ && this._JQInit();
			this._JQ.trigger(evt, data);
		},
		once: function(evt, handler) {
			!this._JQ && this._JQInit();
			this._JQ.one(evt, handler);
		},
		on: function(evt, handler) {
			!this._JQ && this._JQInit();
			this._JQ.bind(evt, handler);
		},
		off: function(evt, handler) {
			!this._JQ && this._JQInit();
			this._JQ.unbind(evt, handler);
		}
	};

}(jQuery));

var freeboard = (function()
{
	var datasourcePlugins = {};
	var widgetPlugins = {};

	var freeboardUI = new FreeboardUI();
	var theFreeboardModel = new FreeboardModel(datasourcePlugins, widgetPlugins, freeboardUI);

	var jsEditor = new JSEditor();
	var valueEditor = new ValueEditor(theFreeboardModel);
	var pluginEditor = new PluginEditor(jsEditor, valueEditor);

	var developerConsole = new DeveloperConsole(theFreeboardModel);

	var currentStyle = {
		values: {
			"font-family-light": '"HelveticaNeue-UltraLight", "Helvetica Neue Ultra Light", "Helvetica Neue", "Open Sans", Meiryo, "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", Osaka, Arial, sans-serif',
			"font-family": '"Helvetica Neue", Helvetica, "Open Sans", Meiryo, "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", Osaka, Arial, sans-serif',
			"color"      : "#d3d4d4",
			"font-weight": 100
		}
	};

	ko.bindingHandlers.pluginEditor = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			var options = ko.unwrap(valueAccessor());

			var types = {};
			var settings = undefined;
			var title = "";

			if(options.type == 'datasource')
			{
				types = datasourcePlugins;
				title = "データソース";
			}
			else if(options.type == 'widget')
			{
				types = widgetPlugins;
				title = "ウィジェット";
			}
			else if(options.type == 'pane')
			{
				title = "ペイン";
			}

			$(element).click(function(event)
			{
				if(options.operation == 'delete')
				{
					var phraseElement = $('<p>' + title + ' を削除してもよろしいですか？</p>');
					new DialogBox(phraseElement, "削除確認", "はい", "いいえ", function(okcancel)
					{
						if (okcancel == 'ok') {
							if(options.type == 'datasource')
							{
								theFreeboardModel.deleteDatasource(viewModel);
							}
							else if(options.type == 'widget')
							{
								theFreeboardModel.deleteWidget(viewModel);
							}
							else if(options.type == 'pane')
							{
								theFreeboardModel.deletePane(viewModel);
							}
						}
					});
				}
				else
				{
					var instanceType = undefined;

					if(options.type == 'datasource')
					{
						if(options.operation == 'add')
						{
							settings = {};
						}
						else
						{
							instanceType = viewModel.type();
							settings = viewModel.settings();
							settings.name = viewModel.name();
							viewModel.isEditing(true);
						}
					}
					else if(options.type == 'widget')
					{
						if(options.operation == 'add')
						{
							settings = {};
						}
						else
						{
							instanceType = viewModel.type();
							settings = viewModel.settings();
							viewModel.isEditing(true);
						}
					}
					else if(options.type == 'pane')
					{
						settings = {};

						if(options.operation == 'edit')
						{
							settings.title = viewModel.title();
							settings.col_width = viewModel.col_width();
						}

						types = {
							settings: {
								settings: [
									{
										name: "title",
										display_name: "タイトル",
										validate: "optional,maxSize[100]",
										type: "text",
										description: "最大100文字"
									},
									{
										name : "col_width",
										display_name : "カラム幅",
										validate: "required,custom[integer],min[1],max[10]",
										style: "width:100px",
										type: "text",
										default_value : 1,
										description: "最大10ブロック"
									}
								]
							}
						}
					}

					pluginEditor.createPluginEditor(title, types, instanceType, settings, function(newSettings)
					{
						if(options.operation == 'add')
						{
							if(options.type == 'datasource')
							{
								var newViewModel = new DatasourceModel(theFreeboardModel, datasourcePlugins);
								theFreeboardModel.addDatasource(newViewModel);

								newViewModel.name(newSettings.settings.name);
								delete newSettings.settings.name;

								newViewModel.settings(newSettings.settings);
								newViewModel.type(newSettings.type);
							}
							else if(options.type == 'widget')
							{
								var newViewModel = new WidgetModel(theFreeboardModel, widgetPlugins);
								newViewModel.settings(newSettings.settings);
								newViewModel.type(newSettings.type);

								viewModel.widgets.push(newViewModel);

								freeboardUI.attachWidgetEditIcons(element);
							}
						}
						else if(options.operation == 'edit')
						{
							if(options.type == 'pane')
							{
								viewModel.title(newSettings.settings.title);
								viewModel.col_width(newSettings.settings.col_width);
								freeboardUI.processResize(false);
							}
							else
							{
								if(options.type == 'datasource')
								{
									viewModel.name(newSettings.settings.name);
									delete newSettings.settings.name;
								}
								viewModel.isEditing(false);
								viewModel.type(newSettings.type);
								viewModel.settings(newSettings.settings);
							}
						}
					});
				}
			});
		}
	}

	ko.virtualElements.allowedBindings.datasourceTypeSettings = true;
	ko.bindingHandlers.datasourceTypeSettings = {
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			processPluginSettings(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
		}
	}

	ko.bindingHandlers.pane = {
		init  : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			if(theFreeboardModel.isEditing())
			{
				$(element).css({cursor: "pointer"});
			}

			freeboardUI.addPane(element, viewModel, bindingContext.$root.isEditing());
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			// If pane has been removed
			if(theFreeboardModel.panes.indexOf(viewModel) == -1)
			{
				freeboardUI.removePane(element);
			}
			freeboardUI.updatePane(element, viewModel);
		}
	}

	ko.bindingHandlers.widget = {
		init  : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			if(theFreeboardModel.isEditing())
			{
				freeboardUI.attachWidgetEditIcons($(element).parent());
			}
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			if(viewModel.shouldRender())
			{
				$(element).empty();
				viewModel.render(element);
			}
		}
	}

	function getParameterByName(name)
	{
		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
		return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	$(function()
	{ //DOM Ready
		// Show the loading indicator when we first load
		freeboardUI.showLoadingIndicator(true);

		var resizeTimer;

		function resizeEnd()
		{
			freeboardUI.processResize(true);
		}

		$(window).resize(function() {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(resizeEnd, 500);
		});

	});

	// PUBLIC FUNCTIONS
	return {
		initialize          : function(allowEdit, finishedCallback)
		{
			// Check to see if we have a query param called load. If so, we should load that dashboard initially
			var freeboardLocation = getParameterByName("load");

			if(freeboardLocation != "")
			{
				ko.applyBindings(theFreeboardModel);

				$.ajax({
					url    : freeboardLocation,
					success: function(data)
					{
						theFreeboardModel.loadDashboard(data);

						if(_.isFunction(finishedCallback))
						{
							finishedCallback();
						}
					}
				});
			}
			else
			{
				theFreeboardModel.allow_edit(allowEdit);

				ko.applyBindings(theFreeboardModel);

				theFreeboardModel.setEditing(allowEdit);

				freeboardUI.showLoadingIndicator(false);
				if(_.isFunction(finishedCallback))
				{
					finishedCallback();
				}

				freeboard.emit("initialized");
			}
		},
		newDashboard        : function()
		{
			theFreeboardModel.loadDashboard({allow_edit: true});
		},
		loadDashboard       : function(configuration, callback)
		{
			theFreeboardModel.loadDashboard(configuration, callback);
		},
		serialize           : function()
		{
			return theFreeboardModel.serialize();
		},
		setEditing          : function(editing, animate)
		{
			theFreeboardModel.setEditing(editing, animate);
		},
		isEditing           : function()
		{
			return theFreeboardModel.isEditing();
		},
		loadDatasourcePlugin: function(plugin)
		{
			if(_.isUndefined(plugin.display_name))
			{
				plugin.display_name = plugin.type_name;
			}

			// Datasource name must be unique
			window.freeboard.isUniqueDatasourceName = function(field, rules, i, options) {
				var res = _.find(theFreeboardModel.datasources(), function(datasource) {
					// except itself
					if (datasource.isEditing() == false)
						return datasource.name() == field.val();
				});
				if (!_.isUndefined(res))
					return options.allrules.alreadyusedname.alertText;
			}

			// Add a required setting called name to the beginning
			plugin.settings.unshift({
				name : "name",
				display_name : "名前",
				validate: "funcCall[freeboard.isUniqueDatasourceName],required,maxSize[100]",
				type: "text",
				description: "最大100文字まで"
			});

			theFreeboardModel.addPluginSource(plugin.source);
			datasourcePlugins[plugin.type_name] = plugin;
			theFreeboardModel._datasourceTypes.valueHasMutated();
		},
		resize : function()
		{
			freeboardUI.processResize(true);
		},
		loadWidgetPlugin    : function(plugin)
		{
			if(_.isUndefined(plugin.display_name))
			{
				plugin.display_name = plugin.type_name;
			}

			theFreeboardModel.addPluginSource(plugin.source);
			widgetPlugins[plugin.type_name] = plugin;
			theFreeboardModel._widgetTypes.valueHasMutated();
		},
		// To be used if freeboard is going to load dynamic assets from a different root URL
		setAssetRoot        : function(assetRoot)
		{
			jsEditor.setAssetRoot(assetRoot);
		},
		addStyle            : function(selector, rules)
		{
			var styleString = selector + "{" + rules + "}";

			var styleElement = $("style#fb-styles");

			if(styleElement.length == 0)
			{
				styleElement = $('<style id="fb-styles" type="text/css"></style>');
				$("head").append(styleElement);
			}

			if(styleElement[0].styleSheet)
			{
				styleElement[0].styleSheet.cssText += styleString;
			}
			else
			{
				styleElement.text(styleElement.text() + styleString);
			}
		},
		showLoadingIndicator: function(show)
		{
			freeboardUI.showLoadingIndicator(show);
		},
		showDialog          : function(contentElement, title, okTitle, cancelTitle, okCallback)
		{
			new DialogBox(contentElement, title, okTitle, cancelTitle, okCallback);
		},
		getDatasourceSettings : function(datasourceName)
		{
			var datasources = theFreeboardModel.datasources();

			// Find the datasource with the name specified
			var datasource = _.find(datasources, function(datasourceModel){
				return (datasourceModel.name() === datasourceName);
			});

			if(datasource)
			{
				return datasource.settings();
			}
			else
			{
				return null;
			}
		},
		setDatasourceSettings : function(datasourceName, settings)
		{
			var datasources = theFreeboardModel.datasources();

			// Find the datasource with the name specified
			var datasource = _.find(datasources, function(datasourceModel){
				return (datasourceModel.name() === datasourceName);
			});

			if(!datasource)
			{
				console.log("Datasource not found");
				return;
			}

			var combinedSettings = _.defaults(settings, datasource.settings());
			datasource.settings(combinedSettings);
		},
		getStyleString      : function(name)
		{
			var returnString = "";

			_.each(currentStyle[name], function(value, name)
			{
				returnString = returnString + name + ":" + value + ";";
			});

			return returnString;
		},
		getStyleObject      : function(name)
		{
			return currentStyle[name];
		},
		showDeveloperConsole : function()
		{
			developerConsole.showDeveloperConsole();
		}
	};
}());

$.extend(freeboard, jQuery.eventEmitter);

// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// │ Copyright © 2014 Hugo Sequeira (https://github.com/hugocore)       │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function () {

	var clockDatasource = function (settings, updateCallback) {
		var self = this;
		var currentSettings = settings;
		var timer;

		function stopTimer() {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
		}

		function updateTimer() {
			stopTimer();
			timer = setInterval(self.updateNow, currentSettings.refresh * 1000);
		}

		this.updateNow = function () {
			var date = new Date();
			var ts = date.getTime()/1000;

			var data = {
				numeric_value: ts,
				full_string_value: moment.unix(ts).format("YYYY/MM/DD hh:mm:ss"),
				date_string_value: moment.unix(ts).format("YYYY/MM/DD"),
				time_string_value: moment.unix(ts).format("hh:mm:ss"),
				date_object: date
			};

			updateCallback(data);
		}

		this.onDispose = function () {
			stopTimer();
		}

		this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;
			updateTimer();
		}

		updateTimer();
	};

	freeboard.loadDatasourcePlugin({
		"type_name": "clock",
		"display_name": "時計",
		"description": "指定の間隔で更新され、異なるフォーマットで現在の時刻を返します。画面上にタイマーを表示したり、ウィジェットが一定の間隔でリフレッシュさせるために使用することができます。",
		"settings": [
			{
				name: "refresh",
				display_name: "更新頻度",
				validate: "required,custom[integer],min[1]",
				style: "width:100px",
				type: "text",
				suffix: "秒",
				default_value: 1
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new clockDatasource(settings, updateCallback));
		}
	});

	var jsonWebSocketDatasource = function(settings, updateCallback)
	{
		var self = this;
		var currentSettings = settings;
		var ws;

		var onOpen = function()
		{
			console.info("WebSocket(%s) Opened", currentSettings.url);
		}

		var onClose = function()
		{
			console.info("WebSocket Closed");
		}

		var onMessage = function(event)
		{
			var data = event.data;

			console.info("WebSocket received %s",data);

			var objdata = JSON.parse(data);

			if(typeof objdata == "object")
			{
				updateCallback(objdata);
			}
			else
			{
				updateCallback(data);
			}

		}

		function createWebSocket()
		{
			if(ws) {
				ws.close();
			}

			var url = currentSettings.url;
			ws = new WebSocket(url);

			ws.onopen = onOpen;
			ws.onclose = onClose;
			ws.onmessage = onMessage;
		}

		createWebSocket();

		this.updateNow = function()
		{
			createWebSocket();
		}

		this.onDispose = function()
		{
			ws.close();
		}

		this.onSettingsChanged = function(newSettings)
		{
			currentSettings = newSettings;

			createWebSocket();
		}
	};

	var jsonDatasource = function (settings, updateCallback) {
		var self = this;
		var updateTimer = null;
		var currentSettings = settings;
		var errorStage = 0; 	// 0 = try standard request
		// 1 = try JSONP
		// 2 = try thingproxy.freeboard.io
		var lockErrorStage = false;

		function updateRefresh(refreshTime) {
			if (updateTimer) {
				clearInterval(updateTimer);
			}

			updateTimer = setInterval(function () {
				self.updateNow();
			}, refreshTime);
		}

		updateRefresh(currentSettings.refresh * 1000);

		this.updateNow = function () {
			if ((errorStage > 1 && !currentSettings.use_thingproxy) || errorStage > 2) // We've tried everything, let's quit
			{
				return; // TODO: Report an error
			}

			var requestURL = currentSettings.url;

			if (errorStage == 2 && currentSettings.use_thingproxy) {
				requestURL = (location.protocol == "https:" ? "https:" : "http:") + "//thingproxy.freeboard.io/fetch/" + encodeURI(currentSettings.url);
			}

			var body = currentSettings.body;

			// Can the body be converted to JSON?
			if (body) {
				try {
					body = JSON.parse(body);
				}
				catch (e) {
				}
			}

			$.ajax({
				url: requestURL,
				dataType: (errorStage == 1) ? "JSONP" : "JSON",
				type: currentSettings.method || "GET",
				data: body,
				beforeSend: function (xhr) {
					try {
						_.each(currentSettings.headers, function (header) {
							var name = header.name;
							var value = header.value;

							if (!_.isUndefined(name) && !_.isUndefined(value)) {
								xhr.setRequestHeader(name, value);
							}
						});
					}
					catch (e) {
					}
				},
				success: function (data) {
					lockErrorStage = true;
					updateCallback(data);
				},
				error: function (xhr, status, error) {
					if (!lockErrorStage) {
						// TODO: Figure out a way to intercept CORS errors only. The error message for CORS errors seems to be a standard 404.
						errorStage++;
						self.updateNow();
					}
				}
			});
		}

		this.onDispose = function () {
			clearInterval(updateTimer);
			updateTimer = null;
		}

		this.onSettingsChanged = function (newSettings) {
			lockErrorStage = false;
			errorStage = 0;

			currentSettings = newSettings;
			updateRefresh(currentSettings.refresh * 1000);
			self.updateNow();
		}
	};

	freeboard.loadDatasourcePlugin({
		type_name: "JSON",
		display_name: "JSON",
		description: "指定のURLからJSONデータを受信します。",
		settings: [
			{
				name: "url",
				display_name: "URL",
				validate: "required,custom[url]",
				type: "text"
			},
			{
				name: "use_thingproxy",
				display_name: "プロキシサーバー試行",
				description: 'まず直接接続し、失敗した場合、JSONP接続を試みます。これも失敗した場合、プロキシサーバーを使用することができます。使用することで多くのAPI接続トラブルを解決できるでしょう。<a href="https://github.com/Freeboard/thingproxy" target="_blank">詳細</a>',
				type: "boolean",
				default_value: true
			},
			{
				name: "refresh",
				display_name: "更新頻度",
				validate: "required,custom[integer],min[1]",
				style: "width:100px",
				type: "text",
				suffix: "秒",
				default_value: 5
			},
			{
				name: "method",
				display_name: "メソッド",
				type: "option",
				style: "width:200px",
				options: [
					{
						name: "GET",
						value: "GET"
					},
					{
						name: "POST",
						value: "POST"
					},
					{
						name: "PUT",
						value: "PUT"
					},
					{
						name: "DELETE",
						value: "DELETE"
					}
				]
			},
			{
				name: "body",
				display_name: "Body",
				type: "json",
				validate: "optional,maxSize[2000]",
				description: "リクエスト本文。通常はPOSTメソッド時に使用される。最大2000文字"
			},
			{
				name: "headers",
				display_name: "Header",
				type: "array",
				settings: [
					{
						name: "name",
						display_name: "名前",
						type: "text",
						validate: "optional,maxSize[500]",
						description: "最大500文字"
					},
					{
						name: "value",
						display_name: "値",
						type: "text",
						validate: "optional,maxSize[500]",
						description: "最大500文字"
					}
				]
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new jsonDatasource(settings, updateCallback));
		}
	});

	var openWeatherMapDatasource = function (settings, updateCallback) {
		var self = this;
		var updateTimer = null;
		var currentSettings = settings;

		function updateRefresh(refreshTime) {
			if (updateTimer) {
				clearInterval(updateTimer);
			}

			updateTimer = setInterval(function () {
				self.updateNow();
			}, refreshTime);
		}

		function toTitleCase(str) {
			return str.replace(/\w\S*/g, function (txt) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

		updateRefresh(currentSettings.refresh * 1000);

		this.updateNow = function () {
			$.ajax({
				url: "http://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(currentSettings.location) + "&units=" + currentSettings.units,
				dataType: "JSONP",
				success: function (data) {
					// Rejigger our data into something easier to understand
					var newData = {
						place_name: data.name,
						latitude: data.coord.lat,
						longitude: data.coord.lon,
						sunrise: (new Date(data.sys.sunrise * 1000)).toLocaleTimeString(),
						sunset: (new Date(data.sys.sunset * 1000)).toLocaleTimeString(),
						conditions: toTitleCase(data.weather[0].description),
						current_temp: data.main.temp,
						high_temp: data.main.temp_max,
						low_temp: data.main.temp_min,
						pressure: data.main.pressure,
						humidity: data.main.humidity,
						wind_speed: data.wind.speed,
						wind_direction: data.wind.deg
					};

					updateCallback(newData);
				},
				error: function (xhr, status, error) {
				}
			});
		}

		this.onDispose = function () {
			clearInterval(updateTimer);
			updateTimer = null;
		}

		this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;
			self.updateNow();
			updateRefresh(currentSettings.refresh * 1000);
		}
	};

	freeboard.loadDatasourcePlugin({
		type_name: "openweathermap",
		display_name: "Open Weather Map API",
		description: "天候や予測履歴を含む各種気象データを受信します。",
		settings: [
			{
				name: "location",
				display_name: "場所",
				validate: "required,maxSize[200]",
				type: "text",
				description: "最大200文字<br>例: London, UK"
			},
			{
				name: "units",
				display_name: "単位",
				style: "width:200px",
				type: "option",
				default: "metric",
				options: [
					{
						name: "メトリック",
						value: "metric"
					},
					{
						name: "インペリアル",
						value: "imperial"
					}
				]
			},
			{
				name: "refresh",
				display_name: "更新頻度",
				validate: "required,custom[integer],min[1]",
				style: "width:100px",
				type: "text",
				suffix: "秒",
				default_value: 5
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new openWeatherMapDatasource(settings, updateCallback));
		}
	});

	var dweetioDatasource = function (settings, updateCallback) {
		var self = this;
		var currentSettings = settings;

		function onNewDweet(dweet) {
			updateCallback(dweet);
		}

		this.updateNow = function () {
			dweetio.get_latest_dweet_for(currentSettings.thing_id, function (err, dweet) {
				if (err) {
					//onNewDweet({});
				}
				else {
					onNewDweet(dweet[0].content);
				}
			});
		}

		this.onDispose = function () {

		}

		this.onSettingsChanged = function (newSettings) {
			dweetio.stop_listening();

			currentSettings = newSettings;

			dweetio.listen_for(currentSettings.thing_id, function (dweet) {
				onNewDweet(dweet.content);
			});
		}

		self.onSettingsChanged(settings);
	};

	freeboard.loadDatasourcePlugin({
		"type_name": "playback",
		"display_name": "Playback",
		"description": "指定された間隔で連続したデータを再生します。オブジェクトの配列を含む有効なJSONファイルを待ち受けします。",
		"settings": [
			{
				name: "datafile",
				display_name: "データファイルURL",
				validate: "required,custom[url]",
				type: "text",
				description: "JSON配列データへのリンク"
			},
			{
				name: "is_jsonp",
				display_name: "JSONP使用",
				type: "boolean"
			},
			{
				name: "loop",
				display_name: "ループ再生",
				type: "boolean",
				description: "巻戻しとループ再生時終了"
			},
			{
				name: "refresh",
				display_name: "更新頻度",
				validate: "required,custom[integer],min[1]",
				style: "width:100px",
				type: "text",
				suffix: "秒",
				default_value: 5
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new playbackDatasource(settings, updateCallback));
		}
	});

	freeboard.loadDatasourcePlugin({
		type_name  : "JSON WebSocket",
		display_name : "JSON WebSocket",
		description : "ブラウザ内蔵のWebSocket APIを使用しJSON形式のデータを取得します。",
		settings   : [
			{
				name: "url",
				display_name: "DNSホスト名",
				validate: "required,maxSize[1000]",
				type: "text",
				description: "最大1000文字"
			}
		],
		newInstance: function(settings, newInstanceCallback, updateCallback)
		{
			newInstanceCallback( new jsonWebSocketDatasource(settings, updateCallback));
		}
	});

	var nodeJSDatasource = function(settings, updateCallback) {

		var self = this,
			currentSettings = settings,
			url,
			socket,
			newMessageCallback;

		function onNewMessageHandler(message) {
			var objdata = JSON.parse(message);
			if (typeof objdata == "object") {
				updateCallback(objdata);
			} else {
				updateCallback(message);
			}
		}

		function joinRoom(roomName, roomEvent) {
			// Sends request to join the new room
			// (handle event on server-side)
			self.socket.emit(roomEvent, roomName);
			console.info("Joining room '%s' with event '%s'", roomName, roomEvent);
		}

		function discardSocket() {
			// Disconnect datasource websocket
			if (self.socket) {
				self.socket.disconnect();
			}
		}

		function connectToServer(url, rooms) {
			// Establish connection with server
			self.url = url;
			self.socket = io.connect(self.url,{'forceNew':true});

			// Join the rooms
			self.socket.on('connect', function() {
				console.info("Connecting to Node.js at: %s", self.url);
			});

			// Join the rooms
			_.each(rooms, function(roomConfig) {
				var roomName = roomConfig.roomName;
				var roomEvent = roomConfig.roomEvent;

				if (!_.isUndefined(roomName) && !_.isUndefined(roomEvent)) {
					joinRoom(roomName, roomEvent);
				}

			});

			self.socket.on('connect_error', function(object) {
				console.error("It was not possible to connect to Node.js at: %s", self.url);
			});

			self.socket.on('reconnect_error', function(object) {
				console.error("Still was not possible to re-connect to Node.js at: %s", self.url);
			});

			self.socket.on('reconnect_failed', function(object) {
				console.error("Re-connection to Node.js failed at: %s", self.url);
				discardSocket();
			});

		}


		function initializeDataSource() {
			// Reset connection to server
			discardSocket();
			connectToServer(currentSettings.url, currentSettings.rooms);

			// Subscribe to the events
			var newEventName = currentSettings.eventName;
			self.newMessageCallback = onNewMessageHandler;
			_.each(currentSettings.events, function(eventConfig) {
				var event = eventConfig.eventName;
				console.info("Subscribing to event: %s", event);
				self.socket.on(event, function(message) {
					self.newMessageCallback(message);
				});
			});
		}

		this.updateNow = function() {
			// Just seat back, relax and wait for incoming events
			return;
		};

		this.onDispose = function() {
			// Stop responding to messages
			self.newMessageCallback = function(message) {
				return;
			};
			discardSocket();
		};

		this.onSettingsChanged = function(newSettings) {
			currentSettings = newSettings;
			initializeDataSource();
		};

		initializeDataSource();
	};

	freeboard.loadDatasourcePlugin({
		type_name : "node_js",
		display_name : "Node.js (Socket.io)",
		description : "<a href='http://socket.io/', target='_blank'>Socket.io</a>を使用したnode.jsサーバーからデータソースをリアルタイムでストリーミングします。",
		external_scripts : [ "https://cdn.socket.io/socket.io-1.2.1.js" ],
		settings : [
			{
				name: "url",
				display_name: "DNSホスト名",
				validate: "required,maxSize[1000]",
				type: "text",
				description: "最大1000文字 (オプション) カスタム名前空間を使用する場合、URLの最後に名前空間を追加して下さい。<br>例: http://localhost/chat"
			},
			{
				name : "events",
				display_name : "イベント",
				description : "データソースへ追加するイベント名を指定して下さい。",
				type : "array",
				settings : [ {
					name : "eventName",
					display_name : "イベント名",
					validate: "optional,maxSize[100]",
					type: "text"
				} ]
			},
			{
				name : "rooms",
				display_name : "(オプション) ルーム",
				description : "ルームを使用する場合, 追加したいルーム名を指定して下さい。その他の場合は空白のままにしておいて下さい。",
				type : "array",
				settings : [ {
					name : "roomName",
					display_name : "ルーム名",
					validate: "optional,maxSize[100]",
					type: "text"
				}, {
					name : "roomEvent",
					display_name : "ルームに参加するイベント名",
					validate: "optional,maxSize[100]",
					type: "text"
				} ]
			}
		],
		newInstance : function(settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new nodeJSDatasource(settings, updateCallback));
		}
	});

	var mqttDatasource = function(settings, updateCallback) {

		var self = this;
		var currentSettings = settings;
		var client;
		var dispose = false;
		var CONNECTION_DELAY = 1000;

		function onConnect(frame) {
			console.info("MQTT Connected to %s", currentSettings.url);
			self.client.subscribe(_.isUndefined(currentSettings.topic) ? "" : currentSettings.topic);
		}

		function onConnectionLost(responseObject) {
			console.info("MQTT ConnectionLost %s %s", currentSettings.url, responseObject.errorMessage);
			if (dispose == false && currentSettings.reconnect == true) {
				_.delay(function() {
					connectToServer();
				}, CONNECTION_DELAY);
			}
		}

		function onConnectFailure(error) {
			self.client = null;
			console.error("MQTT Failed Connect to %s", currentSettings.url);
		}

		function onMessageArrived(message) {
			console.info("MQTT Received %s from %s", message,  currentSettings.url);

			var objdata = JSON.parse(message.payloadString);
			if (typeof objdata == "object") {
				updateCallback(objdata);
			} else {
				updateCallback(message.payloadString);
			}
		}

		function discardSocket() {
			// Disconnect datasource MQTT
			if (self.client) {
				self.client.disconnect();
				self.client = null;
			}
		}

		function connectToServer() {

			try {
				discardSocket();

				self.client = new Paho.MQTT.Client(
					_.isUndefined(currentSettings.url) ? "" : currentSettings.url,
					_.isUndefined(currentSettings.port) ? "" : currentSettings.port,
					_.isUndefined(currentSettings.clientID) ? "" : currentSettings.clientID);
				self.client.onConnect = onConnect;
				self.client.onMessageArrived = onMessageArrived;
				self.client.onConnectionLost = onConnectionLost;
				self.client.connect({
					userName: _.isUndefined(currentSettings.username) ? "" : currentSettings.username,
					password: _.isUndefined(currentSettings.password) ? "" : currentSettings.password,
					onSuccess: onConnect,
					onFailure: onConnectFailure
				});
			} catch (e) {
				console.error(e);
			}
		}


		function initializeDataSource() {
			connectToServer();
		}

		this.updateNow = function() {
			// Just seat back, relax and wait for incoming events
			return;
		};

		this.onDispose = function() {
			dispose = true;
			discardSocket();
		};

		this.onSettingsChanged = function(newSettings) {
			currentSettings = newSettings;
			discardSocket();
		};

		initializeDataSource();
	};

	freeboard.loadDatasourcePlugin({
		type_name : "mqtt",
		display_name : "MQTT over Websocket",
		description : "<a href='http://mqtt.org/', target='_blank'>MQTT</a>プロトコルをWebSocketを介し使用し、MQTTブローカーサーバーからデータソースをリアルタイムで取得します。",
		external_scripts : [ "plugins/thirdparty/mqttws31.js" ],
		settings : [
			{
				name : "url",
				display_name : "DNSホスト名",
				validate: "required,maxSize[1000]",
				type: "text",
				description: "最大1000文字<br>MQTTブローカーサーバーのDNSホスト名を設定して下さい。<br>例: location.hostname"
			},
			{
				name : "port",
				display_name : "ポート番号",
				validate: "required,custom[integer],min[1]",
				style: "width:100px",
				default_value: 8080
			},
			{
				name : "clientID",
				display_name : "クライアントID",
				validate: "required,maxSize[23]",
				type: "text",
				description: "最大23文字<br>任意のクライアントID文字列",
				default_value: "SensorCorpus"
			},
			{
				name : "topic",
				display_name : "トピック",
				validate: "required,maxSize[500]",
				type: "text",
				description: "最大500文字<br>購読するトピック名を設定して下さい。<br>例: my/topic",
				default_value: ""
			},
			{
				name : "username",
				display_name : "(オプション) ユーザー名",
				validate: "optional,maxSize[100]",
				type: "text",
				description: "最大100文字<br>必要ない場合は空白。"
			},
			{
				name : "password",
				display_name : "(オプション) パスワード",
				validate: "optional,maxSize[100]",
				type: "text",
				description: "最大100文字<br>必要ない場合は空白。"
			},
			{
				name : "reconnect",
				display_name : "自動再接続",
				type: "boolean",
				description : "接続が切れた場合、自動的に再接続します。",
				default_value: true
			}
		],
		newInstance : function(settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new mqttDatasource(settings, updateCallback));
		}
	})
}());
// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function () {
	var SPARKLINE_HISTORY_LENGTH = 100;
	var SPARKLINE_COLORS = ["#FF9900", "#FFFFFF", "#B3B4B4", "#6B6B6B", "#28DE28", "#13F7F9", "#E6EE18", "#C41204", "#CA3CB8", "#0B1CFB"];

	function jsonEscapeEntities(str) {
		var entitiesMap = {
			'<': '&lt;',
			'>': '&gt;',
			'&': '&amp;'
		};
		return str.replace(/[&<>]/g, function(key) {
			return entitiesMap[key];
		});
	}

	function easeTransitionText(newValue, textElement, duration) {

		var currentValue = $(textElement).text();

		if (currentValue == newValue)
			return;

		if ($.isNumeric(newValue) && $.isNumeric(currentValue)) {
			var numParts = newValue.toString().split('.');
			var endingPrecision = 0;

			if (numParts.length > 1) {
				endingPrecision = numParts[1].length;
			}

			numParts = currentValue.toString().split('.');
			var startingPrecision = 0;

			if (numParts.length > 1) {
				startingPrecision = numParts[1].length;
			}

			jQuery({transitionValue: Number(currentValue), precisionValue: startingPrecision}).animate({transitionValue: Number(newValue), precisionValue: endingPrecision}, {
				duration: duration,
				step: function () {
					$(textElement).text(this.transitionValue.toFixed(this.precisionValue));
				},
				done: function () {
					$(textElement).text(newValue);
				}
			});
		}
		else {
			$(textElement).text(newValue);
		}
	}

	function addValueToSparkline(element, value) {
		var values = $(element).data().values;
		var valueMin = $(element).data().valueMin;
		var valueMax = $(element).data().valueMax;
		if (!values) {
			values = [];
			valueMin = undefined;
			valueMax = undefined;
		}

		var collateValues = function(val, plotIndex) {
			if(!values[plotIndex]) {
				values[plotIndex] = [];
			}
			if (values[plotIndex].length >= SPARKLINE_HISTORY_LENGTH) {
				values[plotIndex].shift();
			}
			values[plotIndex].push(Number(val));

			if(valueMin === undefined || val < valueMin) {
				valueMin = val;
			}
			if(valueMax === undefined || val > valueMax) {
				valueMax = val;
			}
		}

		if(_.isArray(value)) {
			_.each(value, collateValues);
		} else {
			collateValues(value, 0);
		}
		$(element).data().values = values;
		$(element).data().valueMin = valueMin;
		$(element).data().valueMax = valueMax;

		var composite = false;
		_.each(values, function(valueArray, valueIndex) {
			$(element).sparkline(valueArray, {
				type: "line",
				composite: composite,
				height: "100%",
				width: "100%",
				fillColor: false,
				lineColor: SPARKLINE_COLORS[valueIndex % SPARKLINE_COLORS.length],
				lineWidth: 2,
				spotRadius: 3,
				spotColor: false,
				minSpotColor: "#78AB49",
				maxSpotColor: "#78AB49",
				highlightSpotColor: "#9D3926",
				highlightLineColor: "#9D3926",
				chartRangeMin: valueMin,
				chartRangeMax: valueMax
			});
			composite = true;
		});
	}

	var valueStyle = freeboard.getStyleString("values");

	freeboard.addStyle('.widget-big-text', valueStyle + "font-size:75px;");

	freeboard.addStyle('.tw-display', 'width: 100%; height:100%; display:table; table-layout:fixed;');

	freeboard.addStyle('.tw-tr',
		'display:table-row;');

	freeboard.addStyle('.tw-tg',
		'display:table-row-group;');

	freeboard.addStyle('.tw-tc',
		'display:table-caption;');

	freeboard.addStyle('.tw-td',
		'display:table-cell;');

	freeboard.addStyle('.tw-value',
		valueStyle +
		'overflow: hidden;' +
		'display: inline-block;' +
		'text-overflow: ellipsis;');

	freeboard.addStyle('.tw-unit',
		'display: inline-block;' +
		'padding-left: 10px;' +
		'padding-bottom: 1.1em;' +
		'vertical-align: bottom;');

	freeboard.addStyle('.tw-value-wrapper',
		'position: relative;' +
		'vertical-align: middle;' +
		'height:100%;');

	freeboard.addStyle('.tw-sparkline',
		'height:20px;');

	var textWidget = function (settings) {

		var self = this;

		var currentSettings = settings;
		var displayElement = $('<div class="tw-display"></div>');
		var titleElement = $('<h2 class="section-title tw-title tw-td"></h2>');
		var valueElement = $('<div class="tw-value"></div>');
		var unitsElement = $('<div class="tw-unit"></div>');
		var sparklineElement = $('<div class="tw-sparkline tw-td"></div>');

		function updateValueSizing()
		{
			if(!_.isUndefined(currentSettings.units) && currentSettings.units != "") // If we're displaying our units
			{
				valueElement.css("max-width", (displayElement.innerWidth() - unitsElement.outerWidth(true)) + "px");
			}
			else
			{
				valueElement.css("max-width", "100%");
			}
		}

		this.render = function (element) {
			$(element).empty();

			$(displayElement)
				.append($('<div class="tw-tr"></div>').append(titleElement))
				.append($('<div class="tw-tr"></div>').append($('<div class="tw-value-wrapper tw-td"></div>').append(valueElement).append(unitsElement)))
				.append($('<div class="tw-tr"></div>').append(sparklineElement));

			$(element).append(displayElement);

			updateValueSizing();
		}

		this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;

			var shouldDisplayTitle = (!_.isUndefined(newSettings.title) && newSettings.title != "");
			var shouldDisplayUnits = (!_.isUndefined(newSettings.units) && newSettings.units != "");

			if(newSettings.sparkline)
			{
				sparklineElement.attr("style", null);
			}
			else
			{
				delete sparklineElement.data().values;
				sparklineElement.empty();
				sparklineElement.hide();
			}

			if(shouldDisplayTitle)
			{
				titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
				titleElement.attr("style", null);
			}
			else
			{
				titleElement.empty();
				titleElement.hide();
			}

			if(shouldDisplayUnits)
			{
				unitsElement.html((_.isUndefined(newSettings.units) ? "" : newSettings.units));
				unitsElement.attr("style", null);
			}
			else
			{
				unitsElement.empty();
				unitsElement.hide();
			}

			var valueFontSize = 30;

			if(newSettings.size == "big")
			{
				valueFontSize = 75;

				if(newSettings.sparkline)
				{
					valueFontSize = 60;
				}
			}

			valueElement.css({"font-size" : valueFontSize + "px"});

			updateValueSizing();
		}

		this.onSizeChanged = function()
		{
			updateValueSizing();
		}

		this.onCalculatedValueChanged = function (settingName, newValue) {
			if (settingName == "value") {

				if (currentSettings.animate) {
					easeTransitionText(newValue, valueElement, 500);
				}
				else {
					valueElement.text(newValue);
				}

				if (currentSettings.sparkline) {
					addValueToSparkline(sparklineElement, newValue);
				}
			}
		}

		this.onDispose = function () {

		}

		this.getHeight = function () {
			if (currentSettings.size == "big" || currentSettings.sparkline) {
				return 2;
			}
			else {
				return 1;
			}
		}

		this.onSettingsChanged(settings);
	};

	freeboard.loadWidgetPlugin({
		type_name: "text_widget",
		display_name: "テキスト",
		"external_scripts" : [
			"plugins/thirdparty/jquery.sparkline.min.js"
		],
		settings: [
			{
				name: "title",
				display_name: "タイトル",
				validate: "optional,maxSize[100]",
				type: "text",
				description: "最大100文字"
			},
			{
				name: "size",
				display_name: "サイズ",
				type: "option",
				options: [
					{
						name: "レギュラー",
						value: "regular"
					},
					{
						name: "ビッグ",
						value: "big"
					}
				]
			},
			{
				name: "value",
				display_name: "値",
				validate: "optional,maxSize[2000]",
				type: "calculated",
				description: "最大2000文字"
			},
			{
				name: "sparkline",
				display_name: "スパークラインを含む",
				type: "boolean"
			},
			{
				name: "animate",
				display_name: "値変化アニメーション",
				type: "boolean",
				default_value: true
			},
			{
				name: "units",
				display_name: "単位",
				validate: "optional,maxSize[20]",
				type: "text",
				style: "width:150px",
				description: "最大20文字"
			}
		],
		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new textWidget(settings));
		}
	});

	var gaugeID = 0;
	freeboard.addStyle('.gauge-widget-wrapper', "width: 100%;text-align: center;");
	freeboard.addStyle('.gauge-widget', "width:280px;height:214px;display:inline-block;");

	var gaugeWidget = function (settings) {
		var self = this;

		var thisGaugeID = "gauge-" + gaugeID++;
		var titleElement = $('<h2 class="section-title"></h2>');
		var wrapperElement = $('<div class="gauge-widget-wrapper"></div>');
		var gaugeElement = $('<div class="gauge-widget" id="' + thisGaugeID + '"></div>');

		var gaugeObject;
		var rendered = false;

		var currentSettings = settings;

		function createGauge() {
			if (!rendered) {
				return;
			}

			currentSettings.shape = parseInt(currentSettings.shape);

			gaugeElement.empty();

			var valueStyle = freeboard.getStyleObject("values");

			gaugeObject = new JustGage({
				id: thisGaugeID,
				value: (_.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value),
				min: (_.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value),
				max: (_.isUndefined(currentSettings.max_value) ? 0 : currentSettings.max_value),
				label: currentSettings.units,
				showInnerShadow: false,
				shape: currentSettings.shape,
				levelColors: [ currentSettings.gauge_lower_color, currentSettings.gauge_mid_color, currentSettings.gauge_upper_color ],
				gaugeWidthScale: currentSettings.gauge_widthscale/100.0,
				gaugeColor: currentSettings.gauge_color,
				labelFontFamily: valueStyle['font-family-light'],
				labelFontColor: currentSettings.value_fontcolor,
				valueFontColor: currentSettings.value_fontcolor
			});
		}

		this.render = function (element) {
			rendered = true;
			$(element).append(titleElement).append(wrapperElement.append(gaugeElement));

			// for justgauge redraw bug.
			var timerID = setTimeout(function() {
				createGauge();
				clearTimeout(timerID);
			}, 500);
		}

		this.onSettingsChanged = function (newSettings) {
			if (newSettings.min_value != currentSettings.min_value ||
				newSettings.max_value != currentSettings.max_value ||
				newSettings.units != currentSettings.units ||
				newSettings.shape != currentSettings.shape ||
				newSettings.gauge_widthscale != currentSettings.gauge_widthscale ||
				newSettings.value_fontcolor != currentSettings.value_fontcolor ||
				newSettings.gauge_upper_color != currentSettings.gauge_upper_color ||
				newSettings.gauge_mid_color != currentSettings.gauge_mid_color ||
				newSettings.gauge_lower_color != currentSettings.gauge_lower_color ||
				newSettings.gauge_color != currentSettings.gauge_color) {
				currentSettings = newSettings;
				createGauge();
			}
			else {
				currentSettings = newSettings;
			}

			titleElement.html(newSettings.title);
		}

		this.onCalculatedValueChanged = function (settingName, newValue) {
			if (!_.isUndefined(gaugeObject)) {
				gaugeObject.refresh(Number(newValue));
			}
		}

		this.onDispose = function () {
		}

		this.getHeight = function () {
			return 4;
		}

		this.onSettingsChanged(settings);
	};

	freeboard.loadWidgetPlugin({
		type_name: "gauge",
		display_name: "ゲージ",
		"external_scripts" : [
			"plugins/thirdparty/raphael.2.1.0.min.js",
			"plugins/thirdparty/justgage.min.js"
		],
		settings: [
			{
				name: "title",
				display_name: "タイトル",
				validate: "optional,maxSize[100]",
				type: "text",
				description: "最大100文字"
			},
			{
				name: "value",
				display_name: "値",
				validate: "optional,maxSize[2000]",
				type: "calculated",
				description: "最大2000文字"
			},
			{
				name: "shape",
				display_name: "型",
				type: "option",
				options: [
					{
						name: "ハーフ",
						value: 0
					},
					{
						name: "ファン",
						value: 1
					},
					{
						name: "ドーナッツ",
						value: 2
					}
				]
			},
			{
				name: "units",
				display_name: "単位",
				validate: "optional,maxSize[20]",
				style: "width:150px",
				type: "text",
				description: "最大20文字"
			},
			{
				name: "value_fontcolor",
				display_name: "値フォント色",
				type: "color",
				validate: "required,custom[hexcolor]",
				default_value: "#d3d4d4",
				description: "デフォルト色: #d3d4d4"
			},
			{
				name: "gauge_upper_color",
				display_name: "ゲージ色 Upper",
				type: "color",
				validate: "required,custom[hexcolor]",
				default_value: "#ff0000",
				description: "デフォルト色: #ff0000"
			},
			{
				name: "gauge_mid_color",
				display_name: "ゲージ色 Mid",
				type: "color",
				validate: "required,custom[hexcolor]",
				default_value: "#f9c802",
				description: "デフォルト色: #f9c802"
			},
			{
				name: "gauge_lower_color",
				display_name: "ゲージ色 Lower",
				type: "color",
				validate: "required,custom[hexcolor]",
				default_value: "#a9d70b",
				description: "デフォルト色: #a9d70b"
			},
			{
				name: "gauge_color",
				display_name: "ゲージ背景色",
				type: "color",
				validate: "required,custom[hexcolor]",
				default_value: "#edebeb",
				description: "デフォルト色: #edebeb"
			},
			{
				name: "gauge_widthscale",
				display_name: "ゲージ太さ",
				type: "text",
				style: "width:100px",
				validate: "required,custom[integer],min[0],max[200]",
				default_value: 100,
				description: "0から200まで"
			},
			{
				name: "min_value",
				display_name: "最小値",
				type: "text",
				style: "width:100px",
				validate: "required,custom[integer],min[0]",
				default_value: 0,
				description: "0以上"
			},
			{
				name: "max_value",
				display_name: "最大値",
				type: "text",
				style: "width:100px",
				validate: "required,custom[integer],min[0]",
				default_value: 100,
				description: "最小値以上"
			}
		],
		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new gaugeWidget(settings));
		}
	});

	var flotchartID = 0;

	var flotchartWidget = function (settings) {
		var self = this;

		var currentID = "flotchart-" + flotchartID++;
		var titleElement = $('<h2 class="section-title"></h2>');
		var flotchartElement = $('<div class="flotchart" id="' + currentID + '"></div>');
		var currentSettings = settings;

		var plot;

		function createWidget() {
			if (plot) {
				plot.destroy();
				plot = null;
			}

			titleElement.html(currentSettings.title);

			freeboard.addStyle('#flotTip', currentSettings.tooltip_style);

			var height = 60 * currentSettings.blocks - titleElement.outerHeight() - 5;
			flotchartElement.css({
				"height": height + "px",
				"width": "100%"
			});

			Function.prototype.toJSON = Function.prototype.toString;

			var options;
			if (currentSettings.options) {
				try {
					options = jsonEscapeEntities(currentSettings.options);
					options = JSON.parse(options, function(k,v) {
						return v.toString().indexOf('function') === 0 ? eval('('+v+')') : v;
					});
				}
				catch (e) {
					alert("チャートオプションが不正です。 " + e);
					console.error(e);
					return;
				}
			}

			var dataset = [];
			plot = $.plot($('#'+currentID), dataset, options);
		}

		function plotData(dataset) {
			if (!plot)
				return;

			try {
				plot.setData(dataset);
				plot.setupGrid();
				plot.draw();
			} catch (e) {
				console.log(e);
			}
		}

		this.render = function (element) {
			$(element).append(titleElement).append(flotchartElement);
			createWidget();
		}

		this.onSettingsChanged = function (newSettings) {
			if (newSettings.options != currentSettings.options ||
				newSettings.value != currentSettings.value ||
				newSettings.blocks != currentSettings.blocks ||
				newSettings.tooltip_style != currentSettings.tooltip_style ||
				newSettings.title != currentSettings.title) {
				currentSettings = newSettings;
				createWidget();
			} else {
				currentSettings = newSettings;
			}
		}

		this.onCalculatedValueChanged = function (settingName, newValue) {
			plotData(newValue);
		}

		this.onDispose = function () {
		}

		this.getHeight = function () {
			return Number(currentSettings.blocks);
		}

		this.onSettingsChanged(settings);
	};

	freeboard.loadWidgetPlugin({
		type_name: "flotchart",
		display_name: "Flotチャート",
		"external_scripts" : [
			"plugins/thirdparty/excanvas.min.js",
			"plugins/thirdparty/jquery.flot.min.js",
			"plugins/thirdparty/jquery.colorhelpers.min.js",
			"plugins/thirdparty/jquery.flot.canvas.min.js",
			"plugins/thirdparty/jquery.flot.categories.min.js",
			"plugins/thirdparty/jquery.flot.crosshair.min.js",
			"plugins/thirdparty/jquery.flot.downsample.js",
			"plugins/thirdparty/jquery.flot.errorbars.min.js",
			"plugins/thirdparty/jquery.flot.fillbetween.min.js",
			"plugins/thirdparty/jquery.flot.image.min.js",
			"plugins/thirdparty/jquery.flot.pie.min.js",
			"plugins/thirdparty/jquery.flot.resize.min.js",
			"plugins/thirdparty/jquery.flot.selection.min.js",
			"plugins/thirdparty/jquery.flot.stack.min.js",
			"plugins/thirdparty/jquery.flot.symbol.min.js",
			"plugins/thirdparty/jquery.flot.threshold.min.js",
			"plugins/thirdparty/jquery.flot.time.min.js",
			"plugins/thirdparty/jquery.flot.tooltip.min.js"
		],
		settings: [
			{
				name: "title",
				display_name: "タイトル",
				validate: "optional,maxSize[100]",
				type: "text",
				description: "最大100文字"
			},
			{
				name: "blocks",
				display_name: "高さ (ブロック数)",
				validate: "required,custom[integer],min[1],max[20]",
				style: "width:100px",
				type: "text",
				default_value: 4,
				description: "1ブロック60ピクセル。20ブロックまで"
			},
			{
				name: "value",
				display_name: "値",
				validate: "optional,maxSize[2000]",
				type: "calculated",
				description: "最大2000文字"
			},
			{
				name: "options",
				display_name: "チャートオプション",
				validate: "optional,maxSize[5000]",
				type: "json",
				default_value: '{\n\
	"grid": {\n\
		"color":"#8b8b8b",\n\
		"borderColor":"#8b8b8b",\n\
		"borderWidth":{ "top":0, "left":2, "bottom":2, "right":2 },\n\
		"tickColor":"#525252",\n\
		"hoverable":true\n\
	},\n\
	"tooltip":true,\n\
	"tooltipOpts": {\n\
		"content":"function(label, x, y) {var ret = \\\"%s %x %y\\\";return ret;}",\n\
		"defaultTheme":false\n\
	},\n\
	"series": {\n\
		"shadowSize":0,\n\
		"downsample": { "threshold":800 },\n\
		"lines": { "show":true, "lineWidth":2 },\n\
		"points": { "radius":1, "show":false }\n\
	},\n\
	"legend": {\n\
		"show":true,\n\
		"position":"sw",\n\
		"backgroundColor":"null",\n\
		"labelFormatter":"function(label, series){return (label);}"\n\
	},\n\
	"xaxes": [\n\
		{\n\
			"font":{ "color":"#8b8b8b" },\n\
			"mode":"time"\n\
		}\n\
	],\n\
	"yaxes": [\n\
		{\n\
			"font":{ "color":"#8b8b8b" },\n\
			"position":"left"\n\
		},\n\
		{\n\
			"font":{ "color":"#8b8b8b" },\n\
			"position":"right"\n\
		}\n\
	]\n\
}',
				description: "最大5000文字<br>JSON形式文字列。 参考URL: <a href='https://github.com/flot/flot/blob/master/API.md#plot-options' target='_blank'>https://github.com/flot/flot/blob/master/API.md#plot-options</a>"
			},
			{
				name: "tooltip_style",
				display_name: "ツールチップスタイル",
				validate: "optional,maxSize[300]",
				type: "text",
				default_value: 'padding:3px 5px; color:#000000; background-color:#ffffff; box-shadow:0 0 10px #555; opacity:.7; filter:alpha(opacity=70); z-index:100; -webkit-border-radius:4px; -moz-border-radius:4px; border-radius:4px; font-size:12px;',
				description: "最大300文字br>チャートオプションでtooltip:trueの場合のみ有効。CSS形式"
			}
		],
		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new flotchartWidget(settings));
		}
	});

	freeboard.addStyle('.sparkline', "width:100%;height: 75px;");
	var sparklineWidget = function (settings) {
		var self = this;

		var titleElement = $('<h2 class="section-title"></h2>');
		var sparklineElement = $('<div class="sparkline"></div>');

		this.render = function (element) {
			$(element).append(titleElement).append(sparklineElement);
		}

		this.onSettingsChanged = function (newSettings) {
			titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
		}

		this.onCalculatedValueChanged = function (settingName, newValue) {
			addValueToSparkline(sparklineElement, newValue);
		}

		this.onDispose = function () {
		}

		this.getHeight = function () {
			return 2;
		}

		this.onSettingsChanged(settings);
	};

	freeboard.loadWidgetPlugin({
		type_name: "sparkline",
		display_name: "スパークラインチャート",
		"external_scripts" : [
			"plugins/thirdparty/jquery.sparkline.min.js"
		],
		settings: [
			{
				name: "title",
				display_name: "タイトル",
				validate: "optional,maxSize[100]",
				type: "text",
				description: "最大100文字"
			},
			{
				name: "value",
				display_name: "値",
				validate: "optional,maxSize[500]",
				type: "calculated",
				description: "最大500文字",
				multi_input: true
			}
		],
		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new sparklineWidget(settings));
		}
	});

	freeboard.addStyle('.pointer-widget-wrapper', "width:100%; height:214px; text-align:center;");
	freeboard.addStyle('.pointer-widget', "width:280px; height:100%; display: inline-block;");
	freeboard.addStyle('.pointer-value', "position:absolute; height:93px; margin:auto; top:0px; left:0px; bottom:0px; width:100%; text-align:center;");

	var pointerWidget = function (settings) {
		var self = this;
		var paper;
		var strokeWidth = 3;
		var circle = null;
		var triangle = null;
		var width, height;
		var currentValue = 0;

		var titleElement = $('<h2 class="section-title"></h2>');
		var widgetwrapperElement = $('<div class="pointer-widget-wrapper"></div>');
		var widgetElement = $('<div class="pointer-widget"></div>');
		var valueElement = $('<div class="pointer-value"></div>');
		var valueDiv = $('<div class="widget-big-text"></div>');
		var unitsDiv = $('<div></div>');

		var currentSettings = settings;

		function polygonPath(points) {
			if (!points || points.length < 2)
				return [];
			var path = []; //will use path object type
			path.push(['m', points[0], points[1]]);
			for (var i = 2; i < points.length; i += 2) {
				path.push(['l', points[i], points[i + 1]]);
			}
			path.push(['z']);
			return path;
		}

		this.render = function (element) {
			$(element).append(titleElement);
			$(element).append(widgetwrapperElement.append(widgetElement).append(valueElement.append(valueDiv).append(unitsDiv)));

			width = widgetElement.width();
			height = widgetElement.height();

			var radius = Math.min(width, height) / 2 - strokeWidth * 2;

			paper = Raphael(widgetElement[0], width, height);
			circle = paper.circle(width / 2, height / 2, radius);
			circle.attr("stroke", currentSettings.circle_color);
			circle.attr("stroke-width", strokeWidth);

			triangle = paper.path(polygonPath([width / 2, (height / 2) - radius + strokeWidth, 15, 20, -30, 0]));
			triangle.attr("stroke-width", 0);
			triangle.attr("fill", "#fff");
		}

		this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;

			if (circle) {
				circle.attr("stroke", newSettings.circle_color);
			}
			if (triangle) {
				triangle.attr("fill", newSettings.pointer_color);
			}

			titleElement.html(newSettings.title);
			unitsDiv.html(newSettings.units);
		}

		this.onCalculatedValueChanged = function (settingName, newValue) {
			if (settingName == "direction") {
				if (!_.isUndefined(triangle)) {
					var direction = "r";

					var oppositeCurrent = currentValue + 180;

					if (oppositeCurrent < newValue) {
						//direction = "l";
					}

					triangle.animate({transform: "r" + newValue + "," + (width / 2) + "," + (height / 2)}, 250, "bounce");
				}

				currentValue = newValue;
			}
			else if (settingName == "value_text") {
				valueDiv.html(newValue);
			}
		}

		this.onDispose = function () {
		}

		this.getHeight = function () {
			return 4;
		}

		this.onSettingsChanged(settings);
	};

	freeboard.loadWidgetPlugin({
		type_name: "pointer",
		display_name: "ポインタ",
		"external_scripts" : [
			"plugins/thirdparty/raphael.2.1.0.min.js"
		],
		settings: [
			{
				name: "title",
				display_name: "タイトル",
				validate: "optional,maxSize[100]",
				type: "text",
				description: "最大100文字"
			},
			{
				name: "direction",
				display_name: "方向",
				validate: "optional,maxSize[2000]",
				type: "calculated",
				description: "最大2000文字<br>角度を入力して下さい。"
			},
			{
				name: "value_text",
				display_name: "値テキスト",
				validate: "optional,maxSize[2000]",
				type: "calculated",
				description: "最大2000文字"
			},
			{
				name: "units",
				display_name: "単位",
				validate: "optional,maxSize[20]",
				style: "width:150px",
				type: "text",
				description: "最大20文字"
			},
			{
				name: "circle_color",
				display_name: "サークル色",
				validate: "required,custom[hexcolor]",
				type: "color",
				default_value: "#ff9900",
				description: "デフォルト色: #ff9900"
			},
			{
				name: "pointer_color",
				display_name: "ポインタ色",
				validate: "required,custom[hexcolor]",
				type: "color",
				default_value: "#fff",
				description: "デフォルト色: #fff"
			}
		],
		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new pointerWidget(settings));
		}
	});

	var pictureWidget = function(settings)
	{
		var self = this;
		var widgetElement;
		var timer;
		var imageURL;

		function stopTimer()
		{
			if(timer)
			{
				clearInterval(timer);
				timer = null;
			}
		}

		function updateImage()
		{
			if(widgetElement && imageURL)
			{
				var cacheBreakerURL = imageURL + (imageURL.indexOf("?") == -1 ? "?" : "&") + Date.now();

				$(widgetElement).css({
					"background-image" :  "url(" + cacheBreakerURL + ")"
				});
			}
		}

		this.render = function(element)
		{
			$(element).css({
				width : "100%",
				height: "100%",
				"background-size" : "cover",
				"background-position" : "center"
			});

			widgetElement = element;
		}

		this.onSettingsChanged = function(newSettings)
		{
			stopTimer();

			if(newSettings.refresh && newSettings.refresh > 0)
			{
				timer = setInterval(updateImage, Number(newSettings.refresh) * 1000);
			}
		}

		this.onCalculatedValueChanged = function(settingName, newValue)
		{
			if(settingName == "src")
			{
				imageURL = newValue;
			}

			updateImage();
		}

		this.onDispose = function()
		{
			stopTimer();
		}

		this.getHeight = function()
		{
			return 4;
		}

		this.onSettingsChanged(settings);
	};

	freeboard.loadWidgetPlugin({
		type_name: "picture",
		display_name: "画像",
		fill_size: true,
		settings: [
			{
				name: "src",
				display_name: "画像URL",
				validate: "optional,maxSize[2000]",
				type: "calculated",
				description: "最大2000文字"
			},
			{
				type: "number",
				display_name: "更新頻度",
				validate: "optional,custom[integer],min[1]",
				style: "width:100px",
				name: "text",
				suffix: "秒",
				description:"更新する必要がない場合は空白のまま"
			}
		],
		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new pictureWidget(settings));
		}
	});

	freeboard.addStyle('.indicator-light', "border-radius:50%;width:22px;height:22px;border:2px solid #3d3d3d;margin-top:5px;float:left;background-color:#222;margin-right:10px;");
	freeboard.addStyle('.indicator-light.on', "background-color:#FFC773;box-shadow: 0px 0px 15px #FF9900;border-color:#FDF1DF;");
	freeboard.addStyle('.indicator-text', "margin-top:10px;");
	var indicatorWidget = function (settings) {
		var self = this;
		var titleElement = $('<h2 class="section-title"></h2>');
		var stateElement = $('<div class="indicator-text"></div>');
		var indicatorElement = $('<div class="indicator-light"></div>');
		var currentSettings = settings;
		var isOn = false;

		function updateState() {
			indicatorElement.toggleClass("on", isOn);

			if (isOn) {
				stateElement.text((_.isUndefined(currentSettings.on_text) ? "" : currentSettings.on_text));
			}
			else {
				stateElement.text((_.isUndefined(currentSettings.off_text) ? "" : currentSettings.off_text));
			}
		}

		this.render = function (element) {
			$(element).append(titleElement).append(indicatorElement).append(stateElement);
		}

		this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;
			titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
			updateState();
		}

		this.onCalculatedValueChanged = function (settingName, newValue) {
			if (settingName == "value") {
				isOn = Boolean(newValue);
			}

			updateState();
		}

		this.onDispose = function () {
		}

		this.getHeight = function () {
			return 1;
		}

		this.onSettingsChanged(settings);
	};

	freeboard.loadWidgetPlugin({
		type_name: "indicator",
		display_name: "インジケータライト",
		settings: [
			{
				name: "title",
				display_name: "タイトル",
				validate: "optional,maxSize[100]",
				type: "text",
				description: "最大100文字"
			},
			{
				name: "value",
				display_name: "値",
				validate: "optional,maxSize[2000]",
				type: "calculated",
				description: "最大2000文字"
			},
			{
				name: "on_text",
				display_name: "ON時テキスト",
				validate: "optional,maxSize[500]",
				type: "calculated",
				description: "最大500文字"
			},
			{
				name: "off_text",
				display_name: "OFF時テキスト",
				validate: "optional,maxSize[500]",
				type: "calculated",
				description: "最大500文字"
			}
		],
		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new indicatorWidget(settings));
		}
	});

	freeboard.addStyle('.gm-style-cc a', "text-shadow:none;");

	var googleMapWidget = function (settings) {
		var self = this;
		var currentSettings = settings;
		var map;
		var marker;
		var currentPosition = {};

		function updatePosition() {
			if (map && marker && currentPosition.lat && currentPosition.lon) {
				var newLatLon = new google.maps.LatLng(currentPosition.lat, currentPosition.lon);
				marker.setPosition(newLatLon);
				map.panTo(newLatLon);
			}
		}

		this.render = function (element) {
			function initializeMap() {
				var mapOptions = {
					zoom: 13,
					center: new google.maps.LatLng(37.235, -115.811111),
					disableDefaultUI: true,
					draggable: false
				};

				map = new google.maps.Map(element, mapOptions);

				google.maps.event.addDomListener(element, 'mouseenter', function (e) {
					e.cancelBubble = true;
					if (!map.hover) {
						map.hover = true;
						map.setOptions({zoomControl: true});
					}
				});

				google.maps.event.addDomListener(element, 'mouseleave', function (e) {
					if (map.hover) {
						map.setOptions({zoomControl: false});
						map.hover = false;
					}
				});

				marker = new google.maps.Marker({map: map});

				updatePosition();
			}

			if (window.google && window.google.maps) {
				initializeMap();
			}
			else {
				window.gmap_initialize = initializeMap;
				head.js("https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=gmap_initialize");
			}
		}

		this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;
		}

		this.onCalculatedValueChanged = function (settingName, newValue) {
			if (settingName == "lat") {
				currentPosition.lat = newValue;
			}
			else if (settingName == "lon") {
				currentPosition.lon = newValue;
			}

			updatePosition();
		}

		this.onDispose = function () {
		}

		this.getHeight = function () {
			return 4;
		}

		this.onSettingsChanged(settings);
	};

	freeboard.loadWidgetPlugin({
		type_name: "google_map",
		display_name: "Google Map",
		fill_size: true,
		settings: [
			{
				name: "lat",
				display_name: "緯度",
				validate: "optional,maxSize[2000]",
				type: "calculated",
				description: "最大2000文字"
			},
			{
				name: "lon",
				display_name: "経度",
				validate: "optional,maxSize[2000]",
				type: "calculated",
				description: "最大2000文字"
			}
		],
		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new googleMapWidget(settings));
		}
	});

	freeboard.addStyle('.html-widget', "white-space:normal;width:100%;height:100%");

	var htmlWidget = function (settings) {
		var self = this;
		var htmlElement = $('<div class="html-widget"></div>');
		var currentSettings = settings;

		this.render = function (element) {
			$(element).append(htmlElement);
		}

		this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;
		}

		this.onCalculatedValueChanged = function (settingName, newValue) {
			if (settingName == "html") {
				htmlElement.html(newValue);
			}
		}

		this.onDispose = function () {
		}

		this.getHeight = function () {
			return Number(currentSettings.height);
		}

		this.onSettingsChanged(settings);
	};

	freeboard.loadWidgetPlugin({
		"type_name": "html",
		"display_name": "HTML",
		"fill_size": true,
		"settings": [
			{
				name: "html",
				display_name: "HTML",
				validate: "optional,maxSize[2000]",
				type: "calculated",
				description: "最大2000文字<br>HTML文字列かjavascriptが使用できます。"
			},
			{
				name: "height",
				display_name: "ブロック高さ",
				validate: "required,custom[integer],min[1],max[20]",
				style: "width:100px",
				type: "text",
				default_value: 4,
				description: "1ブロック60ピクセル。20ブロックまで"
			}
		],
		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new htmlWidget(settings));
		}
	});
}());
