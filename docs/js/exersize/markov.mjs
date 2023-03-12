let sentences = import("../../data/tatoeba-sentences.mjs")
    .then((module) => {
        //@ts-ignore
        return module.sentences;
    })
    .catch((err) => {
        console.log(err);
    });
let TJ = import("../../scripts/type-jig.mjs");

import { PRNG } from "../../scripts/alea-prng.mjs";
import {
    setTheme,
    populatePage,
    updateURLParameter,
    parseQueryStringFlat,
    assureSeed,
    getNextSeedUrl,
} from "../../scripts/utils/util.mjs";

setTheme();

let NGrams = sentences.then((sentences) => {
    const order = 3;
    const NGrams = new Map([["", []]]);
    const uniqueGrams = new Set();
    for (let i = 0, len = sentences.length; i < len; i++) {
        const element = sentences[i];
        const words = element.split(/\s+/);
        const maxIndex = words.length - order;

        for (let j = 0; j < maxIndex; ++j) {
            const Gram = words.slice(j, j + order).join(" ");
            if (j === 0) NGrams.get("").push(Gram);
            const gram = Gram.toLowerCase();
            if (!uniqueGrams.has(gram)) {
                uniqueGrams.add(gram);
                NGrams.set(gram, []);
            }
            const next = words[j + order];
            NGrams.get(gram).push(next);
        }
    }
    return NGrams;
});

async function generate_sentence(rnd) {
    const choose = (a) => a[Math.floor(rnd() * a.length)];

    let awaitedNGrams = await NGrams;

    let sentence = choose(awaitedNGrams.get("")).split(" ");
    const order = sentence.length;
    while (true) {
        const last = sentence.slice(-order).join(" ").toLowerCase();
        const following = awaitedNGrams.get(last);
        if (following == null) break;
        sentence.push(choose(following));
    }
    return sentence;
}

async function generateMarkovExercise() {
    let fields = parseQueryStringFlat(document.location.search);
    let rng = PRNG(fields.seed);
    let word_count = fields.word_count == null ? 100 : parseInt(fields.word_count);

    let words = [];
    let chars_left = word_count * 5 + 1;
    while (chars_left > 0) {
        const sentence = await generate_sentence(rng);
        chars_left -= 1 + sentence.join(" ").length;
        words.splice(words.length, 0, ...sentence);
    }
    return new (await TJ).TypeJig.Exercise({
        name: "Markov-chain generated sentences",
        words: words,
    });
}

//JQuery document ready
$(async function () {
    populatePage();
    assureSeed();
    (await TJ).setExercise(
        null,
        generateMarkovExercise(),
        null,
        {
            ...parseQueryStringFlat(document.location.search),
            menu: "../form",
        },
        getNextSeedUrl,
        generateMarkovExercise
    );
});
