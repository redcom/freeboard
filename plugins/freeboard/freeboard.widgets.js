// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function($) {
    var SPARKLINE_HISTORY_LENGTH = 100;
    var SPARKLINE_COLORS = ["#FF9900", "#FFFFFF", "#B3B4B4", "#6B6B6B", "#28DE28", "#13F7F9", "#E6EE18", "#C41204", "#CA3CB8", "#0B1CFB"];

    var _t = function(str) {
        return $.i18n.t('widgets.' + str);
    };

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

            jQuery({
                transitionValue: Number(currentValue),
                precisionValue: startingPrecision
            }).animate({
                transitionValue: Number(newValue),
                precisionValue: endingPrecision
            }, {
                duration: duration,
                step: function() {
                    $(textElement).text(this.transitionValue.toFixed(this.precisionValue));
                },
                done: function() {
                    $(textElement).text(newValue);
                }
            });
        } else {
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
            if (!values[plotIndex]) {
                values[plotIndex] = [];
            }
            if (values[plotIndex].length >= SPARKLINE_HISTORY_LENGTH) {
                values[plotIndex].shift();
            }
            values[plotIndex].push(Number(val));

            if (valueMin === undefined || val < valueMin) {
                valueMin = val;
            }
            if (valueMax === undefined || val > valueMax) {
                valueMax = val;
            }
        }

        if (_.isArray(value)) {
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

    var textWidget = function(settings) {

        var self = this;

        var currentSettings = settings;
        var displayElement = $('<div class="tw-display"></div>');
        var titleElement = $('<h2 class="section-title tw-title tw-td"></h2>');
        var valueElement = $('<div class="tw-value"></div>');
        var unitsElement = $('<div class="tw-unit"></div>');
        var sparklineElement = $('<div class="tw-sparkline tw-td"></div>');

        function updateValueSizing() {
            if (!_.isUndefined(currentSettings.units) && currentSettings.units != "") // If we're displaying our units
            {
                valueElement.css("max-width", (displayElement.innerWidth() - unitsElement.outerWidth(true)) + "px");
            } else {
                valueElement.css("max-width", "100%");
            }
        }

        this.render = function(element) {
            $(element).empty();

            $(displayElement)
                .append($('<div class="tw-tr"></div>').append(titleElement))
                .append($('<div class="tw-tr"></div>').append($('<div class="tw-value-wrapper tw-td"></div>').append(valueElement).append(unitsElement)))
                .append($('<div class="tw-tr"></div>').append(sparklineElement));

            $(element).append(displayElement);

            updateValueSizing();
        }

        this.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;

            var shouldDisplayTitle = (!_.isUndefined(newSettings.title) && newSettings.title != "");
            var shouldDisplayUnits = (!_.isUndefined(newSettings.units) && newSettings.units != "");

            if (newSettings.sparkline) {
                sparklineElement.attr("style", null);
            } else {
                delete sparklineElement.data().values;
                sparklineElement.empty();
                sparklineElement.hide();
            }

            if (shouldDisplayTitle) {
                titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
                titleElement.attr("style", null);
            } else {
                titleElement.empty();
                titleElement.hide();
            }

            if (shouldDisplayUnits) {
                unitsElement.html((_.isUndefined(newSettings.units) ? "" : newSettings.units));
                unitsElement.attr("style", null);
            } else {
                unitsElement.empty();
                unitsElement.hide();
            }

            var valueFontSize = 30;

            if (newSettings.size == "big") {
                valueFontSize = 75;

                if (newSettings.sparkline) {
                    valueFontSize = 60;
                }
            }

            valueElement.css({
                "font-size": valueFontSize + "px"
            });

            updateValueSizing();
        }

        this.onSizeChanged = function() {
            updateValueSizing();
        }

        this.onCalculatedValueChanged = function(settingName, newValue) {
            if (settingName == "value") {

                if (currentSettings.animate) {
                    easeTransitionText(newValue, valueElement, 500);
                } else {
                    valueElement.text(newValue);
                }

                if (currentSettings.sparkline) {
                    addValueToSparkline(sparklineElement, newValue);
                }
            }
        }

        this.onDispose = function() {

        }

        this.getHeight = function() {
            if (currentSettings.size == "big" || currentSettings.sparkline) {
                return 2;
            } else {
                return 1;
            }
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "text_widget",
        display_name: _t('text_widget.display_name'),
        "external_scripts": [
            "plugins/thirdparty/jquery.sparkline.min.js"
        ],
        settings: [{
            name: "title",
            display_name: _t('text_widget.settings.title.display_name'),
            validate: "optional,maxSize[100]",
            type: "text",
            description: _t('text_widget.settings.title.description')
        }, {
            name: "size",
            display_name: _t('text_widget.settings.size.display_name'),
            type: "option",
            options: [{
                name: _t('text_widget.settings.size.options.regular'),
                value: "regular"
            }, {
                name: _t('text_widget.settings.size.options.big'),
                value: "big"
            }]
        }, {
            name: "value",
            display_name: _t('text_widget.settings.value.display_name'),
            validate: "optional,maxSize[2000]",
            type: "calculated",
            description: _t('text_widget.settings.value.description')
        }, {
            name: "sparkline",
            display_name: _t('text_widget.settings.sparkline.display_name'),
            type: "boolean"
        }, {
            name: "animate",
            display_name: _t('text_widget.settings.animate.display_name'),
            type: "boolean",
            default_value: true
        }, {
            name: "units",
            display_name: _t('text_widget.settings.units.display_name'),
            validate: "optional,maxSize[20]",
            type: "text",
            style: "width:150px",
            description: _t('text_widget.settings.units.description')
        }],
        newInstance: function(settings, newInstanceCallback) {
            newInstanceCallback(new textWidget(settings));
        }
    });

    var gaugeID = 0;
    freeboard.addStyle('.gauge-widget-wrapper', "width: 100%;text-align: center;");
    freeboard.addStyle('.gauge-widget', "width:280px;height:214px;display:inline-block;");

    var gaugeWidget = function(settings) {
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
                levelColors: [currentSettings.gauge_lower_color, currentSettings.gauge_mid_color, currentSettings.gauge_upper_color],
                gaugeWidthScale: currentSettings.gauge_widthscale / 100.0,
                gaugeColor: currentSettings.gauge_color,
                labelFontFamily: valueStyle['font-family-light'],
                labelFontColor: currentSettings.value_fontcolor,
                valueFontColor: currentSettings.value_fontcolor
            });
        }

        this.render = function(element) {
            rendered = true;
            $(element).append(titleElement).append(wrapperElement.append(gaugeElement));

            // for justgauge redraw bug.
            var timerID = setTimeout(function() {
                createGauge();
                clearTimeout(timerID);
            }, 500);
        }

        this.onSettingsChanged = function(newSettings) {
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
            } else {
                currentSettings = newSettings;
            }

            titleElement.html(newSettings.title);
        }

        this.onCalculatedValueChanged = function(settingName, newValue) {
            if (!_.isUndefined(gaugeObject)) {
                gaugeObject.refresh(Number(newValue));
            }
        }

        this.onDispose = function() {}

        this.getHeight = function() {
            return 4;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "gauge",
        display_name: _t('gauge.display_name'),
        "external_scripts": [
            "plugins/thirdparty/raphael.2.1.0.min.js",
            "plugins/thirdparty/justgage.min.js"
        ],
        settings: [{
            name: "title",
            display_name: _t('gauge.settings.title.display_name'),
            validate: "optional,maxSize[100]",
            type: "text",
            display_name: _t('gauge.settings..description')
        }, {
            name: "value",
            display_name: _t('gauge.settings.value.display_name'),
            validate: "optional,maxSize[2000]",
            type: "calculated",
            display_name: _t('gauge.settings..description')
        }, {
            name: "shape",
            display_name: _t('gauge.settings.shape.display_name'),
            type: "option",
            options: [{
                name: _t('gauge.settings.shape.options.value_0'),
                value: 0
            }, {
                name: _t('gauge.settings.shape.options.value_1'),
                value: 1
            }, {
                name: _t('gauge.settings.shape.options.value_2'),
                value: 2
            }]
        }, {
            name: "units",
            display_name: _t('gauge.settings.units.display_name'),
            validate: "optional,maxSize[20]",
            style: "width:150px",
            type: "text",
            display_name: _t('gauge.settings.units.description')
        }, {
            name: "value_fontcolor",
            display_name: _t('gauge.settings.value_fontcolor.display_name'),
            type: "color",
            validate: "required,custom[hexcolor]",
            default_value: "#d3d4d4",
            display_name: _t('gauge.settings.value_fontcolor.description')
        }, {
            name: "gauge_upper_color",
            display_name: _t('gauge.settings.gauge_upper_color.display_name'),
            type: "color",
            validate: "required,custom[hexcolor]",
            default_value: "#ff0000",
            display_name: _t('gauge.settings.gauge_upper_color.description')
        }, {
            name: "gauge_mid_color",
            display_name: _t('gauge.settings.gauge_mid_color.display_name'),
            type: "color",
            validate: "required,custom[hexcolor]",
            default_value: "#f9c802",
            display_name: _t('gauge.settings.gauge_mid_color.description')
        }, {
            name: "gauge_lower_color",
            display_name: _t('gauge.settings.gauge_lower_color.display_name'),
            type: "color",
            validate: "required,custom[hexcolor]",
            default_value: "#a9d70b",
            display_name: _t('gauge.settings.gause_lower_color.description')
        }, {
            name: "gauge_color",
            display_name: _t('gauge.settings.gauge_color.display_name'),
            type: "color",
            validate: "required,custom[hexcolor]",
            default_value: "#edebeb",
            display_name: _t('gauge.settings.gouge_color.description')
        }, {
            name: "gauge_widthscale",
            display_name: _t('gauge.settings.gauge_widthscale.display_name'),
            type: "number",
            style: "width:100px",
            validate: "required,custom[integer],min[0],max[200]",
            default_value: 100,
            display_name: _t('gauge.settings.gauge_widthscale.description')
        }, {
            name: "min_value",
            display_name: _t('gauge.settings.min_value.display_name'),
            type: "number",
            style: "width:100px",
            validate: "required,custom[number],min[-100000000],max[100000000]",
            default_value: 0,
            display_name: _t('gauge.settings.min_value.description')
        }, {
            name: "max_value",
            display_name: _t('gauge.settings.max_value.display_name'),
            type: "number",
            style: "width:100px",
            validate: "required,custom[number],min[-100000000],max[100000000]",
            default_value: 100,
            display_name: _t('gauge.settings.max_value.description')
        }],
        newInstance: function(settings, newInstanceCallback) {
            newInstanceCallback(new gaugeWidget(settings));
        }
    });

    freeboard.addStyle('.sparkline', "width:100%;height: 75px;");
    var sparklineWidget = function(settings) {
        var self = this;

        var titleElement = $('<h2 class="section-title"></h2>');
        var sparklineElement = $('<div class="sparkline"></div>');

        this.render = function(element) {
            $(element).append(titleElement).append(sparklineElement);
        }

        this.onSettingsChanged = function(newSettings) {
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
        }

        this.onCalculatedValueChanged = function(settingName, newValue) {
            addValueToSparkline(sparklineElement, newValue);
        }

        this.onDispose = function() {}

        this.getHeight = function() {
            return 2;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "sparkline",
        display_name: _t('sparkline.display_name'),
        "external_scripts": [
            "plugins/thirdparty/jquery.sparkline.min.js"
        ],
        settings: [{
            name: "title",
            display_name: _t('sparkline.settings.title.display_name'),
            validate: "optional,maxSize[100]",
            type: "text",
            description: _t('sparkline.settings.title.description')
        }, {
            name: "value",
            display_name: _t('sparkline.settings.value.display_name'),
            validate: "optional,maxSize[500]",
            type: "calculated",
            description: _t('sparkline.settings.value.description'),
            multi_input: true
        }],
        newInstance: function(settings, newInstanceCallback) {
            newInstanceCallback(new sparklineWidget(settings));
        }
    });

    freeboard.addStyle('.pointer-widget-wrapper', "width:100%; height:214px; text-align:center;");
    freeboard.addStyle('.pointer-widget', "width:280px; height:100%; display: inline-block;");
    freeboard.addStyle('.pointer-value', "position:absolute; height:93px; margin:auto; top:0px; left:0px; bottom:0px; width:100%; text-align:center;");

    var pointerWidget = function(settings) {
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

        this.render = function(element) {
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

        this.onSettingsChanged = function(newSettings) {
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

        this.onCalculatedValueChanged = function(settingName, newValue) {
            if (settingName == "direction") {
                if (!_.isUndefined(triangle)) {
                    var direction = "r";
                    var oppositeCurrent = currentValue + 180;

                    if (oppositeCurrent < newValue) {
                        //direction = "l";
                    }

                    triangle.animate({
                        transform: "r" + newValue + "," + (width / 2) + "," + (height / 2)
                    }, 250, "bounce");
                }

                currentValue = newValue;
            } else if (settingName == "value_text") {
                valueDiv.html(newValue);
            }
        }

        this.onDispose = function() {}

        this.getHeight = function() {
            return 4;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "pointer",
        display_name: _t('pointer.display_name'),
        "external_scripts": [
            "plugins/thirdparty/raphael.2.1.0.min.js"
        ],
        settings: [{
            name: "title",
            display_name: _t('pointer.settings.title.display_name'),
            validate: "optional,maxSize[100]",
            type: "text",
            description: _t('pointer.settings.title.description')
        }, {
            name: "direction",
            display_name: _t('pointer.settings.direction.display_name'),
            validate: "optional,maxSize[2000]",
            type: "calculated",
            description: _t('pointer.settings.direction.description')
        }, {
            name: "value_text",
            display_name: _t('pointer.settings.value_text.display_name'),
            validate: "optional,maxSize[2000]",
            type: "calculated",
            description: _t('pointer.settings.value_text.description')
        }, {
            name: "units",
            display_name: _t('pointer.settings.units.display_name'),
            validate: "optional,maxSize[20]",
            style: "width:150px",
            type: "text",
            description: _t('pointer.settings.units.description')
        }, {
            name: "circle_color",
            display_name: _t('pointer.settings.circle_color.display_name'),
            validate: "required,custom[hexcolor]",
            type: "color",
            default_value: "#ff9900",
            description: _t('pointer.settings.circle_color.description')
        }, {
            name: "pointer_color",
            display_name: _t('pointer.settings.pointer_color.display_name'),
            validate: "required,custom[hexcolor]",
            type: "color",
            default_value: "#fff",
            description: _t('pointer.settings.pointer_color.description')
        }],
        newInstance: function(settings, newInstanceCallback) {
            newInstanceCallback(new pointerWidget(settings));
        }
    });

    var pictureWidget = function(settings) {
        var self = this;
        var widgetElement;
        var timer;
        var imageURL;

        function stopTimer() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }

        function updateImage() {
            if (widgetElement && imageURL) {
                var cacheBreakerURL = imageURL + (imageURL.indexOf("?") == -1 ? "?" : "&") + Date.now();

                $(widgetElement).css({
                    "background-image": "url(" + cacheBreakerURL + ")"
                });
            }
        }

        this.render = function(element) {
            $(element).css({
                width: "100%",
                height: "100%",
                "background-size": "cover",
                "background-position": "center"
            });

            widgetElement = element;
        }

        this.onSettingsChanged = function(newSettings) {
            stopTimer();

            if (newSettings.refresh && newSettings.refresh > 0) {
                timer = setInterval(updateImage, Number(newSettings.refresh) * 1000);
            }
        }

        this.onCalculatedValueChanged = function(settingName, newValue) {
            if (settingName == "src") {
                imageURL = newValue;
            }

            updateImage();
        }

        this.onDispose = function() {
            stopTimer();
        }

        this.getHeight = function() {
            return 4;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "picture",
        display_name: _t('picture.display_name')
        fill_size: true,
        settings: [{
            name: "src",
            display_name: _t('picture.settings.src.display_name'),
            validate: "optional,maxSize[2000]",
            type: "calculated",
            description: _t('picture.settings.src.description')
        }, {
            type: "number",
            display_name: _t('picture.settings.number.display_name'),
            validate: "optional,custom[integer],min[1]",
            style: "width:100px",
            name: "number",
            suffix: _t('suffix'),
            description: _t('picture.settings.number.description')
        }],
        newInstance: function(settings, newInstanceCallback) {
            newInstanceCallback(new pictureWidget(settings));
        }
    });

    freeboard.addStyle('.indicator-light', "border-radius:50%;width:22px;height:22px;border:2px solid #3d3d3d;margin-top:5px;float:left;background-color:#222;margin-right:10px;");
    freeboard.addStyle('.indicator-light.on', "background-color:#FFC773;box-shadow: 0px 0px 15px #FF9900;border-color:#FDF1DF;");
    freeboard.addStyle('.indicator-text', "margin-top:10px;");
    var indicatorWidget = function(settings) {
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
            } else {
                stateElement.text((_.isUndefined(currentSettings.off_text) ? "" : currentSettings.off_text));
            }
        }

        this.render = function(element) {
            $(element).append(titleElement).append(indicatorElement).append(stateElement);
        }

        this.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
            updateState();
        }

        this.onCalculatedValueChanged = function(settingName, newValue) {
            if (settingName == "value") {
                isOn = Boolean(newValue);
            }

            updateState();
        }

        this.onDispose = function() {}

        this.getHeight = function() {
            return 1;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "indicator",
        display_name: _t('indicator.display_name'),
        settings: [{
            name: "title",
            display_name: _t('indicator.settings.title.display_name'),
            validate: "optional,maxSize[100]",
            type: "text",
            description: _t('indicator.settings.title.description')
        }, {
            name: "value",
            display_name: _t('indicator.settings.value.display_name'),
            validate: "optional,maxSize[2000]",
            type: "calculated",
            description: _t('indicator.settings.value.description')
        }, {
            name: "on_text",
            display_name: _t('indicator.settings.on_text.display_name'),
            validate: "optional,maxSize[500]",
            type: "calculated",
            description: _t('indicator.settings.on_text.description')
        }, {
            name: "off_text",
            display_name: _t('indicator.settings.off_text.display_name'),
            validate: "optional,maxSize[500]",
            type: "calculated",
            description: _t('indicator.settings.off_text.description')
        }],
        newInstance: function(settings, newInstanceCallback) {
            newInstanceCallback(new indicatorWidget(settings));
        }
    });

    freeboard.addStyle('.gm-style-cc a', "text-shadow:none;");

    var googleMapWidget = function(settings) {
        var self = this;
        var currentSettings = settings;
        var map;
        var marker;
        var mapElement = $('<div></div>')
        var currentPosition = {};

        function updatePosition() {
            if (map && marker && currentPosition.lat && currentPosition.lon) {
                var newLatLon = new google.maps.LatLng(currentPosition.lat, currentPosition.lon);
                marker.setPosition(newLatLon);
                map.panTo(newLatLon);
            }
        }

        function setBlocks(blocks) {
            if (_.isUndefined(mapElement) || _.isUndefined(blocks))
                return;
            var height = 60 * blocks;
            mapElement.css({
                "height": height + "px",
                "width": "100%"
            });
        }

        function createWidget() {
            if (_.isUndefined(mapElement))
                return;

            function initializeMap() {
                var mapOptions = {
                    zoom: 13,
                    center: new google.maps.LatLng(37.235, -115.811111),
                    disableDefaultUI: true,
                    draggable: false
                };

                map = new google.maps.Map(mapElement[0], mapOptions);

                google.maps.event.addDomListener(mapElement[0], 'mouseenter', function(e) {
                    e.cancelBubble = true;
                    if (!map.hover) {
                        map.hover = true;
                        map.setOptions({
                            zoomControl: true
                        });
                    }
                });

                google.maps.event.addDomListener(mapElement[0], 'mouseleave', function(e) {
                    if (map.hover) {
                        map.setOptions({
                            zoomControl: false
                        });
                        map.hover = false;
                    }
                });

                marker = new google.maps.Marker({
                    map: map
                });

                // map fitting to container
                mapElement.resize(_.debounce(function() {
                    google.maps.event.trigger(mapElement[0], 'resize');
                    updatePosition();
                }, 500));

                updatePosition();
            }

            if (window.google && window.google.maps) {
                initializeMap();
            } else {
                window.gmap_initialize = initializeMap;
                head.js("https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=gmap_initialize");
            }
        }

        this.render = function(element) {
            $(element).append(mapElement);
            setBlocks(currentSettings.blocks);
            createWidget();
        }

        this.onSettingsChanged = function(newSettings) {
            if (_.isNull(map)) {
                currentSettings = newSettings;
                return;
            }
            if (newSettings.blocks != currentSettings.blocks)
                setBlocks(newSettings.blocks);
            currentSettings = newSettings;
        }

        this.onCalculatedValueChanged = function(settingName, newValue) {
            if (settingName == "lat")
                currentPosition.lat = newValue;
            else if (settingName == "lon")
                currentPosition.lon = newValue;

            updatePosition();
        }

        this.onDispose = function() {
            // for memoryleak
            map = null;
            marker = null;
        }

        this.getHeight = function() {
            return currentSettings.blocks;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "google_map",
        display_name: _t('google_map.display_value'),
        fill_size: true,
        settings: [{
            name: "lat",
            display_name: _t('google_map.settings.lat.display_value'),
            validate: "optional,maxSize[2000]",
            type: "calculated",
            description: _t('google_map.settings.lat.description')
        }, {
            name: "lon",
            display_name: _t('google_map.settings.lon.display_value'),
            validate: "optional,maxSize[2000]",
            type: "calculated",
            description: _t('google_map.settings.lon.description')
        }, {
            name: "blocks",
            display_name: _t('google_map.settings.blocks.display_value'),
            validate: "required,custom[integer],min[4],max[20]",
            type: "number",
            style: "width:100px",
            default_value: 4,
            description: _t('google_map.settings.blocks.description')
        }],
        newInstance: function(settings, newInstanceCallback) {
            newInstanceCallback(new googleMapWidget(settings));
        }
    });

    freeboard.addStyle('.html-widget', "white-space:normal;width:100%;height:100%");

    var htmlWidget = function(settings) {
        var self = this;
        var htmlElement = $('<div class="html-widget"></div>');
        var currentSettings = settings;

        this.render = function(element) {
            $(element).append(htmlElement);
        }

        this.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;
        }

        this.onCalculatedValueChanged = function(settingName, newValue) {
            if (settingName == "html") {
                htmlElement.html(newValue);
            }
        }

        this.onDispose = function() {}

        this.getHeight = function() {
            return Number(currentSettings.height);
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        "type_name": "html",
        "display_name": _t('html.display_name'),
        "fill_size": true,
        "settings": [{
            name: "html",
            display_name: _t('html.settings.html.display_name'),
            validate: "optional,maxSize[2000]",
            type: "calculated",
            description: _t('html.settings.html.description')
        }, {
            name: "height",
            display_name: _t('html.settings.height.display_name'),
            validate: "required,custom[integer],min[3],max[20]",
            style: "width:100px",
            type: "number",
            default_value: 4,
            description: _t('html.settings.height.description')
        }],
        newInstance: function(settings, newInstanceCallback) {
            newInstanceCallback(new htmlWidget(settings));
        }
    });
}(jQuery));
