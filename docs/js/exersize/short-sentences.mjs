let TJ = import("../../scripts/type-jig.mjs");
// @ts-ignore
let shortSentences = import("../../data/short-sentences-data.mjs").then((m) => m.shortSentences);

import { PRNG } from "../../scripts/alea-prng.mjs";
import { assureSeed, getNextSeedUrl, parseQueryStringFlat, populatePage, setTheme } from "../../scripts/utils/util.mjs";

setTheme();

const choose = (a, rnd) => a[Math.floor(rnd() * a.length)];
async function generateExercise() {
    let fields = parseQueryStringFlat(document.location.search);

    let wordCount = fields.word_count == null ? 100 : parseInt(fields.word_count);
    let rnd = PRNG(fields.seed);

    let prevElements = [],
        element;
    let words = [];
    let charsLeft = wordCount * 5 + 1;
    while (charsLeft > 0) {
        do {
            element = choose(await shortSentences, rnd);
        } while (prevElements.includes(element));
        if (prevElements.length > 20) prevElements.shift();
        prevElements.push(element);
        const string = typeof element === "string" ? element : element.join(" ");
        const array = Array.isArray(element) ? element : element.split(/\s+/);
        charsLeft -= 1 + string.length;
        words.splice(words.length, 0, ...array);
    }
    return new (await TJ).TypeJig.Exercise({
        name: "Short Sentences",
        words: words,
    });
}

$(async function () {
    populatePage();
    assureSeed();
    (await TJ).setExercise(
        "Short Sentences",
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
