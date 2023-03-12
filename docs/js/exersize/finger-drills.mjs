let TJ = import("../../scripts/type-jig.mjs");
let dreadedDuo = import("../../data/finger-drill-data.mjs").then((m) => m.dreadedDuo);

import {
    setTheme,
    populatePage,
    parseQueryString,
    updateURLParameter,
    parseQueryStringFlat,
} from "../../scripts/utils/util.mjs";

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

async function generateFingerDrill(drills, iterations, name) {
    let out = [];
    for (const drill of drills) addSet(drill, iterations, out);
    return new (await TJ).TypeJig.Exercise({
        name: name ?? "Finger Drill: " + drills.join(" "),
        words: out,
    });
}

async function generateDreadedDuoDrill(section, drill, iterations) {
    let n = (await dreadedDuo)[section - 1].length;
    let name = "Da Dreaded Dueling Digit Duo Drills";
    name += " (Section " + section + ", #" + drill + " of " + n + ")";
    let drills = [(await dreadedDuo)[section - 1][drill - 1]];
    let exercise = await generateFingerDrill(drills, iterations, name);
    return exercise;
}

async function generateExercise() {
    let flatFields = parseQueryStringFlat(document.location.search);

    let fields = parseQueryString(document.location.search);
    let iterations = fields.iterations || 20;

    if (fields.strokes) {
        const drills = flatFields.strokes.split(/\s+/);
        return await generateFingerDrill(drills, iterations);
    } else if (fields.book === "Stenotype Finger Technique") {
        let section = fields.section;
        let name = fields.book + ": " + section;
        const drills = stenotypeFingerTechnique[section];
        return await generateFingerDrill(drills, iterations, name);
    } else {
        let section = Math.max(1, Math.min(parseInt(flatFields.section) || 1, (await dreadedDuo).length));
        let drill = Math.max(
            1,
            Math.min(parseInt(flatFields.drill) || 1, (await dreadedDuo)[parseInt(flatFields.section) - 1].length)
        );
        return await generateDreadedDuoDrill(section, drill, iterations);
    }
}

$(async function () {
    populatePage({
        require_raw_steno: true,
    });

    (await TJ).setExercise(
        null,
        generateExercise(),
        null,
        {
            ...parseQueryString(document.location.search),
            menu: "../form",
        },
        null,
        generateExercise
    );
});
