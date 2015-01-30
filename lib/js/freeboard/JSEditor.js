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
