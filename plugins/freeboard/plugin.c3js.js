// # c3js Freeboard Plugin
//
// Copyright © 2015 Daisuke Tanaka.(https://github.com/tanaka0323)
// Licensed under the MIT license.
//
// -------------------

(function() {

	freeboard.loadWidgetPlugin({
		type_name: "c3js",
		display_name: "C3チャート",
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
				validate: "required,custom[integer],min[2],max[20]",
				type: "number",
				style: "width:100px",
				default_value: 4,
				description: "1ブロック60ピクセル。20ブロックまで"
			},
			{
				name: "value",
				display_name: "値",
				validate: "optional,maxSize[5000]",
				type: "calculated",
				description: "最大5000文字"
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

	var c3jsWidget = function (settings) {
		var self = this;
		var currentID = _.uniqueId("c3js_");
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

			// No need for the first load
			data = _.omit(data, '_op');

			Function.prototype.toJSON = Function.prototype.toString;

			if (!_.isUndefined(chartsettings.options)) {
				try {
					options = JSON.parse(chartsettings.options, function(k,v) {
						var ret;
						var str = v.toString();
						if (str.indexOf('function') === 0)
							ret = eval('('+v+')');
						else if (str.indexOf('d3.') === 0)
							ret = eval('('+v+')');
						else
							ret = v;
						return ret;
					});
				} catch (e) {
					alert("チャートオプションが不正です。 " + e);
					console.error(e);
					return;
				}
			}

			if (!_.isUndefined(chart)) {
				chartElement.resize(null);
				chart.destroy();
				chart = null;
			}

			var bind = {
				bindto: '#' + currentID,
			};
			options = _.merge(bind, _.merge(data, options));

			try {
				chart = c3.generate(options);
				// svg chart fit to container
				chartElement.resize(_.debounce(function() {
					var v = chartElement[0].getBoundingClientRect();
					chart.resize({height:v.height, width:v.width});
				}, 500));
			} catch (e) {
				console.error(e);
				return;
			}
		}

		function plotData(data) {
			if (_.isUndefined(chart))
				return;

			var op = data._op;
			data = _.omit(data, '_op');

			try {
				switch (op) {
					case 'load':
						chart.load(data);
						break;
					case 'unload':
						chart.unload(data);
						break;
					case 'groups':
						chart.groups(data);
						break;
					case 'flow':
						chart.flow(data);
						break;
					case 'data.names':
						chart.data.names(data);
						break;
					case 'data.colors':
						chart.data.colors(data);
						break;
					case 'axis.labels':
						chart.axis.labels(data);
						break;
					case 'axis.max':
						chart.axis.max(data);
						break;
					case 'axis.min':
						chart.axis.min(data);
						break;
					case 'axis.range':
						chart.axis.range(data);
						break;
					case 'xgrids':
						if (!_.isUndefined(data.xgrids))
							chart.xgrids(data.xgrids);
						break;
					case 'xgrids.add':
						if (!_.isUndefined(data.xgrids))
							chart.xgrids.add(data.xgrids);
						break;
					case 'xgrids.remove':
						if (!_.isUndefined(data.xgrids))
							chart.xgrids.remove(data.xgrids);
						else
							chart.xgrids.remove();
						break;
					case 'transform':
						if (!_.isUndefined(data.type)) {
							if (!_.isUndefined(data.name))
								chart.transform(data.type, data.name);
							else
								chart.transform(data.type);
						}
						break;
					default:
						chart.load(data);
						break;
				}
			} catch (e) {
				console.error(e);
			}
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
			if (newSettings.options != currentSettings.options)
				createWidget(chartdata, newSettings);
			currentSettings = newSettings;
		}

		this.onCalculatedValueChanged = function (settingName, newValue) {
			if (!_.isObject(newValue))
				return;

			if (_.isUndefined(chart))
				createWidget(newValue, currentSettings);
			else
				plotData(newValue);

			chartdata = newValue;
		}

		this.onDispose = function () {
			if (!_.isUndefined(chart)) {
				chart.destroy();
				chart = null;
			}
		}

		this.getHeight = function () {
			return currentSettings.blocks;
		}

		this.onSettingsChanged(settings);
	};
}());
