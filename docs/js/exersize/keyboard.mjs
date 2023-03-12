let wordDrill = import("../../scripts/word-drill.mjs").then((module) => module.wordDrill);
let TJ = import("../../scripts/type-jig.mjs");
let LearnKeyboard = import("../../scripts/learn-keyboard.mjs").then((module) => module.LearnKeyboard);

import { setTheme, populatePage, parseQueryString } from "../../scripts/utils/util.mjs";

setTheme();

async function getNewExercise() {
    let fields = parseQueryString(document.location.search);
    return (await wordDrill)(fields, await LearnKeyboard);
}

$(async function () {
    populatePage();

    (await TJ).setExercise(
        null,
        getNewExercise(),
        null,
        {
            ...parseQueryString(document.location.search),
            menu: "../learn-keyboard",
        },
        null,
        getNewExercise
    );
});
