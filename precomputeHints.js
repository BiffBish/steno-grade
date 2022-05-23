console.log("PrecomputeHints.js loaded");

importScripts(
    "utils/type-jig.js",
    "plover-translations.js",
    "spectra/rules.js",
    "spectra/spectra.js"
);

var translations;

var allWords = [];
onmessage = function (e) {
    console.log("Message received from main script. V2", e.data);
    // var workerResult = "Result: " + e.data;
    allWords = e.data.words;
    translations = e.data.translations;
    processAllWords();
};
function lookup(text) {
    for (let index = 0; index < translations.length; index++) {
        const dictionary = translations[index];

        // console.log("Looking up", text, index);

        var strokes = lookupEntry(text, dictionary);
        if (!strokes) {
            text = text.toLowerCase();
            strokes = lookupEntry(text, dictionary);
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
            // console.log("Found", text, strokes);
            var analysisResult = Analyze(strokes, text);
            if (analysisResult?.rules?.length > 0) {
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
    // console.log(dictionary)
    var strokes = dictionary[text] || "";
    // console.log("Strokes", strokes);
    if (!strokes && /^[0-9]+$/.test(text)) {
        strokes = this.numberStrokes(text);
    }
    if (strokes == "") {
        return null;
    }
    if (typeof strokes == "string") {
        return [strokes];
    }
    return strokes?.filter((stroke) => {
        return !stroke.match(/[0-9]/);
    });

    return "";
}

function processAllWords() {
    var results = [];

    for (let index = 0; index < allWords.length; index++) {
        for (var j = 10; j > 0; j--) {
            var subString = allWords.slice(index, index + j).join(" ");
            // console.log("Looking up", subString);
            var lookupResult = this.lookup(subString);
            if (lookupResult == null) {
                continue;
            }
            if (!lookupResult.strokes) {
                // this.errorLog.innerHTML += "No strokes for: " + text + "<br>";
                continue;
            }
            postMessage({
                text: subString,
                lookup: lookupResult,
            });
        }
        // return;
        // }
        // this.set("", true);
        // const word = allWords[index];
        // const result = lookup(word);
        // if (result) {
        //     results.push(result);
        // }
    }
    return results;
}
