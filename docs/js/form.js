if (document.location.search !== "") {
    displayOnly("lesson");
}

let numberSentences = import("../scripts/number-sentences.mjs").then((m) => m.numberSentences);
let setExercise = import("../scripts/type-jig.mjs").then((m) => m.setExercise);
let wordDrill = import("../scripts/word-drill.mjs").then((m) => m.wordDrill);
let WordSets = import("../scripts/word-sets.mjs").then((m) => m.WordSets);

import {
    setTheme,
    displayOnly,
    prepareInput,
    loadSettings,
    storageAvailable,
    populatePage,
    getFormFields,
    parseQueryString,
    newRNG,
    shuffle,
} from "../scripts/utils/util.mjs";

prepareInput("monkeytype-quote-length");
setTheme();
async function runExercise(fields) {
    let exercise = fields.drill === "NumberSentences" ? (await numberSentences)(fields) : (await wordDrill)(fields);
    console.log("Setting Exersize" + exercise);
    if (exercise) {
        displayOnly("lesson");
        return (await setExercise)(exercise.name, exercise, null, fields);
    }
}

async function runCustom(evt) {
    evt.preventDefault();
    let fields = getFormFields(this);
    if (storageAvailable("localStorage")) {
        localStorage.custom = fields.drill;
    }
    if (fields.shuffleLines) {
        delete fields.type;
        fields.drill = shuffle(fields.drill.trim().split(/\n+/m), newRNG(Math.random())).join(" ");
    }
    let drill = fields.drill.trim().split(/\s+/m);
    let n = +fields.repeat || 1;

    (await WordSets).custom = [];
    for (let i = 0; i < n; ++i) (await WordSets).custom.push(...drill);
    fields.drill = "custom";
    await runExercise(fields);
}

loadSettings();
if (storageAvailable("localStorage") && localStorage.custom != null) {
    $("#custom input[name=drill]").val(localStorage.custom);
}

$(async function () {
    populatePage();

    /**
     * @typedef {import("../scripts/type-jig.mjs").TypeJig} TypeJig3
     */

    /**
     * @type {TypeJig3}
     */
    let jig;

    if (document.location.search !== "") {
        jig = await runExercise(parseQueryString(document.location.search));
        // initializeButtons(jig);
    } else {
        // Add event listeners to get settings before submitting.
        // let forms = document.querySelectorAll("form");
        for (const form of $("form")) {
            if (form.id === "custom") {
                form.addEventListener("submit", runCustom);
            }
        }
    }
    $("#new").on("on", async function () {
        let fields = parseQueryString(document.location.search);
        let exercise = fields.drill === "NumberSentences" ? (await numberSentences)(fields) : (await wordDrill)(fields);
        console.log("Setting Exersize", exercise);

        jig?.setExercise(exercise);
    });

    // Get keyboard input from entire page
    $("body").on("keydown", function (e) {
        // console.log(e);
        //prevent deafault
        //If key is down find the div with the class "form-section--selected".
        //If there is no div with the class "form-section--selected" then select the first div.
        //Then set the div below it to be the div with the class "form-section--selected".
        let keyString = e.key;
        switch (keyString) {
        case "Enter":
            // Enter key
            let selected = $(".form-section--selected");
            //Find the button inside of the selected div and click it. recurse
            console.log(selected);
            selected.find("button").click();
            break;
        case " ":
            // Space
            $("#show-hint").click();
            break;
        case "ArrowLeft":
            // Left arrow
            $("#back").click();
            break;
        case "ArrowRight":
            // Right arrow
            $("#again").click();
            break;
        case "ArrowDown":
            e.preventDefault();

            // Down arrow
            let selectedDiv = $(".form-section--selected");
            let targetDiv = selectedDiv.length == 0 ? $(".form-section").first() : selectedDiv.next();
            if (targetDiv.length > 0) {
                selectedDiv.removeClass("form-section--selected");
                targetDiv.addClass("form-section--selected");
                targetDiv[0].scrollIntoView({ block: "center" });
            }
            break;
        case "ArrowUp":
            e.preventDefault();
            // Up arrow
            let _selectedDiv = $(".form-section--selected");
            let _targetDiv = _selectedDiv.length == 0 ? $(".form-section").first() : _selectedDiv.prev();
            if (_targetDiv.length > 0) {
                _selectedDiv.removeClass("form-section--selected");
                _targetDiv.addClass("form-section--selected");
                _targetDiv[0].scrollIntoView({ block: "center" });
            }
            break;
        default:
            break;
        }
    });

    $("#gutnum").on("change", function () {
        console.log("changed", $("#gutnum").val());
        var num = $("#gutnum").val();
        console.log(num);
        if (num == 0) {
            $("#sentences-form").attr("action", "exersize/short-sentences.html");
        } else {
            $("#sentences-form").attr("action", "exersize/gutenberg.html");
        }
    });
});
