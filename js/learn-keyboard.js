import TypeJig from "./type-jig.js";
import {
    setExercise,
    displayOnly,
    setTheme,
    parseQueryString,
} from "./utils/util.js";

import { wordDrill } from "./word-drill.js";
// Wrap everything in a function to avoid polluting the global namespace.
(function () {
    let E = {};
    TypeJig.WordSets.LearnKeyboard = E;

    /**
     * Randomize array element order in-place.
     * Using Durstenfeld shuffle algorithm.
     */
    function shuffle(a) {
        for (var i = a.length - 1; i >= 1; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var a_i = a[i];
            a[i] = a[j];
            a[j] = a_i;
        }
        return a;
    }

    function IndividualChords(chords, count, intro, line_length) {
        console.log(
            "Making individual chords",
            chords,
            count,
            intro,
            line_length
        );
        const reversed = [...chords].reverse();
        const shuffled = shuffle([...chords]);
        const Length = line_length || 2 * chords.length;
        intro = [].concat(chords, chords, ["\n"], reversed, reversed);
        /**
         * @type {Array<string>}
         */
        var output = [];

        for (let i = 0; i < intro.length; ++i) {
            output.push(intro[i]);
        }

        for (let i = 0; i < count; ++i) {
            const c = Math.floor(chords.length * Math.random());
            if (i % Length === 0) {
                output.push("\n");
            }
            output.push(chords[c]);
        }
        return output;
    }

    function ChordCombos(groups, count) {
        console.log("CHORD COMBOS");
        var output = [];

        for (let i = 0; i < count; i++) {
            const nl = i % 8 === 0 && i > 0 && i < count - 1;
            if (nl) output.push("\n");
            let chord = "";
            for (const g of groups) {
                chord += g[Math.floor(g.length * Math.random())];
            }
            output.push(chord);
        }
        console.log(output);
        return output;
    }

    E["Left hand, bottom row"] = IndividualChords.bind(
        null,
        ["S", "K", "W", "R"],
        100
    );
    E["Right hand, bottom row"] = IndividualChords.bind(
        null,
        ["-S", "-G", "-B", "-R"],
        100
    );
    E["Left hand, top row"] = IndividualChords.bind(
        null,
        ["S", "T", "P", "H"],
        100
    );
    E["Right hand, top row"] = IndividualChords.bind(
        null,
        ["-F", "-P", "-L", "-T"],
        100
    );
    E["Right hand, full bottom row"] = IndividualChords.bind(
        null,
        ["-Z", "-S", "-G", "-B", "-R"],
        100
    );
    E["Right hand, full top row"] = IndividualChords.bind(
        null,
        ["-F", "-P", "-L", "-T", "-D"],
        100
    );
    E["Vowels"] = IndividualChords.bind(null, ["A", "O", "E", "U"], 100);
    // E['"Long" vowels'] = IndividualChords(['AEU','OEU','AOE','AOU','AOEU'],100)
    // E["Diphthongs and Disambiguators"] = IndividualChords(['AO','OE','AE','OU','AU'],100)
    E["Left hand"] = IndividualChords.bind(
        null,
        ["S", "T", "K", "P", "W", "H", "R"],
        100,
        false,
        20
    );
    E["Right hand"] = IndividualChords.bind(
        null,
        ["-F", "-R", "-P", "-B", "-L", "-G", "-T", "-S", "-D", "-Z"],
        100,
        false,
        20
    );
    E["All keys"] = IndividualChords.bind(
        null,
        [
            "S",
            "T",
            "K",
            "P",
            "W",
            "H",
            "R",
            "A",
            "O",
            "E",
            "U",
            "-F",
            "-R",
            "-P",
            "-B",
            "-L",
            "-G",
            "-T",
            "-S",
            "-D",
            "-Z",
        ],
        100,
        false,
        20
    );
    E["Left + Right"] = ChordCombos.bind(
        null,
        [
            ["S", "T", "K", "P", "W", "H", "R"],
            ["-F", "-R", "-P", "-B", "-L", "-G", "-T", "-S", "-D", "-Z"],
        ],
        104
    );
    E["Left + Vowel"] = ChordCombos.bind(
        null,
        [
            ["S", "T", "K", "P", "W", "H", "R"],
            ["A", "O", "E", "U"],
        ],
        104
    );
    E["Vowel + Right"] = ChordCombos.bind(
        null,
        [
            ["A", "O", "E", "U"],
            ["F", "R", "P", "B", "L", "G", "T", "S", "D", "Z"],
        ],
        104
    );
    E["Left + Vowel + Right"] = ChordCombos.bind(
        null,
        [
            ["S", "T", "K", "P", "W", "H", "R"],
            ["A", "O", "E", "U"],
            ["F", "R", "P", "B", "L", "G", "T", "S", "D", "Z"],
        ],
        104
    );
    E["Columns: D, B, L, -N"] = IndividualChords.bind(
        null,
        ["D-", "B-", "L-", "-N"],
        100
    );
    E["Rows (2-key): F, M, Q, -M, -K"] = IndividualChords.bind(
        null,
        ["F-", "M-", "Q-", "-M", "-K"],
        100
    );
    E["Rows: N, Y, J, C, V"] = IndividualChords.bind(
        null,
        ["N-", "Y-", "J-", "C-", "V-"],
        100
    );
    E["Other chords: G, X, Z, -J"] = IndividualChords.bind(
        null,
        ["G-", "X-", "Z-", "-J"],
        100
    );
})(); // Execute the code in the wrapper function.
window.onload = function () {
    var leftFromPseudo = {
        C: "KR",
        D: "TK",
        B: "PW",
        L: "HR",
        F: "TP",
        M: "PH",
        N: "TPH",
        Q: "KW",
        Y: "KWR",
        J: "SKWR",
        V: "SR",
        G: "TKPW",
        X: "KP",
        Z: "STKPW",
    };
    var vowelFromPseudo = {
        AY: "AEU",
        OH: "OE",
        EE: "AOE",
        UU: "AOU",
        I: "EU",
        IE: "AOEU",
        AW: "AU",
        OW: "OU",
        OI: "OEU",
        EA: "AE",
        OA: "AO",
        OO: "AO",
    };
    var rightFromPseudo = {
        TH: "*T",
        CH: "FP",
        SH: "RB",
        RCH: "FRPB",
        N: "PB",
        NG: "PBG",
        NK: "PBG",
        M: "PL",
        K: "BG",
        SHN: "GS",
        KSHN: "BGS",
        J: "PBLG",
        RBGS: "RBGS",
    };
    var left_re =
        /C|L|G|Z|N|J|X|B|V|F|Y|Q|D|M|0|1|2|3|4|5|6|7|8|9|S|T|K|P|W|H|R/g;
    var vowel_re =
        /AY|OA|OO|AW|EA|EE|OH|UU|OI|IE|OW|I|0|1|2|3|4|5|6|7|8|9|A|O|E|U/g;
    var right_re =
        /RBGS|KSHN|SHN|RCH|CH|SH|NG|NK|TH|K|J|N|M|0|1|2|3|4|5|6|7|8|9|\*|F|R|P|B|L|G|T|S|D|Z/g;
    var separation_re = /([^AOEUI*-]*)([AO*EUI-][AO*EUIHYW-]*|)(.*)/;

    function fromPseudo(stroke) {
        let match = separation_re.exec(stroke);
        var b = match[1],
            v = match[2],
            e = match[3];
        var left = b.replace(left_re, function (m) {
            return leftFromPseudo[m] || m;
        });
        var vowel = v.replace(vowel_re, function (m) {
            return vowelFromPseudo[m] || m;
        });
        var right = e.replace(right_re, function (m) {
            return rightFromPseudo[m] || m;
        });
        return (left + vowel + right).replace(/-$/, "");
    }

    if (document.location.search === "") {
        var form = document.getElementById("selectDrill");
        var drill = form.elements.drill;
        var order = Object.keys(TypeJig.WordSets.LearnKeyboard);
        for (var i = 0; i < order.length; ++i) {
            var option = document.createElement("option");
            option.appendChild(document.createTextNode(order[i]));
            drill.appendChild(option);
        }
        drill.focus();

        loadFormState(form);
        form.addEventListener("submit", function () {
            saveFormState(form);
        });
    } else {
        var fields = parseQueryString(document.location.search);
        TypeJig.WordSets = TypeJig.WordSets.LearnKeyboard;
        var exercise = wordDrill(fields);
        if (exercise) {
            var hints;
            if (fields.hints) {
                var strokes = document.getElementById("strokes");

                hints = new StenoDisplay(strokes, [], true);
                hints.lookup = function (word) {
                    if (word.split(" ").length > 1) {
                        return "";
                    }
                    return word;
                };
            }
            fields.menu = "learn-keyboard";
            fields.actualWords = {
                unit: "strokes per minute",
                u: "SPM",
            };

            displayOnly("lesson");
            var jig = setExercise(exercise.name, exercise, hints, {
                ...fields,
                gradingRules: {
                    droppedWordMaxJump: 0,
                    addedWordMaxJump: 0,
                },
            });
            jig.match = function (a, b) {
                return a == fromPseudo(b);
            };
        }
    }
};

function saveFormState(form) {
    save({
        drill: form.drill.value,
        hints: form.hints.checked,
        timeLimit: form?.timeLimit?.value,
    });
}

function loadFormState(form) {
    var loaded = load();
    if (loaded.drill) {
        form.drill.value = loaded.drill;
    }
    form.hints.checked = loaded.hints;
    if (loaded.timeLimit) {
        form.timeLimit.value = loaded.timeLimit;
    }
}

var LOCAL_STORAGE_KEY = "learn-plover-form";

function save(obj) {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
        console.error(e);
    }
}

function load() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
    } catch (e) {
        console.error(e);
        return {};
    }
}

setTheme();

export default { wordDrill };
