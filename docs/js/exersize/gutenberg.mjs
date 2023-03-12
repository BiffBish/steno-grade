let sentences_by_top_100 = import("../../data/gutenberg-data.mjs").then((m) => m.sentences_by_top_100);
let TJ = import("../../scripts/type-jig.mjs");

import { PRNG } from "../../scripts/alea-prng.mjs";
import { assureSeed, getNextSeedUrl, parseQueryStringFlat, populatePage, setTheme } from "../../scripts/utils/util.mjs";

setTheme();

function clamp_top_n(top_n) {
    // round up
    top_n = Math.floor((top_n + 99) / 100) * 100;
    if (top_n < 100) {
        top_n = 100;
    }
    if (top_n > 8000) {
        top_n = 8000;
    }
    return top_n;
}

/**
 * Generate an exercise based on gutenberg-data.js (make sure to import that)
 *
 */
async function generateExercise() {
    let fields = parseQueryStringFlat(document.location.search);

    let word_count = fields.word_count == null ? 100 : parseInt(fields.word_count);
    let rng = PRNG(fields.seed);
    let top_n = fields.top == null ? 100 : parseInt(fields.top);

    top_n = clamp_top_n(top_n);
    let words = [],
        sentence;
    let chars_left = word_count * 5 + 1;
    let top_n_bucket = (await sentences_by_top_100)[top_n / 100 - 1];
    while (chars_left > 0) {
        // @ts-ignore
        sentence = top_n_bucket[Math.floor(rng() * top_n_bucket.length)];
        chars_left -= 1 + sentence.length;
        words.splice(words.length, 0, ...sentence.split(" "));
    }

    return new (await TJ).TypeJig.Exercise({
        name: "Project Gutenberg sentences for words " + top_n + ".",
        words: words,
    });
}

$(async function () {
    populatePage();
    assureSeed();
    (await TJ).setExercise(
        null,
        generateExercise(),
        null,
        {
            ...parseQueryStringFlat(document.location.search),
            menu: "../form",
        },
        getNextSeedUrl,
        generateExercise
    );
});
