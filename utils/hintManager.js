function HintManager() {
    // console.log("Creating StenoDisplay", container, translations, showEmpty);
    // if (typeof container === "string") {
    //     container = document.getElementById(container);
    // }
    // this.container = container;
    // this.strokes = [];
    // this.pseudoStenoFor = translations;
    // this.lastText = false;
    // this.showEmpty = showEmpty;
    // this.errorLog = document.getElementById("error-log");
    // var styles = window.getComputedStyle(container);
    // var position = styles.getPropertyValue("position");
    // this.placeNearText = position === "fixed";
}

HintManager.prototype.lookup = function (text) {
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
        return { strokes: strokes, rules: null };
    }
    return null;
};