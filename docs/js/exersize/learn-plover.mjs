let TJ = import("../../scripts/type-jig.mjs");
let LearnPlover = import("../../scripts/learn-plover.mjs").then((module) => module.LearnPlover);
let wordDrill = import("../../scripts/word-drill.mjs").then((module) => module.wordDrill);

import { setTheme, populatePage, parseQueryString } from "../../scripts/utils/util.mjs";

setTheme();

async function getNewExercise() {
    let fields = parseQueryString(document.location.search);
    return (await wordDrill)(fields, await LearnPlover);
}

$(async function () {
    populatePage();
    (await TJ).setExercise(
        "Learn Plover",
        getNewExercise(),
        null,
        {
            ...parseQueryString(document.location.search),
            menu: "../learn-plover",
        },
        null,
        getNewExercise
    );
});
