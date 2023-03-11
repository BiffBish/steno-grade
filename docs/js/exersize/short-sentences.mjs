// @ts-ignore
import { shortSentences } from "../../data/short-sentences-data.mjs";
import { TypeJig, setExercise } from "../../scripts/type-jig.mjs";
import { newRNG, parseQueryString, populatePage, setTheme, updateURLParameter } from "../../scripts/utils/util.mjs";

setTheme();
const choose = (a, rnd) => a[Math.floor(rnd() * a.length)];

function generateExercise(wordCount, rnd) {
    let prevElements = [],
        element;
    let words = [];
    let charsLeft = wordCount * 5 + 1;
    while (charsLeft > 0) {
        do {
            element = choose(shortSentences, rnd);
        } while (prevElements.includes(element));
        if (prevElements.length > 20) prevElements.shift();
        prevElements.push(element);
        const string = typeof element === "string" ? element : element.join(" ");
        const array = Array.isArray(element) ? element : element.split(/\s+/);
        charsLeft -= 1 + string.length;
        words.splice(words.length, 0, ...array);
    }
    return new TypeJig.Exercise({
        name: "Short Sentences",
        words: words,
    });
}

$(function () {
    populatePage();
    let fields = parseQueryString(document.location.search);

    if (!fields.seed) {
        fields.seed = "" + Math.random();
        window.history.replaceState("", "", updateURLParameter(window.location.href, "seed", fields.seed));
    }
    let rng = newRNG(fields.seed);

    let wordCount = fields.word_count == null ? 100 : parseInt(fields.word_count);

    let name = "Short Sentences";

    let exercise = generateExercise(wordCount, rng);

    fields.menu = "../form";

    setExercise(name, exercise, null, fields);
    // another.addEventListener("click", function (evt) {
    //     evt.preventDefault();
    //     window.history.replaceState("", "", updateURLParameter(window.location.href, "seed", nextSeed));
    //     let exercise = generateExercise(wordCount, PRNG(nextSeed));
    //     jig.exercise = exercise;
    //     jig.reset();
    //     nextSeed = prepareNextSeed(another);
    // });
});
