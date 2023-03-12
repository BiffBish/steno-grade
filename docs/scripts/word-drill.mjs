import { TypeJig, shuffleTail } from "./type-jig.mjs";
import { shuffle } from "./utils/util.mjs";
import { WordSets } from "./word-sets.mjs";

// Word-based drills
// =================

// Takes parameters:
//
// - `drill`: look up in WordSets.  Can have multiple
// drills which will be merged together.
//
// - `timeLimit`: floating-point minutes.
//
// - `type`:
//   - not present: drill words once in order (normal text).
//   - `randomly`: drill words in random order until `timeLimit`.
//   - `shuffled`: drill words once in a random order.
/**
 *
 * @param {any} params
 * @param {any} wordSets
 * @returns
 */
export function wordDrill(params, wordSets = WordSets) {
    console.log("wordDrill", params);
    let words = [...getDrillWords(params.drill, +params.count || 0, wordSets)];
    if (!words.length) return;
    let name = "";

    let timeLimit = 0;

    const first = +params.first || 0;
    let count = +params.count || words.length;
    const choose = +params.choose || count;
    if (first !== 0 || count !== words.length) {
        words = words.slice(first, first + count);
        name += " " + first + " to " + (first + count);
    }
    if (choose < count) {
        shuffle(words);
        words = words.slice(0, choose);
    }
    if (params.type === "shuffled") {
        if (params.timeLimit) {
            timeLimit = Math.round(60 * params.timeLimit);
            name = timeString(params.timeLimit) + " of Random " + name;
        } else {
            name = "Randomized " + name;
        }
    }

    const moreWords = getDrillWords(params.drill, +params.count || 0, wordSets).flat(2);
    console.log("moreWords", moreWords);
    const getMoreWords = (min) => {
        const output = [];
        while (output.length < min) {
            output.push(moreWords[Math.floor(Math.random() * moreWords.length)]);
        }
        return output.flat();
    };

    const exercise = new TypeJig.Exercise({
        words,
        seconds: timeLimit,
        endless: !!params.timeLimit,
        shuffle: params.type === "shuffled",
        getNextWords: params.timeLimit ? getMoreWords : undefined,
        maxLinesBeforeAppend: 10,
        seed: params.seed,
    });
    exercise.name = name;
    return exercise;
}

export function getDrillWords(drills, count, wordSets = WordSets) {
    if (!Array.isArray(drills)) drills = [drills];
    let name = "";
    /**
     * @type {Array<string>}
     */
    let words = [];
    for (let i = 0; i < drills.length; ++i) {
        let w = wordSets[drills[i]];
        console.log("Drill", drills[i], w);
        if (typeof w === "function") {
            const generateWord = w;
            // const n =
            //     Math.floor((count * (i + 1)) / drills.length) -
            //     Math.floor((count * i) / drills.length);
            // w = [];
            w = generateWord();
            console.log(w);
        }
        if (w) {
            const last = i === drills.length - 1;
            name = nameAnd(name, last, drills[i]);
            words = words.concat(w);
        }
    }

    console.log("getDrillWords" + name, words, drills);
    return words;
}

function nameAnd(name, last, clause) {
    if (name.length) {
        name += ", ";
        if (last) name += "and ";
    }
    return name + clause;
}

function timeString(minutes) {
    /**
     * @type {number | string}
     */
    let seconds = Math.round(60 * (minutes % 1));
    if (seconds < 10) seconds = "0" + seconds;
    minutes = Math.floor(minutes);
    return minutes + ":" + seconds;
}
