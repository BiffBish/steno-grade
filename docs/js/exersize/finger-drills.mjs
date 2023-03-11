import { setTheme, populatePage, parseQueryString, updateURLParameter } from "../../scripts/utils/util.mjs";
import { TypeJig, setExercise } from "../../scripts/type-jig.mjs";
import { dreadedDuo } from "../../data/finger-drill-data.mjs";

setTheme();

function addSet(strokes, iterations, drill) {
    if (drill == null) drill = [];
    strokes = strokes.split("/");
    if (drill.length === 0) {
        drill.push.apply(drill, strokes);
        --iterations;
    }
    strokes[0] = "\n" + strokes[0];
    for (let i = 0; i < iterations; ++i) {
        drill.push.apply(drill, strokes);
    }
    drill.push(strokes[0]);
    return drill;
}

function generateFingerDrill(drills, iterations, name) {
    let out = [];
    for (const drill of drills) addSet(drill, iterations, out);
    return new TypeJig.Exercise({
        name: name ?? "Finger Drill: " + drills.join(" "),
        words: out,
    });
}

function generateDreadedDuoDrill(section, drill, iterations) {
    let n = dreadedDuo[section - 1].length;
    let name = "Da Dreaded Dueling Digit Duo Drills";
    name += " (Section " + section + ", #" + drill + " of " + n + ")";
    let drills = [dreadedDuo[section - 1][drill - 1]];
    let exercise = generateFingerDrill(drills, iterations, name);
    return exercise;
}

$(function () {
    populatePage({
        require_raw_steno: true,
    });
    let fields = parseQueryString(document.location.search);
    fields.iterations = fields.iterations || 20;
    fields.actualWords = { unit: "strokes per minute", u: "SPM" };

    let exercise;
    if (fields.strokes) {
        const drills = fields.strokes.split(/\s+/);
        exercise = generateFingerDrill(drills, fields.iterations);
    } else if (fields.book === "Stenotype Finger Technique") {
        let name = fields.book + ": " + fields.section;
        const drills = stenotypeFingerTechnique[fields.section];
        exercise = generateFingerDrill(drills, fields.iterations, name);
    } else {
        fields.section = Math.max(1, Math.min(fields.section || 1, dreadedDuo.length));
        fields.drill = Math.max(1, Math.min(fields.drill || 1, dreadedDuo[fields.section - 1].length));
        exercise = generateDreadedDuoDrill(fields.section, fields.drill, fields.iterations);
        console.log(exercise);
    }

    fields.menu = "../form";
    setExercise(exercise.name, exercise, null, fields);
});
