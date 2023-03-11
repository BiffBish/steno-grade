let sentences = import("../../data/tatoeba-sentences.mjs")
    .then((module) => {
        //@ts-ignore
        return module.sentences;
    })
    .catch((err) => {
        console.log(err);
    });

import { TypeJig, setExercise } from "../../scripts/type-jig.mjs";
import {
    setTheme,
    populatePage,
    initializeButtons,
    newRNG,
    parseQueryString,
    prepareNextSeed,
    updateURLParameter,
} from "../../scripts/utils/util.mjs";

// import { sentences } from "../../data/tatoeba-sentences.mjs";

setTheme();

function compute_ngrams(sentences, order) {
    console.log("compute_ngrams");

    const ngrams = { "": [] };
    for (const element of sentences) {
        const words = element.split(/\s+/);
        for (let j = 0; j < words.length - order; ++j) {
            const Gram = words.slice(j, j + order).join(" ");
            if (j === 0) ngrams[""].push(Gram);
            const gram = Gram.toLowerCase();
            const next = words[j + order];
            if (ngrams[gram] == null) ngrams[gram] = [];
            ngrams[gram].push(next);
        }
    }
    return ngrams;
}

function generate_sentence(ngrams, rnd) {
    const choose = (a) => a[Math.floor(rnd() * a.length)];
    let sentence = choose(ngrams[""]).split(" ");
    const order = sentence.length;
    while (true) {
        const last = sentence.slice(-order).join(" ").toLowerCase();
        const following = ngrams[last];
        if (following == null) break;
        sentence.push(choose(following));
    }
    return sentence;
}

function generateMarkovExercise(ngrams, word_count, rnd) {
    let words = [];
    let chars_left = word_count * 5 + 1;
    while (chars_left > 0) {
        const sentence = generate_sentence(ngrams, rnd);
        chars_left -= 1 + sentence.join(" ").length;
        words.splice(words.length, 0, ...sentence);
    }
    return new TypeJig.Exercise({
        name: "Markov-chain generated sentences",
        words: words,
    });
}

//JQuery document ready
$(async function () {
    populatePage();

    let fields = parseQueryString(document.location.search);

    let rng = newRNG(fields.seed);

    let word_count = fields.word_count == null ? 100 : parseInt(fields.word_count);

    let name = "Markov-chain generated sentences";
    const ngrams = compute_ngrams(await sentences, 3);
    // console.log(ngrams)
    let exercise = generateMarkovExercise(ngrams, word_count, rng);

    fields.menu = "../form";

    let jig = setExercise(name, exercise, null, fields);

    let another = document.getElementById("new");
    let nextSeed = prepareNextSeed(another);
    another.addEventListener("click", function (evt) {
        evt.preventDefault();
        window.history.replaceState("", "", updateURLParameter(window.location.href, "seed", nextSeed));
        let rng = newRNG(nextSeed);
        let exercise = generateMarkovExercise(ngrams, word_count, rng);
        jig.exercise = exercise;
        jig.reset();
        nextSeed = prepareNextSeed(another);
    });

    initializeButtons(jig);
});
