let TJ = import("../../scripts/type-jig.mjs");
let sentences = import("../../data/tatoeba-sentences.mjs")
    .then((module) => {
        //@ts-ignore
        return module.sentences;
    })
    .catch((err) => {
        console.log(err);
    });

import {
    setTheme,
    populatePage,
    parseQueryString,
    newRNG,
    prepareNextSeed,
    N,
    updateURLParameter,
    parseQueryStringFlat,
    assureSeed,
    getNextSeedUrl,
} from "../../scripts/utils/util.mjs";
import { PRNG } from "../../scripts/alea-prng.mjs";

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

/**
 * @param {*} rnd
 * @param {*} bias
 * @returns
 */
async function generate_sentence(rnd, bias) {
    const awaitedNGrams = await NGrams;

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
    let sentence = choose(awaitedNGrams.get("")).split(" ");
    const order = sentence.length;
    let chooseDuration = false;
    while (true) {
        const last = sentence.slice(-order).join(" ").toLowerCase();
        const unmodifiedFollowing = [...(awaitedNGrams.get(last) ?? [])];
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
 * @returns
 */
async function generateMarkovExercise() {
    let fields = parseQueryStringFlat(document.location.search);
    let rng = PRNG(fields.seed);
    let word_count = fields.word_count == null ? 100 : parseInt(fields.word_count);
    let bias = fields.bias == null ? 0.4 : parseFloat(fields.bias) / 100;

    let words = [];
    let chars_left = word_count * 5 + 1;
    while (chars_left > 0) {
        const sentence = await generate_sentence(rng, bias);
        chars_left -= 1 + sentence.join(" ").length;
        words.splice(words.length, 0, ...sentence);
    }
    return new (await TJ).TypeJig.Exercise({
        name: "Markov-chain generated sentences",
        words,
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
