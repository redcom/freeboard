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

		this.onDispose = function () {
			stopTimer();
		}

		this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;
			if (_.isUndefined(currentSettings.timezone))
				currentSettings.timezone = "Asia/Tokyo";
			updateTimer();
		}

		updateTimer();
	};

	freeboard.loadDatasourcePlugin({
		type_name: "clock",
		display_name: "時計",
		description: "指定の間隔で更新され、異なるフォーマットで現在の時刻を返します。画面上にタイマーを表示したり、ウィジェットが一定の間隔でリフレッシュさせるために使用することができます。",
		settings: [
			{
				name: "timezone",
				display_name: "タイムゾーン",
				type: "option",
				default_value: "Asia/Tokyo",
				options: [
					{
						name: "(UTC-12:00) 国際日付変更線 西側",
						value: "Etc/GMT+12"
					},
					{
						name: "(UTC-11:00) 協定世界時-11",
						value: "Etc/GMT+11"
					},
					{
						name: "(UTC-10:00) ハワイ",
						value: "Pacific/Honolulu"
					},
					{
						name: "(UTC-09:00) アラスカ",
						value: "America/Anchorage"
					},
					{
						name: "(UTC-08:00) バハカリフォルニア",
						value: "America/Santa_Isabel"
					},
					{
						name: "(UTC-08:00) 太平洋標準時(米国およびカナダ)",
						value: "America/Los_Angeles"
					},
					{
						name: "(UTC-07:00) チワワ、ラパス、マサトラン",
						value: "America/Chihuahua"
					},
					{
						name: "(UTC-07:00) アリゾナ",
						value: "America/Phoenix"
					},
					{
						name: "(UTC-07:00) 山地標準時(米国およびカナダ)",
						value: "America/Denver"
					},
					{
						name: "(UTC-06:00) 中央アメリカ",
						value: "America/Guatemala"
					},
					{
						name: "(UTC-06:00) 中部標準時(米国およびカナダ)",
						value: "America/Chicago"
					},
					{
						name: "(UTC-06:00) サスカチュワン",
						value: "America/Regina"
					},
					{
						name: "(UTC-06:00) グアダラハラ、メキシコシティ、モンテレー",
						value: "America/Mexico_City"
					},
					{
						name: "(UTC-05:00) ボゴタ、リマ、キト",
						value: "America/Bogota"
					},
					{
						name: "(UTC-05:00) インディアナ東部",
						value: "America/Indiana/Indianapolis"
					},
					{
						name: "(UTC-05:00) 東部標準時(米国およびカナダ)",
						value: "America/New_York"
					},
					{
						name: "(UTC-04:30) カラカス",
						value: "America/Caracas"
					},
					{
						name: "(UTC-04:00) 大西洋標準時(カナダ)",
						value: "America/Halifax"
					},
					{
						name: "(UTC-04:00) アスンシオン",
						value: "America/Asuncion"
					},
					{
						name: "(UTC-04:00) ジョージタウン、ラパス、マナウス、サンフアン",
						value: "America/La_Paz"
					},
					{
						name: "(UTC-04:00) クイアバ",
						value: "America/Cuiaba"
					},
					{
						name: "(UTC-04:00) サンチアゴ",
						value: "America/Santiago"
					},
					{
						name: "(UTC-03:30) ニューファンドランド",
						value: "America/St_Johns"
					},
					{
						name: "(UTC-03:00) ブラジリア",
						value: "America/Sao_Paulo"
					},
					{
						name: "(UTC-03:00) グリーンランド",
						value: "America/Godthab"
					},
					{
						name: "(UTC-03:00) カイエンヌ、フォルタレザ",
						value: "America/Cayenne"
					},
					{
						name: "(UTC-03:00) ブエノスアイレス",
						value: "America/Argentina/Buenos_Aires"
					},
					{
						name: "(UTC-03:00) モンテビデオ",
						value: "America/Montevideo"
					},
					{
						name: "(UTC-02:00) 協定世界時-2",
						value: "Etc/GMT+2"
					},
					{
						name: "(UTC-01:00) カーボベルデ諸島",
						value: "America/Cape_Verde"
					},
					{
						name: "(UTC-01:00) アゾレス",
						value: "Atlantic/Azores"
					},
					{
						name: "(UTC+00:00) カサブランカ",
						value: "America/Casablanca"
					},
					{
						name: "(UTC+00:00) モンロビア、レイキャビク",
						value: "Atlantic/Reykjavik"
					},
					{
						name: "(UTC+00:00) ダブリン、エジンバラ、リスボン、ロンドン",
						value: "Europe/London"
					},
					{
						name: "(UTC+00:00) 協定世界時",
						value: "Etc/GMT"
					},
					{
						name: "(UTC+01:00) アムステルダム、ベルリン、ベルン、ローマ、ストックホルム、ウィーン",
						value: "Europe/Berlin"
					},
					{
						name: "(UTC+01:00) ブリュッセル、コペンハーゲン、マドリード、パリ",
						value: "Europe/Paris"
					},
					{
						name: "(UTC+01:00) 西中央アフリカ",
						value: "Africa/Lagos"
					},
					{
						name: "(UTC+01:00) ベオグラード、ブラチスラバ、ブダペスト、リュブリャナ、プラハ",
						value: "Europe/Budapest"
					},
					{
						name: "(UTC+01:00) サラエボ、スコピエ、ワルシャワ、ザグレブ",
						value: "Europe/Warsaw"
					},
					{
						name: "(UTC+01:00) ウィントフック",
						value: "Africa/Windhoek"
					},
					{
						name: "(UTC+02:00) アテネ、ブカレスト、イスタンブール",
						value: "Europe/Istanbul"
					},
					{
						name: "(UTC+02:00) ヘルシンキ、キエフ、リガ、ソフィア、タリン、ビリニュス",
						value: "Europe/Kiev"
					},
					{
						name: "(UTC+02:00) カイロ",
						value: "Africa/Cairo"
					},
					{
						name: "(UTC+02:00) ダマスカス",
						value: "Asia/Damascus"
					},
					{
						name: "(UTC+02:00) アンマン",
						value: "Asia/Amman"
					},
					{
						name: "(UTC+02:00) ハラーレ、プレトリア",
						value: "Africa/Johannesburg"
					},
					{
						name: "(UTC+02:00) エルサレム",
						value: "Asia/Jerusalem"
					},
					{
						name: "(UTC+02:00) ベイルート",
						value: "Asia/Beirut"
					},
					{
						name: "(UTC+03:00) バグダッド",
						value: "Asia/Baghdad"
					},
					{
						name: "(UTC+03:00) ミンスク",
						value: "Europe/Minsk"
					},
					{
						name: "(UTC+03:00) クエート、リヤド",
						value: "Asia/Riyadh"
					},
					{
						name: "(UTC+03:00) ナイロビ",
						value: "Africa/Nairobi"
					},
					{
						name: "(UTC+03:30) テヘラン",
						value: "Asia/Tehran"
					},
					{
						name: "(UTC+04:00) モスクワ、サンクトペテルブルグ、ボルゴグラード",
						value: "Europe/Moscow"
					},
					{
						name: "(UTC+04:00) トビリシ",
						value: "Asia/Tbilisi"
					},
					{
						name: "(UTC+04:00) エレバン",
						value: "Asia/Yerevan"
					},
					{
						name: "(UTC+04:00) アブダビ、マスカット",
						value: "Asia/Dubai"
					},
					{
						name: "(UTC+04:00) バクー",
						value: "Asia/Baku"
					},
					{
						name: "(UTC+04:00) ポートルイス",
						value: "Indian/Mauritius"
					},
					{
						name: "(UTC+04:30) カブール",
						value: "Asia/Kabul"
					},
					{
						name: "(UTC+05:00) タシケント",
						value: "Asia/Tashkent"
					},
					{
						name: "(UTC+05:00) イスラマバード、カラチ",
						value: "Asia/Karachi"
					},
					{
						name: "(UTC+05:30) スリジャヤワルダナプラコッテ",
						value: "Asia/Colombo"
					},
					{
						name: "(UTC+05:30) チェンナイ、コルカタ、ムンバイ、ニューデリー",
						value: "Indian/Kolkata"
					},
					{
						name: "(UTC+05:45) カトマンズ",
						value: "Asia/Kathmandu"
					},
					{
						name: "(UTC+06:00) アスタナ",
						value: "Asia/Almaty"
					},
					{
						name: "(UTC+06:00) ダッカ",
						value: "Asia/Dhaka"
					},
					{
						name: "(UTC+06:00) エカテリンブルグ",
						value: "Asia/Yekaterinburg"
					},
					{
						name: "(UTC+06:30) ヤンゴン(ラングーン)",
						value: "Asia/Rangoon"
					},
					{
						name: "(UTC+07:00) バンコク、ハノイ、ジャカルタ",
						value: "Asia/Bangkok"
					},
					{
						name: "(UTC+07:00) ノヴォシビルスク",
						value: "Asia/Novosibirsk"
					},
					{
						name: "(UTC+08:00) クラスノヤルスク",
						value: "Asia/Krasnoyarsk"
					},
					{
						name: "(UTC+08:00) ウランバートル",
						value: "Asia/Ulaanbaatar"
					},
					{
						name: "(UTC+08:00) 北京、重慶、香港特別行政区、ウルムチ",
						value: "Asia/Shanghai"
					},
					{
						name: "(UTC+08:00) パース",
						value: "Australia/Perth"
					},
					{
						name: "(UTC+08:00) クアラルンプール、シンガポール",
						value: "Asia/Singapore"
					},
					{
						name: "(UTC+08:00) 台北",
						value: "Asia/Taipei"
					},
					{
						name: "(UTC+09:00) イルクーツク",
						value: "Asia/Irkutsk"
					},
					{
						name: "(UTC+09:00) ソウル",
						value: "Asia/Seoul"
					},
					{
						name: "(UTC+09:00) 大阪、札幌、東京",
						value: "Asia/Tokyo"
					},
					{
						name: "(UTC+09:30) ダーウィン",
						value: "Australia/Darwin"
					},
					{
						name: "(UTC+09:30) アデレード",
						value: "Australia/Adelaide"
					},
					{
						name: "(UTC+10:00) ホバート",
						value: "Australia/Hobart"
					},
					{
						name: "(UTC+10:00) ヤクーツク",
						value: "Asia/Yakutsk"
					},
					{
						name: "(UTC+10:00) ブリスベン",
						value: "Australia/Brisbane"
					},
					{
						name: "(UTC+10:00) グアム、ポートモレスビー",
						value: "Pacific/Port_Moresby"
					},
					{
						name: "(UTC+10:00) キャンベラ、メルボルン、シドニー",
						value: "Australia/Sydney"
					},
					{
						name: "(UTC+11:00) ウラジオストク",
						value: "Asia/Vladivostok"
					},
					{
						name: "(UTC+11:00) ソロモン諸島、ニューカレドニア",
						value: "Pacific/Guadalcanal"
					},
					{
						name: "(UTC+12:00) 協定世界時+12",
						value: "Etc/GMT-12"
					},
					{
						name: "(UTC+12:00) フィジー、マーシャル諸島",
						value: "Pacific/Fiji"
					},
					{
						name: "(UTC+12:00) マガダン",
						value: "Asia/Magadan"
					},
					{
						name: "(UTC+12:00) オークランド、ウェリントン",
						value: "Pacific/Auckland"
					},
					{
						name: "(UTC+13:00) ヌクアロファ",
						value: "Pacific/Tongatapu"
					},
					{
						name: "(UTC+13:00) サモア",
						value: "Pacific/Apia"
					}
				]
			},
			{
				name: "refresh",
				display_name: "更新頻度",
				validate: "required,custom[integer],min[1]",
				style: "width:100px",
				type: "number",
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
				type: "number",
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
				default_value: "metric",
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
				type: "number",
				suffix: "秒",
				default_value: 5
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new openWeatherMapDatasource(settings, updateCallback));
		}
	});

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
				type: "number",
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
				type: "number",
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