// # c3js Freeboard Plugin
//
// Copyright © 2015 Daisuke Tanaka.(https://github.com/tanaka0323)
// Licensed under the MIT license.
//
// -------------------

(function() {

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

	freeboard.loadWidgetPlugin({
		type_name: "c3js",
		display_name: "C3.jsチャート",
		"external_scripts" : [
			"http://d3js.org/d3.v3.min.js",
			"plugins/thirdparty/c3.min.js"
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
				type: "text",
				style: "width:100px",
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
	"data": {\n\
		"type": "line"\n\
	}\n\
}',
				description: "最大5000文字<br>JSON形式文字列。 参考URL: <a href='http://c3js.org/' target='_blank'>http://c3js.org/</a>"
			}
		],

		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new c3jsWidget(settings));
		}
	});

	var valueStyle = freeboard.getStyleObject("values");

	var c3jsID = 0;

	var c3jsWidget = function (settings) {
		var self = this;
		var currentID = "c3js" + c3jsID++;
		var titleElement = $('<h2 class="section-title"></h2>');
		var chartElement = $('<div id="' + currentID + '"></div>');
		var currentSettings;
		var chart;
		var chartdata;

		function setTitle(title) {
			if (_.isUndefined(title))
				return;
			titleElement.html(title);
		}

		function setBlocks(blocks) {
			if (_.isUndefined(blocks))
				return;
			var height = 60 * blocks - titleElement.outerHeight() - 7;
			chartElement.css({
				"max-height": height + "px",
				"height": height + "px",
				"width": "100%"
			});
		}

		function createWidget(data, chartsettings) {

			var options;

			Function.prototype.toJSON = Function.prototype.toString;

			if (!_.isUndefined(chartsettings.options)) {
				try {
					options = jsonEscapeEntities(chartsettings.options);
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

			var bind = {
				bindto: '#' + currentID,
			};
			options = _.merge(bind, _.merge(data, options));

			if (!_.isUndefined(chart))
				chart.destroy();

			chart = c3.generate(_.merge(bind, options));

			// svg chart fit to container
			chartElement.resize(function() {
				_.defer(function() {
					chart.resize();
				});
			});
		}

		this.render = function (element) {
			$(element).append(titleElement).append(chartElement);
			setTitle(currentSettings.title);
			setBlocks(currentSettings.blocks);
		}

		this.onSettingsChanged = function (newSettings) {
			if (titleElement.outerHeight() == 0) {
				currentSettings = newSettings;
				return;
			}
			setTitle(newSettings.title);
			setBlocks(newSettings.blocks);
			if (!_.isUndefined(chart)) {
				if (newSettings.options != currentSettings.options) {
					createWidget(chartdata, newSettings);
				}
			}
			currentSettings = newSettings;
		}

		this.onCalculatedValueChanged = function (settingName, newValue) {
			if (_.isUndefined(chart))
				createWidget(newValue, currentSettings);
			else
				chart.load(newValue);
			chartdata = newValue;
		}

		this.onDispose = function () {
			if (!_.isUndefined(chart))
				chart.destroy();
		}

		this.getHeight = function () {
			return Number(currentSettings.blocks);
		}

		this.onSettingsChanged(settings);
	};
}());
