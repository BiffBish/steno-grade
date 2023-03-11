/* eslint-disable guard-for-in */


//@ts-ignore


console.log("PrecomputeHints.js loaded");

importScripts("./spectra/spectra.js");

// // let analyze = null;
// import("./spectra/spectra.mjs").then((spectra) => {
//     console.log("Spectra loaded", spectra);
//     // console.log("Spectra loaded", spectra);
//     analyze = spectra.analyze;
// });


let translations;
let punctuation;
let allWords = [];
onmessage = function(e) {
    console.log("Message received from main script. V2", e.data);
    allWords = e.data.words;
    translations = e.data.translations;
    punctuation = e.data.punctuation;
    options = e.data.options;

    processAllWords();
};

function compute(data) {
    console.log("Message received from main script. V2", data);
    allWords = data.words;
    translations = data.translations;
    options = data.options;

    processAllWords();
}

/**
 * @param {*} text
 * @return {import("./spectra/spectra").AnalyzeResult | null}
 */
function lookup(text) {
    for (const element of translations) {
        const dictionary = element;

        let strokes = lookupEntry(text, dictionary);
        if (!strokes) {
            strokes = lookupEntry(text.toLowerCase(), dictionary);
        }

        if (!strokes) {
            // Time to process Punctuation

            // Loop through the keys and values of the dictionary
            let addStrokeBefore = "";
            let addStrokeAfter = "";

            let addSymbolBefore = "";
            let addSymbolAfter = "";
            for (let key in punctuation) {
                // console.log("Checking", key, PloverPunctuation[key]);
                const value = punctuation[key];
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
            strokes = lookupEntry(text, dictionary);
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

            // Get the last letter and see if its punctuation
        }

        // console.log("Found", strokes);

        if (!strokes) {
            continue;
        }
        strokes.sort(function(a, b) {
            const aSlashes = a.split("/").length;
            const bSlashes = b.split("/").length;
            return aSlashes - bSlashes;
        });
        // console.log("Found", text, strokes);
        const analysisResult = _analyze(strokes, text.toLowerCase());
        if (analysisResult?.[0]?.res?.rules?.length > 0) {
            return analysisResult;
        }
        return [
            {
                title: "Unknown",
                // @ts-ignore
                res: {
                    outline: strokes[0],
                    rules: [],
                },
            },
        ];
    }
    return null;
}
const stenoNumKeyOrder = "#123450I6789D";

function cmpStenoNumKeys(a, b) {
    return stenoNumKeyOrder.indexOf(a) - stenoNumKeyOrder.indexOf(b);
}
function numberStrokes(text) {
    const keys = {
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
    let strokes = "";
    let stroke = [];
    for (let i = 0; i < text.length; i += 2) {
        if (strokes !== "") strokes += "/";
        stroke = text.slice(i, i + 2).split("");
        if (stroke.length === 1) {
            strokes += "#" + (stroke[0] > 5 ? "-" : "") + keys[stroke[0]];
        } else {
            if (stroke[0] === stroke[1]) stroke[1] = "D";
            else if (cmpStenoNumKeys(stroke[0], stroke[1]) > 0) {
                stroke.push("I");
            }
            stroke.sort(cmpStenoNumKeys);
            var right;
            right = false;
            stroke = stroke.map(function(x) {
                let out = keys[x] || x;
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
    // console.log("Looking up", text);
    let strokes = dictionary[text] || "";
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
}

function processAllWords() {
    const results = [];

    for (let index = 0; index < allWords.length; index++) {
        for (let j = 10; j > 0; j--) {
            const subString = allWords.slice(index, index + j).join(" ");
            // console.log("Looking up", subString);
            const lookupResult = lookup(subString);
            if (lookupResult == null) {
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
