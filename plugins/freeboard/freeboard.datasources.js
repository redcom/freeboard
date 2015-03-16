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
(function($) {

    var _t = function(str) {
        return $.i18n.t('plugins.datasource.' + str);
    };

    var clockDatasource = function(settings, updateCallback) {
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

        this.updateNow = function() {
            var now = moment().tz(currentSettings.timezone);

            var data = {
                numeric_value: now.unix(),
                full_string_value: now.format("YYYY/MM/DD hh:mm:ss"),
                date_string_value: now.format("YYYY/MM/DD"),
                time_string_value: now.format("hh:mm:ss"),
                date_object: now.toDate()
            };

            updateCallback(data);
        }

        this.onDispose = function() {
            stopTimer();
        }

        this.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;
            if (_.isUndefined(currentSettings.timezone))
                currentSettings.timezone = "Asia/Tokyo";
            updateTimer();
        }

        updateTimer();
    };

    freeboard.loadDatasourcePlugin({
        type_name: "clock",
        display_name: _t('clock.title'),
        description: _t('clock,description'),
        settings: [{
            name: "timezone",
            display_name: _t('clock.zones.title'),
            type: "option",
            default_value: "Asia/Tokyo",
            options: [{
                name: _t('clock.zones.options.utc-12'),
                value: "Etc/GMT+12"
            }, {
                name: _t('clock.zones.options.utc-11'),
                value: "Etc/GMT+11"
            }, {
                name: _t('clock.zones.options.utc-10'),
                value: "Pacific/Honolulu"
            }, {
                name: _t('clock.zones.options.utc-09'),
                value: "America/Anchorage"
            }, {
                name: _t('clock.zones.options.utc-08-1'),
                value: "America/Santa_Isabel"
            }, {
                name: _t('clock.zones.options.utc-08-2'),
                value: "America/Los_Angeles"
            }, {
                name: _t('clock.zones.options.utc-07-1'),
                value: "America/Chihuahua"
            }, {
                name: _t('clock.zones.options.utc-07-2'),
                value: "America/Phoenix"
            }, {
                name: _t('clock.zones.options.utc-07-3'),
                value: "America/Denver"
            }, {
                name: _t('clock.zones.options.utc-06-1'),
                value: "America/Guatemala"
            }, {
                name: _t('clock.zones.options.utc-06-2'),
                value: "America/Chicago"
            }, {
                name: _t('clock.zones.options.utc-06-3'),
                value: "America/Regina"
            }, {
                name: _t('clock.zones.options.utc-06-4'),
                value: "America/Mexico_City"
            }, {
                name: _t('clock.zones.options.utc-05-1'),
                value: "America/Bogota"
            }, {
                name: _t('clock.zones.options.utc-05-2'),
                value: "America/Indiana/Indianapolis"
            }, {
                name: _t('clock.zones.options.utc-05-3'),
                value: "America/New_York"
            }, {
                name: _t('clock.zones.options.utc-0403'),
                value: "America/Caracas"
            }, {
                name: _t('clock.zones.options.utc-04-1'),
                value: "America/Halifax"
            }, {
                name: _t('clock.zones.options.utc-04-2'),
                value: "America/Asuncion"
            }, {
                name: _t('clock.zones.options.utc-04-3'),
                value: "America/La_Paz"
            }, {
                name: _t('clock.zones.options.utc-04-4'),
                value: "America/Cuiaba"
            }, {
                name: _t('clock.zones.options.utc-04-5'),
                value: "America/Santiago"
            }, {
                name: _t('clock.zones.options.utc-0330'),
                value: "America/St_Johns"
            }, {
                name: _t('clock.zones.options.utc-03-1'),
                value: "America/Sao_Paulo"
            }, {
                name: _t('clock.zones.options.utc-03-2'),
                value: "America/Godthab"
            }, {
                name: _t('clock.zones.options.utc-03-3'),
                value: "America/Cayenne"
            }, {
                name: _t('clock.zones.options.utc-03-4'),
                value: "America/Argentina/Buenos_Aires"
            }, {
                name: _t('clock.zones.options.utc-03-5'),
                value: "America/Montevideo"
            }, {
                name: _t('clock.zones.options.utc-02'),
                value: "Etc/GMT+2"
            }, {
                name: _t('clock.zones.options.utc-01-1'),
                value: "America/Cape_Verde"
            }, {
                name: _t('clock.zones.options.utc-01-2'),
                value: "Atlantic/Azores"
            }, {
                name: _t('clock.zones.options.utc-00-1'),
                value: "America/Casablanca"
            }, {
                name: _t('clock.zones.options.utc-00-2'),
                value: "Atlantic/Reykjavik"
            }, {
                name: _t('clock.zones.options.utc-00-3'),
                value: "Europe/London"
            }, {
                name: _t('clock.zones.options.utc-00-4'),
                value: "Etc/GMT"
            }, {
                name: _t('clock.zones.options.utc+01-1'),
                value: "Europe/Berlin"
            }, {
                name: _t('clock.zones.options.utc+01-2'),
                value: "Europe/Paris"
            }, {
                name: _t('clock.zones.options.utc+01-3'),
                value: "Africa/Lagos"
            }, {
                name: _t('clock.zones.options.utc+01-4'),
                value: "Europe/Budapest"
            }, {
                name: _t('clock.zones.options.utc+01-5'),
                value: "Europe/Warsaw"
            }, {
                name: _t('clock.zones.options.utc+01-6'),
                value: "Africa/Windhoek"
            }, {
                name: _t('clock.zones.options.utc+02-1'),
                value: "Europe/Istanbul"
            }, {
                name: _t('clock.zones.options.utc+02-2'),
                value: "Europe/Kiev"
            }, {
                name: _t('clock.zones.options.utc+02-3'),
                value: "Africa/Cairo"
            }, {
                name: _t('clock.zones.options.utc+02-4'),
                value: "Asia/Damascus"
            }, {
                name: _t('clock.zones.options.utc+02-5'),
                value: "Asia/Amman"
            }, {
                name: _t('clock.zones.options.utc+02-6'),
                value: "Africa/Johannesburg"
            }, {
                name: _t('clock.zones.options.utc+02-7'),
                value: "Asia/Jerusalem"
            }, {
                name: _t('clock.zones.options.utc+02-8'),
                value: "Asia/Beirut"
            }, {
                name: _t('clock.zones.options.utc+03-1'),
                value: "Asia/Baghdad"
            }, {
                name: _t('clock.zones.options.utc+03-2'),
                value: "Europe/Minsk"
            }, {
                name: _t('clock.zones.options.utc+03-3'),
                value: "Asia/Riyadh"
            }, {
                name: _t('clock.zones.options.utc+03-4'),
                value: "Africa/Nairobi"
            }, {
                name: _t('clock.zones.options.utc+0330'),
                value: "Asia/Tehran"
            }, {
                name: _t('clock.zones.options.utc+04-1'),
                value: "Europe/Moscow"
            }, {
                name: _t('clock.zones.options.utc+04-2'),
                value: "Asia/Tbilisi"
            }, {
                name: _t('clock.zones.options.utc+04-3'),
                value: "Asia/Yerevan"
            }, {
                name: _t('clock.zones.options.utc+04-4'),
                value: "Asia/Dubai"
            }, {
                name: _t('clock.zones.options.utc+04-5'),
                value: "Asia/Baku"
            }, {
                name: _t('clock.zones.options.utc+04-6'),
                value: "Indian/Mauritius"
            }, {
                name: _t('clock.zones.options.utc+0430'),
                value: "Asia/Kabul"
            }, {
                name: _t('clock.zones.options.utc+05-1'),
                value: "Asia/Tashkent"
            }, {
                name: _t('clock.zones.options.utc+05-2'),
                value: "Asia/Karachi"
            }, {
                name: _t('clock.zones.options.utc+0530-1'),
                value: "Asia/Colombo"
            }, {
                name: _t('clock.zones.options.utc+0530-2'),
                value: "Indian/Kolkata"
            }, {
                name: _t('clock.zones.options.utc+0545'),
                value: "Asia/Kathmandu"
            }, {
                name: _t('clock.zones.options.utc+06-1'),
                value: "Asia/Almaty"
            }, {
                name: _t('clock.zones.options.utc+06-2'),
                value: "Asia/Dhaka"
            }, {
                name: _t('clock.zones.options.utc+06-3'),
                value: "Asia/Yekaterinburg"
            }, {
                name: _t('clock.zones.options.utc+0630'),
                value: "Asia/Rangoon"
            }, {
                name: _t('clock.zones.options.utc+07-1'),
                value: "Asia/Bangkok"
            }, {
                name: _t('clock.zones.options.utc+07-2'),
                value: "Asia/Novosibirsk"
            }, {
                name: _t('clock.zones.options.utc+08-1'),
                value: "Asia/Krasnoyarsk"
            }, {
                name: _t('clock.zones.options.utc+08-2'),
                value: "Asia/Ulaanbaatar"
            }, {
                name: _t('clock.zones.options.utc+08-3'),
                value: "Asia/Shanghai"
            }, {
                name: _t('clock.zones.options.utc+08-4'),
                value: "Australia/Perth"
            }, {
                name: _t('clock.zones.options.utc+08-5'),
                value: "Asia/Singapore"
            }, {
                name: _t('clock.zones.options.utc+08-6'),
                value: "Asia/Taipei"
            }, {
                name: _t('clock.zones.options.utc+09-1'),
                value: "Asia/Irkutsk"
            }, {
                name: _t('clock.zones.options.utc+09-2'),
                value: "Asia/Seoul"
            }, {
                name: _t('clock.zones.options.utc+09-3'),
                value: "Asia/Tokyo"
            }, {
                name: _t('clock.zones.options.utc+0930-1'),
                value: "Australia/Darwin"
            }, {
                name: _t('clock.zones.options.utc+0930-2'),
                value: "Australia/Adelaide"
            }, {
                name: _t('clock.zones.options.utc+10-1'),
                value: "Australia/Hobart"
            }, {
                name: _t('clock.zones.options.utc+10-2'),
                value: "Asia/Yakutsk"
            }, {
                name: _t('clock.zones.options.utc+10-3'),
                value: "Australia/Brisbane"
            }, {
                name: _t('clock.zones.options.utc+10-4'),
                value: "Pacific/Port_Moresby"
            }, {
                name: _t('clock.zones.options.utc+10-5'),
                value: "Australia/Sydney"
            }, {
                name: _t('clock.zones.options.utc+11-1'),
                value: "Asia/Vladivostok"
            }, {
                name: _t('clock.zones.options.utc+11-2'),
                value: "Pacific/Guadalcanal"
            }, {
                name: _t('clock.zones.options.utc+12-1'),
                value: "Etc/GMT-12"
            }, {
                name: _t('clock.zones.options.utc+12-2'),
                value: "Pacific/Fiji"
            }, {
                name: _t('clock.zones.options.utc+12-3'),
                value: "Asia/Magadan"
            }, {
                name: _t('clock.zones.options.utc+12-4'),
                value: "Pacific/Auckland"
            }, {
                name: _t('clock.zones.options.utc+13-1'),
                value: "Pacific/Tongatapu"
            }, {
                name: _t('clock.zones.options.utc+13-2'),
                value: "Pacific/Apia"
            }]
        }, {
            name: "refresh",
            display_name: _t('refresh'),
            validate: "required,custom[integer],min[1]",
            style: "width:100px",
            type: "number",
            suffix: "秒",
            default_value: 1
        }],
        newInstance: function(settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new clockDatasource(settings, updateCallback));
        }
    });

    var jsonWebSocketDatasource = function(settings, updateCallback) {
        var self = this;
        var currentSettings = settings;
        var ws;

        var onOpen = function() {
            console.info("WebSocket(%s) Opened", currentSettings.url);
        }

        var onClose = function() {
            console.info("WebSocket Closed");
        }

        var onMessage = function(event) {
            var data = event.data;

            console.info("WebSocket received %s", data);

            var objdata = JSON.parse(data);

            if (typeof objdata == "object") {
                updateCallback(objdata);
            } else {
                updateCallback(data);
            }

        }

            function createWebSocket() {
                if (ws) {
                    ws.close();
                }

                var url = currentSettings.url;
                ws = new WebSocket(url);

                ws.onopen = onOpen;
                ws.onclose = onClose;
                ws.onmessage = onMessage;
            }

        createWebSocket();

        this.updateNow = function() {
            createWebSocket();
        }

        this.onDispose = function() {
            ws.close();
        }

        this.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;

            createWebSocket();
        }
    };

    var jsonDatasource = function(settings, updateCallback) {
        var self = this;
        var updateTimer = null;
        var currentSettings = settings;
        var errorStage = 0; // 0 = try standard request
        // 1 = try JSONP
        // 2 = try thingproxy.freeboard.io
        var lockErrorStage = false;

        function updateRefresh(refreshTime) {
            if (updateTimer) {
                clearInterval(updateTimer);
            }

            updateTimer = setInterval(function() {
                self.updateNow();
            }, refreshTime);
        }

        updateRefresh(currentSettings.refresh * 1000);

        this.updateNow = function() {
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
                } catch (e) {}
            }

            $.ajax({
                url: requestURL,
                dataType: (errorStage == 1) ? "JSONP" : "JSON",
                type: currentSettings.method || "GET",
                data: body,
                beforeSend: function(xhr) {
                    try {
                        _.each(currentSettings.headers, function(header) {
                            var name = header.name;
                            var value = header.value;

                            if (!_.isUndefined(name) && !_.isUndefined(value)) {
                                xhr.setRequestHeader(name, value);
                            }
                        });
                    } catch (e) {}
                },
                success: function(data) {
                    lockErrorStage = true;
                    updateCallback(data);
                },
                error: function(xhr, status, error) {
                    if (!lockErrorStage) {
                        // TODO: Figure out a way to intercept CORS errors only. The error message for CORS errors seems to be a standard 404.
                        errorStage++;
                        self.updateNow();
                    }
                }
            });
        }

        this.onDispose = function() {
            clearInterval(updateTimer);
            updateTimer = null;
        }

        this.onSettingsChanged = function(newSettings) {
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
        description: _t('json.description'),
        settings: [{
            name: "url",
            display_name: "URL",
            validate: "required,custom[url]",
            type: "text"
        }, {
            name: "use_thingproxy",
            display_name: _t('json.use_proxy_name'),
            description: _t('json.use_proxy_description'),
            type: "boolean",
            default_value: true
        }, {
            name: "refresh",
            display_name: _t('refresh'),
            validate: "required,custom[integer],min[1]",
            style: "width:100px",
            type: "number",
            suffix: _t('json.sufix'),
            default_value: 5
        }, {
            name: "method",
            display_name: _t('json.method'),
            type: "option",
            style: "width:200px",
            options: [{
                name: "GET",
                value: "GET"
            }, {
                name: "POST",
                value: "POST"
            }, {
                name: "PUT",
                value: "PUT"
            }, {
                name: "DELETE",
                value: "DELETE"
            }]
        }, {
            name: "body",
            display_name: "Body",
            type: "json",
            validate: "optional,maxSize[2000]",
            description: _t('json.body_description')
        }, {
            name: "headers",
            display_name: "Header",
            type: "array",
            settings: [{
                name: "name",
                display_name: _t('json.header_name_name'),
                type: "text",
                validate: "optional,maxSize[500]",
                description: _t('json.header__name_description')
            }, {
                name: "value",
                display_name: _t('json.header_value_name'),
                type: "text",
                validate: "optional,maxSize[500]",
                description: _t('json.header_value_description')
            }]
        }],
        newInstance: function(settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new jsonDatasource(settings, updateCallback));
        }
    });

    var openWeatherMapDatasource = function(settings, updateCallback) {
        var self = this;
        var updateTimer = null;
        var currentSettings = settings;

        function updateRefresh(refreshTime) {
            if (updateTimer) {
                clearInterval(updateTimer);
            }

            updateTimer = setInterval(function() {
                self.updateNow();
            }, refreshTime);
        }

        function toTitleCase(str) {
            return str.replace(/\w\S*/g, function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }

        updateRefresh(currentSettings.refresh * 1000);

        this.updateNow = function() {
            $.ajax({
                url: "http://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(currentSettings.location) + "&units=" + currentSettings.units,
                dataType: "JSONP",
                success: function(data) {
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
                error: function(xhr, status, error) {}
            });
        }

        this.onDispose = function() {
            clearInterval(updateTimer);
            updateTimer = null;
        }

        this.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;
            self.updateNow();
            updateRefresh(currentSettings.refresh * 1000);
        }
    };

    freeboard.loadDatasourcePlugin({
        type_name: "openweathermap",
        display_name: _t('openweathermap.display_name'),
        description: _t('openweathermap.description'),
        settings: [{
            name: "location",
            display_name: _t('openweathermap.settings.location_name'),
            validate: "required,maxSize[200]",
            type: "text",
            description: _t('openweathermap.settings.location_description')
        }, {
            name: "units",
            display_name: _t('openweathermap.settings.unit_name'),
            style: "width:200px",
            type: "option",
            default_value: "metric",
            options: [{
                name: _t('openweathermap.settings.unit_metric'),
                value: "metric"
            }, {
                name: _t('openweathermap.settings.unit_imperial'),
                value: "imperial"
            }]
        }, {
            name: "refresh",
            display_name: _t('refresh'),
            validate: "required,custom[integer],min[1]",
            style: "width:100px",
            type: "number",
            suffix: _t('sufix'),
            default_value: 5
        }],
        newInstance: function(settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new openWeatherMapDatasource(settings, updateCallback));
        }
    });

    freeboard.loadDatasourcePlugin({
        "type_name": "playback",
        "display_name": _t('playback.name'),
        "description": _t('playback.description'),
        "settings": [{
            name: "datafile",
            display_name: _t('playback.settins.data_namne'),
            validate: "required,custom[url]",
            type: "text",
            description: _t('playback.settings.datafile_description')
        }, {
            name: "is_jsonp",
            display_name: _t('playback.settings.is_json'),
            type: "boolean"
        }, {
            name: "loop",
            display_name: _t('playback.settings.loop_name'),
            type: "boolean",
            description: _t('playback.settings.loop_description')
        }, {
            name: "refresh",
            display_name: _t('refresh'),
            validate: "required,custom[integer],min[1]",
            style: "width:100px",
            type: "number",
            suffix: _t('sufix'),
            default_value: 5
        }],
        newInstance: function(settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new playbackDatasource(settings, updateCallback));
        }
    });

    freeboard.loadDatasourcePlugin({
        type_name: "JSON WebSocket",
        display_name: _t('json_websocket.name'),
        description: _t('json_websocket.description'),
        settings: [{
            name: "url",
            display_name: _t('json_websocket.settings.url_name'),
            validate: "required,maxSize[1000]",
            type: "text",
            description: _t('json_websocket.url_description')
        }],
        newInstance: function(settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new jsonWebSocketDatasource(settings, updateCallback));
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
            self.socket = io.connect(self.url, {
                'forceNew': true
            });

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
        type_name: "node_js",
        display_name: _t('node_js.name'),
        description: _t('node_js.description'),
        external_scripts: ["https://cdn.socket.io/socket.io-1.2.1.js"],
        settings: [{
            name: "url",
            display_name: _t('node_js.settings.url_name'),
            validate: "required,maxSize[1000]",
            type: "text",
            description: _t('node_js.settings.url_description')
        }, {
            name: "events",
            display_name: _t('node_js.settings.events_name'),
            description: _t('node_js.settings.events_description'),
            type: "array",
            settings: [{
                name: "eventName",
                display_name: _t('node_js.settings.events_options_1'),
                validate: "optional,maxSize[100]",
                type: "text"
            }]
        }, {
            name: "rooms",
            display_name: _t('node_js.settings.rooms_name'),
            description: _t('node_js.settings.rooms_descriptions'),
            type: "array",
            settings: [{
                name: "roomName",
                display_name: _t('node_js.settings.rooms_settings_name'),
                validate: "optional,maxSize[100]",
                type: "text"
            }, {
                name: "roomEvent",
                display_name: _t('node_js.settings.rooms_settings_event_name'),
                validate: "optional,maxSize[100]",
                type: "text"
            }]
        }],
        newInstance: function(settings, newInstanceCallback, updateCallback) {
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
            console.info("MQTT Received %s from %s", message, currentSettings.url);

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
        type_name: "mqtt",
        display_name: _t('mqtt.display_name'),
        description: _t('mqtt.description')
        external_scripts: ["plugins/thirdparty/mqttws31.js"],
        settings: [{
            name: "url",
            display_name: _t('mqtt.settings.url.display_name'),
            validate: "required,maxSize[1000]",
            type: "text",
            description: _t('mqtt.settings.url.description')
        }, {
            name: "port",
            display_name: _t('mqtt.settings.port.display_name'),
            validate: "required,custom[integer],min[1]",
            type: "number",
            style: "width:100px",
            default_value: 8080
        }, {
            name: "clientID",
            display_name: _t('mqtt.settings.clientID.display_name'),
            validate: "required,maxSize[23]",
            type: "text",
            description: _t('mqtt.settings.clientID.description')
            default_value: "SensorCorpus"
        }, {
            name: "topic",
            display_name: _t('mqtt.settings.topic.display_name'),
            validate: "required,maxSize[500]",
            type: "text",
            description: _t('mqtt.settings.topic.description')
            default_value: ""
        }, {
            name: "username",
            display_name: _t('mqtt.settings.username.display_name'),
            validate: "optional,maxSize[100]",
            type: "text",
            description: _t('mqtt.settings.username.description')
        }, {
            name: "password",
            display_name: _t('mqtt.settings.password.display_name'),
            validate: "optional,maxSize[100]",
            type: "text",
            description: _t('mqtt.settings.password.description')
        }, {
            name: "reconnect",
            display_name: _t('mqtt.settings.reconnect.display_name'),
            type: "boolean",
            description: _t('mqtt.settings.reconnect.description')
            default_value: true
        }],
        newInstance: function(settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new mqttDatasource(settings, updateCallback));
        }
    })
}(jQuery));
