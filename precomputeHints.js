console.log("PrecomputeHints.js loaded");

importScripts(
    "type-jig.js",
    "plover-translations.js",
    "spectra/rules.js",
    "spectra/spectra.js"
);

var translations;

var allWords = [];
var options;
onmessage = function (e) {
    console.log("Message received from main script. V2", e.data);
    // var workerResult = "Result: " + e.data;
    allWords = e.data.words;
    translations = e.data.translations;
    options = e.data.options;

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
            //Time to process Punctuation

            //Loop through the keys and values of the dictionary
            let addStrokeBefore = "";
            let addStrokeAfter = "";

            let addSymbolBefore = "";
            let addSymbolAfter = "";
            for (var key in PloverPunctuation) {
                // console.log("Checking", key, PloverPunctuation[key]);
                let value = PloverPunctuation[key];
                if (key.length > 1 && key.startsWith("-")) {
                    key = key.substring(1);
                    if (text.endsWith(key)) {
                        addStrokeAfter = value;
                        addSymbolAfter = key;

                        text = text.substring(0, text.length - key.length);
                    }
                }

                if (key.length > 1 && key.endsWith("-")) {
                    key = key.substring(0, key.length - 1);
                    if (text.startsWith(key)) {
                        addStrokeBefore = value;
                        addSymbolBefore = key;

                        text = text.substring(key.length);
                    }
                }

                if (text.startsWith(key)) {
                    addStrokeBefore = value;
                    addSymbolBefore = key;

                    text = text.substring(key.length);
                }

                if (text.endsWith(key)) {
                    addStrokeAfter = value;
                    addSymbolAfter = key;

                    text = text.substring(0, text.length - key.length);
                }
            }
            // console.log("Punctuation", text, addStrokeBefore, addStrokeAfter);
            strokes = this.lookupEntry(text, dictionary);
            if (!strokes) {
                continue;
            }

            if (addStrokeBefore) {
                strokes = strokes.map((text) => addStrokeBefore + "/" + text);
            }
            if (addStrokeAfter) {
                strokes = strokes.map((text) => text + "/" + addStrokeAfter);
            }

            if (addSymbolBefore) {
                text = addSymbolBefore + text;
            }
            if (addSymbolAfter) {
                text = text + addSymbolAfter;
            }

            //Get the last letter and see if its punctuation
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
var stenoNumKeyOrder = "#123450I6789D";

function cmpStenoNumKeys(a, b) {
    return stenoNumKeyOrder.indexOf(a) - stenoNumKeyOrder.indexOf(b);
}
function numberStrokes(text) {
    var keys = {
        1: "S",
        2: "T",
        3: "P",
        4: "H",
        5: "A",
        0: "O",
        6: "F",
        7: "P",
        8: "L",
        9: "T",
    };
    var strokes = "",
        stroke = [];
    for (var i = 0; i < text.length; i += 2) {
        if (strokes !== "") strokes += "/";
        stroke = text.slice(i, i + 2).split("");
        if (stroke.length === 1) {
            strokes += "#" + (stroke[0] > 5 ? "-" : "") + keys[stroke[0]];
        } else {
            if (stroke[0] === stroke[1]) stroke[1] = "D";
            else if (cmpStenoNumKeys(stroke[0], stroke[1]) > 0)
                stroke.push("I");
            stroke.sort(cmpStenoNumKeys);
            var right;
            right = false;
            stroke = stroke.map(function (x) {
                var out = keys[x] || x;
                if ("AOEUI".indexOf(out) !== -1) right = true;
                if ((out === "D" || +x > 5) && !right) {
                    out = "-" + out;
                    right = true;
                }
                return out;
            });
            strokes += "#" + stroke.join("");
        }
    }
    return strokes;
}
function lookupEntry(text, dictionary) {
    // console.log(dictionary)
    var strokes = dictionary[text] || "";
    // console.log("Strokes", strokes);
    if (!strokes && /^[0-9]+$/.test(text)) {
        strokes = numberStrokes(text);
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
            var lookupResult = lookup(subString);
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
