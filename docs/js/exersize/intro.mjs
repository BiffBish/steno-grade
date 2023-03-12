let TJ = import("../../scripts/type-jig.mjs");

import { Intro } from "../../scripts/intro.js";
import { parseQueryString, setTheme, populatePage, assureSeed, getNextSeedUrl } from "../../scripts/utils/util.mjs";
import { wordDrill } from "../../scripts/word-drill.mjs";

setTheme();

function generateExercise() {
    return wordDrill(
        {
            ...parseQueryString(document.location.search),
            type: "shuffled",
        },
        Intro
    );
}

$(async function () {
    populatePage();
    assureSeed();
    (await TJ).setExercise(
        null,
        generateExercise(),
        null,
        {
            ...parseQueryString(document.location.search),
            menu: "../intro",
        },
        getNextSeedUrl,
        generateExercise
    );
});
