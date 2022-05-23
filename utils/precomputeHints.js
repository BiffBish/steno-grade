importScripts(
    "plover-translations.js",
    "utils/type-jig.js",
    "spectra/rules.js"
);

onmessage = function (e) {
    console.log("Message received from main script");
    var workerResult = "Result: " + e.data;
    console.log("Posting message back to main script");
    postMessage(workerResult);
};

var translations = TypeJig.shortestTranslations(TypeJig.Translations.Plover);

function lookup(text) {
    for (let index = 0; index < this.pseudoStenoFor.length; index++) {
        const dictionary = this.pseudoStenoFor[index];

        // console.log("Looking up", text, index);

        var strokes = this.lookupEntry(text, dictionary);
        if (!strokes) {
            text = text.toLowerCase();
            strokes = this.lookupEntry(text, dictionary);
        }

        if (!strokes) {
            //Get the last letter and see if its punctuation
            var lastLetter = text.slice(-1);
            if (lastLetter.match(/[.?,!]/)) {
                text = text.slice(0, -1);
                strokes = this.lookupEntry(text, dictionary);
                if (strokes) {
                    // console.log("Found punctuation", text, strokes, lastLetter);
                    switch (lastLetter) {
                        case ".":
                            strokes = strokes.map((stroke) => {
                                return (stroke += "/TP-PL");
                            });
                            break;
                        case ",":
                            strokes = strokes.map((stroke) => {
                                return (stroke += "/KW-BG");
                            });
                            break;
                        case "?":
                            strokes = strokes.map((stroke) => {
                                return (stroke += "/KW-PL");
                            });
                            break;
                        case "!":
                            strokes = strokes.map((stroke) => {
                                return (stroke += "/TP-BG");
                            });
                            break;
                    }
                    // console.log("Resulting punctuation", strokes);
                }
            }
        }

        // console.log("Found", strokes);
        if (!strokes) {
            continue;
        }
        strokes.sort(function (a, b) {
            var aSlashes = a.split("/").length;
            var bSlashes = b.split("/").length;
            return aSlashes - bSlashes;
        });
        if (true) {
            console.log("Found", text, strokes);
            var analysisResult = Analyze(strokes, text);
            if (analysisResult.outline.length > 0) {
                return {
                    strokes: analysisResult.outline,
                    rules: analysisResult.rules,
                };
            }
            return {
                strokes: strokes,
                rules: [],
            };
        }
        // return { strokes: strokes, rules: null };
    }
    return null;
}

function lookupEntry(text, dictionary) {
    for (let index = 0; index < this.pseudoStenoFor.length; index++) {
        const dictionary = this.pseudoStenoFor[index];
        // console.log(dictionary)
        var strokes = dictionary[text] || "";
        console.log("Strokes", strokes);
        if (!strokes && /^[0-9]+$/.test(text)) {
            strokes = this.numberStrokes(text);
        }
        if (strokes == "") {
            continue;
        }
        if (typeof strokes == "string") {
            return [strokes];
        }
        return strokes?.filter((stroke) => {
            return !stroke.match(/[0-9]/);
        });
    }
    return "";
}
