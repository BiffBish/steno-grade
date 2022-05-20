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
        console.log("CHORD COMBOS")
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
