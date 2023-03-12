let TJ = import("../../scripts/type-jig.mjs");
let WordSets = import("../../scripts/word-sets.mjs").then((module) => module.WordSets);

import {
    setTheme,
    populatePage,
    newRNG,
    parseQueryStringFlat,
    assureSeed,
    getNextSeedUrl,
    shuffle,
} from "../../scripts/utils/util.mjs";

setTheme();

async function generateExercise() {
    let sentences = (await WordSets).twoKeySentences;

    let fields = parseQueryStringFlat(document.location.search);

    return new (await TJ).TypeJig.Exercise({
        name: "Two-Key Sentences",
        words: shuffle([...sentences], newRNG(fields.seed)),
    });
}

$(async function () {
    populatePage();
    assureSeed();
    (await TJ).setExercise(
        "Two-Key Sentences",
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
