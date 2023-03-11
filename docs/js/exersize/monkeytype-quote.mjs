import { TypeJig, setExercise } from "../../scripts/type-jig.mjs";

// import { monkeytype } from "../../data/monkeytype-quote-data.mjs";
let monkeytype = import("../../data/monkeytype-quote-data.mjs").then((m) => m.monkeytype);
import { setTheme, parseQueryString, populatePage, loadSettings } from "../../scripts/utils/util.mjs";

//q: Whats the oposite of typeof in ts
//a: keyof
/**
 * @typedef {InstanceType<TypeJig.Exercise>} Exercise
 */

/**
 * @typedef {Awaited<monkeytype>["quotes"][number]} Quote
 */

setTheme();
async function getQuoteById(id) {
    id = +id;
    const quotes = (await monkeytype).quotes;
    for (let i = 0; i < quotes.length; ++i) {
        if (quotes[i].id === id) return quotes[i];
    }
}

async function getQuoteByLength(lo, hi) {
    const quotes = (await monkeytype).quotes.filter((q) => q.text.length >= lo && q.text.length <= hi);
    return quotes[Math.floor(quotes.length * Math.random())];
}

async function getQuote(id, lo, hi) {
    if (id != null) return getQuoteById(id);
    else return getQuoteByLength(lo, hi);
}

/**
 *
 * @param {*} id
 * @param {*} lo
 * @param {*} hi
 * @returns {Promise<[Exercise, Quote]>}
 */
async function generateExercise(id, lo, hi) {
    const quote = await getQuote(id, lo, hi);
    const words = quote.text.trim().split(/\s+/);
    const exercise = new TypeJig.Exercise({
        words,
        name: "Monkeytype English Quote #" + quote.id + " (from " + quote.source + ")",
    });

    return [exercise, quote];
}

function replaceID(href, id) {
    console.log(href, id);
    let [h, q] = href.split("?");
    q = (q || "").split("&").filter((x) => !/^id=/.test(x));
    if (id) q.push("id=" + id);
    return h + "?" + q.join("&");
}
let jig, exercise, fields;

/**
 *
 * @param {*} fields
 * @returns {Promise<[Exercise, Quote]>}
 */
async function getExercise(fields) {
    console.log(fields);
    switch (fields.length) {
    case "short":
        fields.lo = 0;
        fields.hi = 100;
        break;
    case "medium":
        fields.lo = 101;
        fields.hi = 300;
        break;
    case "long":
        fields.lo = 301;
        fields.hi = 600;
        break;
    case "thicc":
        fields.lo = 601;
        fields.hi = Infinity;
        break;
    case "all":
    default:
        fields.lo = 0;
        fields.hi = Infinity;
        break;
    }
    return generateExercise(fields.id, fields.lo, fields.hi);
}

async function go(ex) {
    let exercise, quote;
    fields = parseQueryString(document.location.search);
    if (ex == null) {
        [exercise, quote] = await getExercise(fields);
    } else {
        exercise = ex;
    }

    fields.menu = "../form";
    jig = setExercise(exercise.name, exercise, null, fields, jig);
    return [exercise, jig, quote];
}
$(async function () {
    populatePage();
    loadSettings();

    let [, , quote] = await go();
    window.history.replaceState(null, "", replaceID(document.location.href, quote.id));

    let fields = parseQueryString(document.location.search);
    fields.id = null;
    let [, nextQuote] = await getExercise(fields);

    $("#new").prop("href", replaceID(document.location.href, nextQuote?.id));
    window.addEventListener("popstate", function () {
        go();
    });
});
