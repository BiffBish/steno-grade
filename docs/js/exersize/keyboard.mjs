import { setTheme, populatePage, parseQueryString } from "../../scripts/utils/util.mjs";
let setExercise = import("../../scripts/type-jig.mjs").then((m) => m.setExercise);
import { wordDrill } from "../../scripts/word-drill.mjs";
import { LearnKeyboard } from "../../scripts/learn-keyboard.mjs";

setTheme();

$(async function () {
    populatePage();
    const fields = parseQueryString(document.location.search);
    // WordSets = WordSets.LearnKeyboard;
    const exercise = wordDrill(fields, LearnKeyboard);
    if (exercise) {
        fields.menu = "../learn-keyboard";

        (await setExercise)(exercise.name, exercise, null, fields);
    }

    const back = $("#back");
    back.prop("href", back.prop("href").replace("markov", "form"));
});
