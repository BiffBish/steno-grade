// Number Sentences
// ================

import { TypeJig, pluralize, randomIntLessThan, randomize, rotateAndShuffle } from "./type-jig.mjs";
import { WordSets } from "./word-sets.mjs";

// Takes `timeLimit` parameter (floating-point minutes).
export function numberSentences(params) {
    const seconds = Math.round(60 * params.timeLimit);

    const nouns = WordSets.Nouns.slice();
    const actions = [].concat(
        WordSets.TransitiveVerbs.map(function (v) {
            return [v, "v"];
        }),
        WordSets.Adjectives.map(function (a) {
            return [a, "a"];
        })
    );
    randomize(nouns);
    randomize(actions);

    console.log(nouns, actions);

    console.log(nextNumberSentence(nouns, actions));
    const words = [];

    for (let i = 0; i < 1; i++) {
        words.push(nextNumberSentence(nouns, actions));
    }

    const getNextText = (min) => {
        const nextWords = nextNumberSentence(nouns, actions);
        return nextWords;
    };

    const exercise = new TypeJig.Exercise({
        name: "Number Sentences",
        words: words,
        maxLinesBeforeAppend: 10,
        endless: true,
        seconds: seconds,
        getNextWords: getNextText,
    });

    exercise.name = "Number Sentences";
    return exercise;
}

function nextNumberSentence(nouns, actions) {
    const type = [".", "!", "?", ","][randomIntLessThan(4)];
    const num = 2 + randomIntLessThan(98);
    const noun = pluralize(rotateAndShuffle(nouns));
    const action = rotateAndShuffle(actions);
    let tense;
    if (type === "?") tense = 0;
    else tense = randomIntLessThan(2);
    let s = nextNumberClause(nouns, num, noun, action, tense);
    s[s.length - 1] += type;
    if (type === "?") {
        if (action[1] === "v") {
            s.unshift(["Do", "Did"][randomIntLessThan(2)]);
        } else if (action[1] === "a") {
            const verb = ["Are", "Were"][randomIntLessThan(2)];
            s.splice(2, 1);
            s.unshift(verb);
        }
    } else if (type === ",") {
        const conj = ["but", "while", "so", "and", "or"];
        s.push(conj[randomIntLessThan(conj.length)]);
        const num = 2 + randomIntLessThan(98);
        const noun = pluralize(rotateAndShuffle(nouns));
        const action = rotateAndShuffle(actions);
        s = s.concat(nextNumberClause(nouns, num, noun, action, tense));
        s[s.length - 1] += ".";
    }
    return s;
}

function nextNumberClause(nouns, num, noun, action, tense) {
    if (action[1] === "v") {
        const verb = action[0][tense].split(" ");
        const num2 = 1 + randomIntLessThan(99);
        let noun2 = rotateAndShuffle(nouns);
        if (num2 > 1) noun2 = pluralize(noun2);
        return [].concat(num + "", noun, verb, num2 + "", noun2);
    } else {
        const verb = ["are", "were"];
        const adjective = action[0].split(" ");
        return [].concat(num + "", noun, verb[tense], adjective);
    }
}
