import { setTheme, populatePage, parseQueryString, newRNG, updateURLParameter } from "../../scripts/utils/util.mjs";
import { TypeJig, setExercise, shuffle, shuffleTail } from "../../scripts/type-jig.mjs";
import { WordSets } from "../../scripts/word-sets.mjs";

$(function () {
    populatePage();
    let sentances = WordSets.twoKeySentences;

    let parameters = parseQueryString(document.location.search);

    if (!parameters.seed) {
        parameters.seed = Math.random().toString();
        window.history.replaceState("", "", updateURLParameter(window.location.href, "seed", parameters.seed));
    }

    parameters.menu = "../form";
    setExercise(
        "Two-Key Sentences",
        new TypeJig.Exercise({
            name: "Two-Key Sentences",
            words: shuffle([...sentances], newRNG(parameters.seed)),
        }),
        null,
        parameters
    );
});
setTheme();
