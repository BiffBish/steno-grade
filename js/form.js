import {
    loadSettings,
    storageAvailable,
    populatePage,
    setTheme,
    parseQueryString,
    initializeButtons,
    displayOnly,
    setExercise,
} from "./utils/util.js";
import { numberSentences } from "./number-sentences.js";
import { wordDrill } from "./word-drill.js";

import TypeJig from "./type-jig.js";

import StenoDisplay from "./utils/steno-display.js";
import { PloverTranslations } from "./plover-translations.js";
function runExercise(fields) {
    let exercise;
    if (fields.drill === "NumberSentences") exercise = numberSentences(fields);
    else exercise = wordDrill(fields);
    console.log("Setting Exersize" + exercise, fields);
    if (exercise) {
        if (fields.hints) {
            var strokes = document.getElementsByClassName("strokes")[0];
            if (fields.floating_hints) {
                strokes.style.position = "fixed";
            }
            var translations = TypeJig.shortestTranslations(PloverTranslations);
            var hints = new StenoDisplay(strokes, translations, true);
        }
        var options = fields;

        options.hints = 1;
        displayOnly("lesson");
        return setExercise(exercise.name, exercise, hints, options);
    }
}

function getSettings(evt) {
    const hintButtons = document.getElementsByName("hints");
    for (var radio of hintButtons) {
        if (radio.checked) {
            hiddenField(this, "hints", radio.value);
            break;
        }
    }

    var live_wpm = document.getElementById("live_wpm");
    if (live_wpm.checked) hiddenField(this, "live_wpm", live_wpm.value);

    var show_timer = document.getElementById("show_timer");
    if (show_timer.checked) hiddenField(this, "show_timer", show_timer.value);
    var wpm = document.getElementById("wpm");
    var cpm = document.getElementById("cpm");
    if (cpm.checked) hiddenField(this, "cpm", 5 * wpm.value);
    else hiddenField(this, "wpm", wpm.value);

    var alternate = document.getElementById("alternate");
    hiddenField(this, "alternate", alternate.value);
}

function runCustom(evt) {
    evt.preventDefault();
    getSettings.call(this);
    var fields = getFormFields(this);
    if (storageAvailable("localStorage")) {
        localStorage.custom = fields.drill;
    }
    if (fields.shuffleLines) {
        // Don't shuffle words.
        delete fields.type;
        // Pre-shuffle lines.
        fields.drill = shuffle(fields.drill.trim().split(/\n+/m)).join(" ");
    }
    let drill = fields.drill.trim().split(/\s+/m);
    let n = +fields.repeat || 1;
    TypeJig.WordSets.custom = [];
    for (let i = 0; i < n; ++i) TypeJig.WordSets.custom.push(...drill);
    fields.drill = "custom";
    var jig = runExercise(fields);
    initializeButtons(jig);
}

window.onload = function () {};

//

loadSettings();
if (storageAvailable("localStorage") && localStorage.custom != null) {
    let custom = document.getElementById("custom");
    custom.elements.drill.value = localStorage.custom;
}

$(document).ready(function () {
    populatePage();

    if (document.location.search !== "") {
        var jig = runExercise(parseQueryString(document.location.search));
        initializeButtons(jig);
    } else {
        // Add event listeners to get settings before submitting.
        var forms = document.querySelectorAll("form");
        for (var i = 0; i < forms.length; ++i) {
            var form = forms[i];
            if (form.id === "custom") {
                form.addEventListener("submit", runCustom);
            } else {
                form.addEventListener("submit", getSettings);
            }
        }
    }
    var another = $("#new");
    another.click(function () {
        let exercise = wordDrill(parseQueryString(document.location.search));
        jig.exercise = exercise;
        jig.reset();
        // initializeButtons(jig);
    });

    // Get keyboard input from entire page
    $("body").keydown(function (e) {
        // console.log(e);
        //prevent deafault
        // e.preventDefault();

        //If key is down find the div with the class "selected-form-section". If there is no div with the class "selected-form-section" then select the first div.
        //Then set the div below it to be the div with the class "selected-form-section".

        var key = e.which;
        if (key == 13) {
            // Enter key
            var selected = $(".selected-form-section");
            //Find the button inside of the selected div and click it. recurse
            console.log(selected);
            selected.find("button").click();
        } else if (key == 32) {
            // Space
            $("#show-hint").click();
        } else if (key == 37) {
            // Left arrow
            $("#back").click();
        } else if (key == 39) {
            // Right arrow
            $("#again").click();
        } else if (key == 40) {
            // Down arrow
            var selectedDiv = $(".selected-form-section");
            if (selectedDiv.length == 0) {
                $(".form-section").first().addClass("selected-form-section");
            } else {
                selectedDiv.removeClass("selected-form-section");
                selectedDiv.next().addClass("selected-form-section");
            }
            //scroll to the selected div keeping it centered. but handle fast repeated keystrokes. wait for a second before scrolling.

            //Wait for a momnet
            setTimeout(function () {
                $(".selected-form-section")[0].scrollIntoView({
                    block: "center",
                });
            }, 10);
        } else if (key == 38) {
            // Up arrow
            var selectedDiv = $(".selected-form-section");
            if (selectedDiv.length == 0) {
                $(".form-section").last().addClass("selected-form-section");
            } else {
                selectedDiv.removeClass("selected-form-section");
                selectedDiv.prev().addClass("selected-form-section");
            }
            //scroll to the selected div keeping it centered. but handle fast repeated keystrokes
            setTimeout(function () {
                $(".selected-form-section")[0].scrollIntoView({
                    block: "center",
                });
            }, 10);
        }
    });
});
