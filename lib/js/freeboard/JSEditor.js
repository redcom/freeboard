JSEditor = function () {
	var assetRoot = ""

	function setAssetRoot(_assetRoot) {
		assetRoot = _assetRoot;
	}

	function displayJSEditor(value, callback) {

		var exampleText = "// 例: 摂氏から華氏へ変換、小数点2桁以下切り捨て。\n// return (datasources[\"MyDatasource\"].sensor.tempInF * 1.8 + 32).toFixed(2);";

		// If value is empty, go ahead and suggest something
		if (!value) {
			value = exampleText;
		}

		var codeWindow = $('<div class="code-window"></div>');
		var codeMirrorWrapper = $('<div class="code-mirror-wrapper"></div>');
		var codeWindowFooter = $('<div class="code-window-footer"></div>');
		var codeWindowHeader = $('<div class="code-window-header cm-s-ambiance">このJavaScriptは、参照データソースが更新されるたびに再評価されます。そして<span class="cm-keyword">戻り値</span>はウィジェットに表示されます。You can assume this javascript is wrapped in a function of the form <code><span class="cm-keyword">function</span>(<span class="cm-def">datasources</span>)</code> where datasources is a collection of javascript objects (keyed by their name) corresponding to the most current data in a datasource.</div>');

		codeWindow.append([codeWindowHeader, codeMirrorWrapper, codeWindowFooter]);

		$("body").append(codeWindow);

		var codeMirrorEditor = CodeMirror(codeMirrorWrapper.get(0),
			{
				value: value,
				mode: "javascript",
				theme: "ambiance",
				indentUnit: 4,
				lineNumbers: true,
				matchBrackets: true,
				autoCloseBrackets: true
			}
		);

		var closeButton = $('<span id="dialog-cancel" class="text-button">閉じる</span>').click(function () {
			if (callback) {
				var newValue = codeMirrorEditor.getValue();

				if (newValue === exampleText) {
					newValue = "";
				}

				callback(newValue);
				codeWindow.remove();
			}
		});

		codeWindowFooter.append(closeButton);
	}

	// Public API
	return {
		displayJSEditor: function (value, callback) {
			displayJSEditor(value, callback);
		},
		setAssetRoot: function (assetRoot) {
			setAssetRoot(assetRoot)
		}
	}
}
