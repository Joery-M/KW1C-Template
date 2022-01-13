import { ConfigurationChangeEvent, window, DecorationOptions, Range, workspace, WorkspaceConfiguration, ExtensionContext } from "vscode";

export function colorize(context: ExtensionContext) {
    var config = workspace.getConfiguration("kw1c-template");
    workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
		config = workspace.getConfiguration("kw1c-template");
	});
    
	let timeout: NodeJS.Timer | undefined = undefined;

	const nonDesriptionDeco = window.createTextEditorDecorationType({
        dark: {
			color: "#686f7d"
		},
		light: {
			color: "#785e2a"
		},
		fontStyle: "normal",
		fontWeight: "normal"
	});

	const descriptionDeco = window.createTextEditorDecorationType({
		dark: {
			color: "#bbbcbd",
		},
		light: {
			color: "#424242"
		},
		fontStyle: "normal"
	});
    const identifierDeco = window.createTextEditorDecorationType({
        dark: {
			color: "#7e818a"
		},
		light: {
			color: "#8b8585"
		},
        fontWeight: "bold",
		fontStyle: "normal"
	});

	let activeEditor = window.activeTextEditor;

	function updateDecorations() {
		if (!activeEditor || config.colorModuleHeader == false) {
			return;
		}
        const text = activeEditor.document.getText();
		var regEx;
		if (activeEditor.document.languageId == "html") {
			regEx = new RegExp(/(?=^<!--\r|\n|.)+(?:.)+(Auteur: |Aanmaakdatum: |Omschrijving: )(.*)(?=(\r|\n|.)*?-->)/g)
		} else if (["css", "javascript"].includes(activeEditor.document.languageId)) {
			regEx = new RegExp(/(?=(\/\*\r|\n|.))+(?:.)+(Auteur: |Aanmaakdatum: |Omschrijving: )(.*)(?=(.|\r|\n)*(\*\/))/g)
		} else {
			return;
		}
		const nonDescriptionText: DecorationOptions[] = [];
		const descriptionText: DecorationOptions[] = [];
		const identifierText: DecorationOptions[] = [];
		let match;
		while ((match = regEx.exec(text))) {
            // For identifier text
            var startPos = activeEditor.document.positionAt(match.index)
            var endPos = activeEditor.document.positionAt( match.index + match[0].split(": ")[0].length+2 )
            var newRange = new Range(startPos, endPos)
            var decoration = { range: newRange }
            identifierText.push(decoration);
			if (match[0].startsWith("    Omschrijving: ")) {
                var startPos = activeEditor.document.positionAt(match.index + match[0].split(": ")[0].length+2)
                var endPos = activeEditor.document.positionAt( match.index + match[0].length)
                var newRange = new Range(startPos, endPos)
                var decoration = { range: newRange }
				descriptionText.push(decoration);
			} else {
                var startPos = activeEditor.document.positionAt(match.index + match[0].split(": ")[0].length+2);
                var endPos = activeEditor.document.positionAt(match.index + match[0].length);
                var decoration = { range: new Range(startPos, endPos)};
				nonDescriptionText.push(decoration);
			}

			// Opening comment
			var startPos = activeEditor.document.positionAt(0)
            var endPos = activeEditor.document.positionAt( match.index )
            var newRange = new Range(startPos, endPos)
            var decoration = { range: newRange }
			identifierText.push(decoration)

			// Closing comment
			var commentLength = 5
			if (["css", "javascript"].includes(activeEditor.document.languageId)) {
				commentLength = 4
			}
			var startPos = activeEditor.document.positionAt( match.index + match[0].length)
            var endPos = activeEditor.document.positionAt( (match.index + match[0].length) + commentLength )
            var newRange = new Range(startPos, endPos)
            var decoration = { range: newRange }
			identifierText.push(decoration)

		}
		activeEditor.setDecorations(nonDesriptionDeco, nonDescriptionText);
		activeEditor.setDecorations(descriptionDeco, descriptionText);
		activeEditor.setDecorations(identifierDeco, identifierText);
	}

	function triggerUpdateDecorations(throttle: boolean = false) {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		if (throttle) {
			timeout = setTimeout(updateDecorations, 100);
		} else {
			updateDecorations();
		}
	}

	if (activeEditor) {
		triggerUpdateDecorations();
	}

	window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations(true);
		}
	}, null, context.subscriptions);
}