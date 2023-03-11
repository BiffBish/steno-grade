import {
    setTheme,
    populatePage,
    parseQueryString,
    newRNG,
    prepareNextSeed,
    N,
    updateURLParameter,
} from "../../scripts/utils/util.mjs";
import { TypeJig, setExercise } from "../../scripts/type-jig.mjs";

let sentences = import("../../data/tatoeba-sentences.mjs")
    .then((module) => {
        //@ts-ignore
        return module.sentences;
    })
    .catch((err) => {
        console.log(err);
    });

setTheme();

function compute_ngrams(sentences, order) {
    const ngrams = new Map([["", []]]);
    const uniqueGrams = new Set();
    for (let i = 0, len = sentences.length; i < len; i++) {
        const element = sentences[i];
        const words = element.split(/\s+/);
        const maxIndex = words.length - order;

        for (let j = 0; j < maxIndex; ++j) {
            const Gram = words.slice(j, j + order).join(" ");
            if (j === 0) ngrams.get("").push(Gram);
            const gram = Gram.toLowerCase();
            if (!uniqueGrams.has(gram)) {
                uniqueGrams.add(gram);
                ngrams.set(gram, []);
            }
            const next = words[j + order];
            ngrams.get(gram).push(next);
        }
    }
    return ngrams;
}

/**
 *
 * @param {Map} ngrams
 * @param {*} rnd
 * @param {*} bias
 * @returns
 */
function generate_sentence(ngrams, rnd, bias) {
    const durationData = JSON.parse(localStorage.getItem("durations") ?? "{}");
    const durationDataItems = Object.entries(durationData);
    //Remove all punctuation from the duration data
    const punctuation = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;
    const durationDataItemsNoPunctuation = durationDataItems.map(([key, value]) => [
        key.replace(punctuation, ""),
        value,
    ]);

    //turn the duration data into a dictionary averaging any duplicates
    const durationDataDict = {};
    durationDataItemsNoPunctuation.forEach(([key, value]) => {
        if (durationDataDict[key] == null) {
            durationDataDict[key] = [value];
        } else {
            durationDataDict[key].push(value);
        }
    });

    //turn the duration data dictionary into a dictionary with the average
    const durationDataDictAvg = {};
    Object.entries(durationDataDict).forEach(([key, value]) => {
        durationDataDictAvg[key] = value.reduce((a, b) => a + b) / value.length;
    });

    const choose = (a) => a[Math.floor(rnd() * a.length)];
    let sentence = choose(ngrams.get("")).split(" ");
    const order = sentence.length;
    let chooseDuration = false;
    while (true) {
        const last = sentence.slice(-order).join(" ").toLowerCase();
        const unmodifiedFollowing = [...(ngrams.get(last) ?? [])];
        if (unmodifiedFollowing.length <= 0) break;
        console.log(unmodifiedFollowing);

        let trackedWords = {};
        let totalTime = 0;

        unmodifiedFollowing.forEach((element) => {
            if (durationDataDictAvg[element]) {
                if (trackedWords[element]) return;
                trackedWords[element] = durationDataDictAvg[element];
                totalTime += durationDataDictAvg[element];
            }
        });
        if (totalTime == 0) {
            chooseDuration = true;
            sentence.push(choose(unmodifiedFollowing));
            continue;
        }

        if (rnd() > bias && !chooseDuration) {
            sentence.push(choose(unmodifiedFollowing));
            continue;
        }
        chooseDuration = false;

        let durationBiasedChoices = [];

        Object.entries(trackedWords).forEach((entry) => {
            const [key, value] = entry;
            console.log(key, value, (value / totalTime) * 100);
            for (let index = 0; index < (value / totalTime) * 100; index++) {
                durationBiasedChoices.push(key);
            }
        });
        console.log("duration Bias", durationBiasedChoices, totalTime);

        sentence.push(choose(durationBiasedChoices));
    }
    return sentence;
}
/**
 *
 * @param {Map} ngrams
 * @param {*} word_count
 * @param {*} rnd
 * @param {*} bias
 * @returns
 */
function generateMarkovExercise(ngrams, word_count, rnd, bias) {
    let words = [];
    let chars_left = word_count * 5 + 1;
    while (chars_left > 0) {
        const sentence = generate_sentence(ngrams, rnd, bias);
        chars_left -= 1 + sentence.join(" ").length;
        words.splice(words.length, 0, ...sentence);
    }
    return new TypeJig.Exercise({
        name: "Markov-chain generated sentences",
        words,
    });
}

//JQuery document ready
$(async function () {
    populatePage();

    let fields = parseQueryString(document.location.search);
    let bias = parseFloat(fields["bias"] ?? 40) / 100;

    let rng = newRNG(fields.seed);

    let word_count = fields.word_count == null ? 100 : parseInt(fields.word_count);
    fields.menu = "../form";
    let jig = setExercise(
        "Markov-chain generated sentences",
        {
            placeholder: true,
        },
        null,
        fields
    );

    const ngrams = compute_ngrams(await sentences, 3);
    // console.log(ngrams)
    let exercise = generateMarkovExercise(ngrams, word_count, rng, bias);

    jig.setExercise(exercise);
    // let jig = setExercise(name, exercise, null, fields);

    let another = document.getElementById("new");
    let nextSeed = prepareNextSeed(another);
    another.addEventListener("click", function (evt) {
        evt.preventDefault();
        window.history.replaceState("", "", updateURLParameter(window.location.href, "seed", nextSeed));
        let rng = newRNG(nextSeed);
        let exercise = generateMarkovExercise(ngrams, word_count, rng, bias);
        jig.exercise = exercise;
        jig.reset();
        nextSeed = prepareNextSeed(another);
    });
});
