import { setTheme, populatePage, parseQueryString } from "../../scripts/utils/util.mjs";
import { setExercise } from "../../scripts/type-jig.mjs";
import { wordDrill } from "../../scripts/word-drill.mjs";
import { WordSets } from "../../scripts/word-sets.mjs";
import { LearnPlover } from "../../scripts/learn-plover.mjs";

setTheme();

$(function () {
    populatePage();
    let fields = parseQueryString(document.location.search);
    let exercise = wordDrill(fields, LearnPlover);
    let jig = setExercise("Learn Plover", exercise, null, fields);

    $("#again")[0].addEventListener("click", function (evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        let exercise = wordDrill(fields, LearnPlover);
        exercise.name = "Learn Plover";
        jig.setExercise(exercise);
    });

    // initializeButtons(jig);
});
