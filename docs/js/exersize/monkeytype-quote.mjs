let TJ = import("../../scripts/type-jig.mjs");
let monkeytype = import("../../data/monkeytype-quote-data.mjs").then((m) => m.monkeytype);

import {
    setTheme,
    parseQueryString,
    populatePage,
    loadSettings,
    updateURLParameter,
    parseQueryStringFlat,
} from "../../scripts/utils/util.mjs";

setTheme();

//q: Whats the oposite of typeof in ts
//a: keyof
/**
 * @typedef {InstanceType<Awaited<TJ>.TypeJig.Exercise>} Exercise
 * @typedef {Awaited<monkeytype>["quotes"][number]} Quote
 */

/**
 *
 * @returns {Promise<[Exercise, Quote]>}
 */
async function generateExercise(fields = null) {
    fields ??= parseQueryStringFlat(document.location.search);

    const quotes = (await monkeytype).quotes;

    const { id } = fields;

    let quote;
    if (id != null) {
        const idNum = parseInt(id);

        for (const element of quotes) {
            if (element.id === idNum) {
                quote = element;
                break;
            }
        }
    } else {
        let low, high;

        switch (fields.length) {
        case "short":
            low = 0;
            high = 100;
            break;
        case "medium":
            low = 101;
            high = 300;
            break;
        case "long":
            low = 301;
            high = 600;
            break;
        case "thicc":
            low = 601;
            high = Infinity;
            break;
        case "all":
        default:
            low = 0;
            high = Infinity;
            break;
        }

        const filteredQuotes = quotes.filter((q) => q.text.length >= low && q.text.length <= high);
        quote = filteredQuotes[Math.floor(quotes.length * Math.random())];
    }

    const words = quote.text.trim().split(/\s+/);
    const exercise = new (await TJ).TypeJig.Exercise({
        name: "Monkeytype English Quote #" + quote.id + " (from " + quote.source + ")",
        words,
    });

    return [exercise, quote];
}

async function generateExerciseFromFields() {
    return (await generateExercise())[0];
}

async function getNextURL() {
    let nextExercise = await generateExercise({
        ...parseQueryStringFlat(document.location.search),
        id: null,
    });
    console.log(nextExercise);

    return updateURLParameter(window.location.href, "id", nextExercise[1].id);
}

$(async function () {
    populatePage();
    loadSettings();

    /**
     * @type {Object.<string, string>}
     */
    let fields = parseQueryStringFlat(document.location.search);
    if (fields.id == null) {
        let [, quote] = await generateExercise();
        window.history.replaceState("", "", updateURLParameter(window.location.href, "id", quote.id));
    }
    (await TJ).setExercise(
        null,
        generateExerciseFromFields(),
        null,
        {
            ...parseQueryStringFlat(document.location.search),
            menu: "../form",
        },
        getNextURL,
        generateExerciseFromFields
    );
});
