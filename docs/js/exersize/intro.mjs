import { Intro } from "../../scripts/intro.js";
import { TypeJig, setExercise } from "../../scripts/type-jig.mjs";
import { StenoDisplay } from "../../scripts/utils/steno-display.mjs";
import { parseQueryString, displayOnly, setTheme, N, LS, populatePage } from "../../scripts/utils/util.mjs";
import { wordDrill } from "../../scripts/word-drill.mjs";
import { WordSets } from "../../scripts/word-sets.mjs";

$(function () {
    populatePage({});
    if (document.location.search === "") {
        let form = $("#selectDrill");
        let drill = form.find("[name='drill']");

        let order = Object.keys(WordSets.Intro);
        for (const element of order) {
            let option = document.createElement("option");
            option.appendChild(document.createTextNode(element));
            N(drill, [option]);
        }
        drill.trigger("focus");
        loadFormState(form);
        form.on("submit", function () {
            LS.set(LOCAL_STORAGE_KEY, {
                drill: drill.val(),
                hints: form.find("[name='hints']").val(),
                timeLimit: form.find("[name='timeLimit']").val(),
            });

            saveFormState(form);
        });
        return;
    }

    let fields = parseQueryString(document.location.search);

    fields.type = "shuffled";
    fields.menu = "../intro";
    let exercise = wordDrill(fields, Intro);
    setExercise(exercise.name, exercise, null, fields);
});

const LOCAL_STORAGE_KEY = "intro-form";
function saveFormState(form) {}

function loadFormState(form) {
    let loaded = LS.get(LOCAL_STORAGE_KEY, {});
    if (loaded.drill != null) {
        form.drill.value = loaded.drill;
    }
    if (loaded.hints != null) form.hints.checked = !!loaded.hints;
    if (loaded.timeLimit) {
        form.timeLimit.value = loaded.timeLimit;
    }
}

setTheme();
