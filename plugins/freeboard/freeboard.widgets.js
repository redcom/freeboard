// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
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
				type: "text"
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
				type: "calculated"
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
				type: "text"
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
				labelFontFamily: valueStyle['font-family'],
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
			"plugins/thirdparty/justgage.1.0.2.js"
		],
		settings: [
			{
				name: "title",
				display_name: "タイトル",
				type: "text"
			},
			{
				name: "value",
				display_name: "値",
				type: "calculated"
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
				type: "text"
			},
			{
				name: "value_fontcolor",
				display_name: "値フォント色",
				type: "color",
				default_value: "#d3d4d4",
				description: "デフォルト色: #d3d4d4"
			},
			{
				name: "gauge_upper_color",
				display_name: "ゲージ色 Upper",
				type: "color",
				default_value: "#ff0000",
				description: "デフォルト色: #ff0000"
			},
			{
				name: "gauge_mid_color",
				display_name: "ゲージ色 Mid",
				type: "color",
				default_value: "#f9c802",
				description: "デフォルト色: #f9c802"
			},
			{
				name: "gauge_lower_color",
				display_name: "ゲージ色 Lower",
				type: "color",
				default_value: "#a9d70b",
				description: "デフォルト色: #a9d70b"
			},
			{
				name: "gauge_color",
				display_name: "ゲージ背景色",
				type: "color",
				default_value: "#edebeb",
				description: "デフォルト色: #edebeb"
			},
			{
				name: "gauge_widthscale",
				display_name: "ゲージ太さ",
				type: "number",
				default_value: 100,
				description: "0から200まで"
			},
			{
				name: "min_value",
				display_name: "最小値",
				type: "number",
				default_value: 0
			},
			{
				name: "max_value",
				display_name: "最大値",
				type: "number",
				default_value: 100
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

			freeboard.addStyle('#flotTip', currentSettings.tooltip_style);

			flotchartElement.css({
				"height": 60 * currentSettings.blocks - 25 + "px",
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
				newSettings.tooltip_style != currentSettings.tooltip_style) {
				currentSettings = newSettings;
				createWidget();
			} else {
				currentSettings = newSettings;
			}
			titleElement.html(newSettings.title);
		}

		this.onCalculatedValueChanged = function (settingName, newValue) {
			plotData(newValue);
		}

		this.onDispose = function () {
		}

		this.getHeight = function () {
			return currentSettings.blocks;
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
			"plugins/thirdparty/jquery.flot.navigate.min.js",
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
				type: "text"
			},
			{
				name: "blocks",
				display_name: "高さ (ブロック数)",
				type: "number",
				default_value: 4,
				description: "1ブロック60ピクセル。"
			},
			{
				name: "value",
				display_name: "値",
				type: "calculated"
			},
			{
				name: "options",
				display_name: "チャートオプション",
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
		"labelFormatter":"function(label, series){return (\\\"&nbsp;\\\"+label);}"\n\
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
				description: "JSON形式文字列。 参考URL: <a href='https://github.com/flot/flot/blob/master/API.md#plot-options' target='_blank'>https://github.com/flot/flot/blob/master/API.md#plot-options</a>"
			},
			{
				name: "tooltip_style",
				display_name: "ツールチップスタイル",
				type: "text",
				default_value: 'padding:3px 5px; color:#000000; background-color:#ffffff; box-shadow:0 0 10px #555; opacity:.7; filter:alpha(opacity=70); z-index:100; -webkit-border-radius:4px; -moz-border-radius:4px; border-radius:4px; font-size:12px;',
				description: "チャートオプションでtooltip:trueの場合のみ有効。CSS形式"
			}
		],
		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new flotchartWidget(settings));
		}
	});

	var highchartsID = 0;

	var highchartsWidget = function (settings) {
		var self = this;
		var currentID = "highcharts" + highchartsID++;
		var highchartsElement = $('<div class="highcharts" id="' + currentID + '"></div>');
		var currentSettings = settings;
		var chart;

		function createWidget() {

			highchartsElement.css({
				"height": 60 * currentSettings.blocks + "px",
				"width": "100%"
			});

			var options;
			var theme;

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

			if (currentSettings.theme) {
				try {
					theme = JSON.parse(currentSettings.theme, function(k,v) {
						return v.toString().indexOf('function') === 0 ? eval('('+v+')') : v;
					});
				}
				catch (e) {
					alert("チャートテーマが不正です。 " + e);
					console.error(e);
					return;
				}
			}

			var dataset = [];
			options['series'] = dataset;

			// merge theme to options
			$.extend(true, options, theme);

			highchartsElement.highcharts(options);

			highchartsElement.resize(function(){
				highchartsElement.highcharts().reflow();
			});
		}

		this.render = function (element) {
			$(element).append(highchartsElement);
			createWidget();
		}

		this.onSettingsChanged = function (newSettings) {
			if (newSettings.blocks != currentSettings.blocks ||
				newSettings.value != currentSettings.value ||
				newSettings.options != currentSettings.options ||
				newSettings.theme != currentSettings.theme) {
				currentSettings = newSettings;
				createWidget();
			} else {
				currentSettings = newSettings;
			}
		}

		this.onCalculatedValueChanged = function (settingName, newValue) {
		}

		this.onDispose = function () {
		}

		this.getHeight = function () {
			return currentSettings.blocks;
		}

		this.onSettingsChanged(settings);
	};

	var valueStyle = freeboard.getStyleObject("values");

	freeboard.loadWidgetPlugin({
		type_name: "highcharts",
		display_name: "Highチャート",
		"external_scripts" : [
						"http://code.highcharts.com/highcharts.js",
						"http://code.highcharts.com/modules/exporting.js"],
		fill_size : true,
		settings: [
			{
				name: "blocks",
				display_name: "高さ (ブロック数)",
				type: "number",
				default_value: 4,
				description: "1ブロック60ピクセル。"
			},
			{
				name: "value",
				display_name: "値",
				type: "calculated"
			},
			{
				name: "options",
				display_name: "チャートオプション",
				type: "json",
				default_value: '{\n\
	"chart": {\n\
		"type": "spline",\n\
		"animation": "Highcharts.svg"\n\
	},\n\
	"title": {\n\
		"text": "Enter Title"\n\
	},\n\
	"subtitle": {\n\
		"text": "Enter Subtitle"\n\
	},\n\
	"xAxis": {\n\
		"title": {\n\
			"text": "Time"\n\
		},\n\
		"type": "datetime",\n\
		"floor": 0\n\
	},\n\
	"yAxis": {\n\
		"title": {\n\
			"text": "Values"\n\
		},\n\
		"minorTickInterval": "auto",\n\
		"floor": 0\n\
	},\n\
	"tooltip": {\n\
		"formatter": "function() { return \\\"<b>\\\" + this.series.name + \\\"</b><br/>\\\" + Highcharts.dateFormat(\\\"%Y-%m-%d %H:%M:%S\\\", this.x) + \\\"<br/>\\\" + Highcharts.numberFormat(this.y, 2); }"\n\
	}\n\
}',

				description: "JSON形式文字列。 参考URL: <a href='http://www.highcharts.com/' target='_blank'>http://www.highcharts.com/</a>"
			},
			{
				name: "theme",
				display_name: "チャートテーマ",
				type: "json",
				default_value: '{\n\
	"colors": [\n\
				"#2b908f", "#90ee7e", "#f45b5b", "#7798BF",\n\
				"#aaeeee", "#ff0066", "#eeaaee", "#55BF3B",\n\
				"#DF5353", "#7798BF", "#aaeeee"\n\
	],\n\
	"chart": {\n\
		"backgroundColor": "#2a2a2a",\n\
		"plotBorderColor": "#606063"\n\
	},\n\
	"title": {\n\
		"style": {\n\
			"color": "#E0E0E3",\n\
			"fontSize": "20px"\n\
		}\n\
	},\n\
	"subtitle": {\n\
		"style": {\n\
			"color": "#E0E0E3",\n\
			"textTransform": "uppercase"\n\
		}\n\
	},\n\
	"xAxis": {\n\
		"gridLineColor": "#707073",\n\
		"labels": {\n\
			"style": {\n\
				"color": "#E0E0E3"\n\
			}\n\
		},\n\
		"lineColor": "#707073",\n\
		"minorGridLineColor": "#505053",\n\
		"tickColor": "#707073",\n\
		"title": {\n\
			"style": {\n\
				"color": "#A0A0A3"\n\
			}\n\
		}\n\
	},\n\
	"yAxis": {\n\
		"gridLineColor": "#707073",\n\
		"labels": {\n\
			"style": {\n\
				"color": "#E0E0E3"\n\
			}\n\
		},\n\
		"lineColor": "#707073",\n\
		"minorGridLineColor": "#505053",\n\
		"tickColor": "#707073",\n\
		"tickWidth": 1,\n\
		"title": {\n\
			"style": {\n\
				"color": "#A0A0A3"\n\
			}\n\
		}\n\
	},\n\
	"tooltip": {\n\
		"backgroundColor": "rgba(0, 0, 0, 0.85)",\n\
		"style": {\n\
			"color": "#F0F0F0"\n\
		}\n\
	},\n\
	"plotOptions": {\n\
		"series": {\n\
			"dataLabels": {\n\
				"color": "#B0B0B3"\n\
			},\n\
			"marker": {\n\
				"lineColor": "#333"\n\
			}\n\
		},\n\
		"boxplot": {\n\
			"fillColor": "#505053"\n\
		},\n\
		"candlestick": {\n\
			"lineColor": "white"\n\
		},\n\
		"errorbar": {\n\
			"color": "white"\n\
		}\n\
	},\n\
	"legend": {\n\
		"itemStyle": {\n\
			"color": "#E0E0E3"\n\
		},\n\
		"itemHoverStyle": {\n\
			"color": "#FFF"\n\
		},\n\
		"itemHiddenStyle": {\n\
			"color": "#606063"\n\
		}\n\
	},\n\
	"credits": {\n\
		"style": {\n\
			"color": "#666"\n\
		}\n\
	},\n\
	"labels": {\n\
		"style": {\n\
			"color": "#707073"\n\
		}\n\
	},\n\
	"drilldown": {\n\
		"activeAxisLabelStyle": {\n\
			"color": "#F0F0F3"\n\
		},\n\
		"activeDataLabelStyle": {\n\
			"color": "#F0F0F3"\n\
		}\n\
	},\n\
	"navigation": {\n\
		"buttonOptions": {\n\
			"align": "left",\n\
			"symbolStroke": "#DDDDDD",\n\
			"theme": {\n\
				"fill": "#505053"\n\
			}\n\
		}\n\
	},\n\
	"rangeSelector": {\n\
		"buttonTheme": {\n\
			"fill": "#505053",\n\
			"stroke": "#000000",\n\
			"style": {\n\
				"color": "#CCC"\n\
			},\n\
			"states": {\n\
				"hover": {\n\
					"fill": "#707073",\n\
					"stroke": "#000000",\n\
					"style": {\n\
						"color": "white"\n\
					}\n\
				},\n\
				"select": {\n\
					"fill": "#000003",\n\
					"stroke": "#000000",\n\
					"style": {\n\
						"color": "white"\n\
					}\n\
				}\n\
			}\n\
		},\n\
		"inputBoxBorderColor": "#505053",\n\
		"inputStyle": {\n\
			"backgroundColor": "#333",\n\
			"color": "silver"\n\
		},\n\
		"labelStyle": {\n\
			"color": "silver"\n\
		}\n\
	},\n\
	"scrollbar": {\n\
		"barBackgroundColor": "#808083",\n\
		"barBorderColor": "#808083",\n\
		"buttonArrowColor": "#CCC",\n\
		"buttonBackgroundColor": "#606063",\n\
		"buttonBorderColor": "#606063",\n\
		"rifleColor": "#FFF",\n\
		"trackBackgroundColor": "#404043",\n\
		"trackBorderColor": "#404043"\n\
	},\n\
	"legendBackgroundColor": "rgba(0, 0, 0, 0.5)",\n\
	"background2": "#505053",\n\
	"dataLabelsColor": "#B0B0B3",\n\
	"textColor": "#C0C0C0",\n\
	"contrastTextColor": "#F0F0F3",\n\
	"maskColor": "rgba(255,255,255,0.3)"\n\
}',
				description: "JSON形式文字列。 参考URL: <a href='http://www.highcharts.com/' target='_blank'>http://www.highcharts.com/</a>"
			}
		],

		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new highchartsWidget(settings));
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
				type: "text"
			},
			{
				name: "value",
				display_name: "値",
				type: "calculated",
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
				type: "text"
			},
			{
				name: "direction",
				display_name: "方向",
				type: "calculated",
				description: "角度"
			},
			{
				name: "value_text",
				display_name: "値テキスト",
				type: "calculated"
			},
			{
				name: "units",
				display_name: "単位",
				type: "text"
			},
			{
				name: "circle_color",
				display_name: "サークル色",
				type: "color",
				default_value: "#ff9900",
				description: "デフォルト色: #ff9900"
			},
			{
				name: "pointer_color",
				display_name: "ポインタ色",
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
				type: "calculated"
			},
			{
				type: "number",
				display_name: "更新頻度",
				name: "refresh",
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
				type: "text"
			},
			{
				name: "value",
				display_name: "値",
				type: "calculated"
			},
			{
				name: "on_text",
				display_name: "ON時テキスト",
				type: "calculated"
			},
			{
				name: "off_text",
				display_name: "OFF時テキスト",
				type: "calculated"
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
				type: "calculated"
			},
			{
				name: "lon",
				display_name: "経度",
				type: "calculated"
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
				"name": "html",
				"display_name": "HTML",
				"type": "calculated",
				"description": "HTML文字列かjavascriptが使用できます。"
			},
			{
				"name": "height",
				"display_name": "ブロック高さ",
				"type": "number",
				"default_value": 4,
				"description": "1ブロック高さは約60pixel"
			}
		],
		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new htmlWidget(settings));
		}
	});
}());
