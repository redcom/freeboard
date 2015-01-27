// # Highcharts Freeboard Plugin
//
// Copyright © 2015 Daisuke Tanaka.(https://github.com/tanaka0323)
// Licensed under the MIT license.
//
// -------------------

(function() {

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
				validate: "required,custom[integer],min[1],max[20]",
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

				description: "最大5000文字<br>JSON形式文字列。 参考URL: <a href='http://www.highcharts.com/' target='_blank'>http://www.highcharts.com/</a>"
			},
			{
				name: "theme",
				display_name: "チャートテーマ",
				validate: "optional,maxSize[5000]",
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
				description: "最大5000文字<br>JSON形式文字列。 参考URL: <a href='http://www.highcharts.com/' target='_blank'>http://www.highcharts.com/</a>"
			}
		],

		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new highchartsWidget(settings));
		}
	});

	var highchartsID = 0;

	var highchartsWidget = function (settings) {
		var self = this;
		var currentID = "highcharts" + highchartsID++;
		var highchartsElement = $('<div class="highcharts" id="' + currentID + '"></div>');
		var currentSettings = settings;

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

			var valueStyle = freeboard.getStyleObject("values");
			var font = {
				chart: {
					style: {
						fontFamily: valueStyle['font-family']
					}
				}
			};
			$.extend(true, theme, font);

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

}());
