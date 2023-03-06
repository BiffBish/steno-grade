// Number Sentences
// ================

// Takes `timeLimit` parameter (floating-point minutes).
function numberSentences(params) {
    var seconds = Math.round(60 * params.timeLimit);

    let nouns = TypeJig.WordSets.Nouns.slice();
    let actions = [].concat(
        TypeJig.WordSets.TransitiveVerbs.map(function (v) {
            return [v, "v"];
        }),
        TypeJig.WordSets.Adjectives.map(function (a) {
            return [a, "a"];
        })
    );
    randomize(nouns);
    randomize(actions);

    console.log(nouns, actions);

    console.log(nextNumberSentence(nouns, actions));
    let words = [];

    for (let i = 0; i < 1; i++) {
        words.push(nextNumberSentence(nouns, actions));
    }

    const getNextText = (min) => {
        let nextWords = nextNumberSentence(nouns, actions);
        return nextWords;
    };

    let exercise = new TypeJig.Exercise(words, seconds, false, getNextText, 10);

    exercise.name = "Number Sentences";
    return exercise;
}

function getNumberText() {
    var sentence = (this.started ? " " : "") + this.nextSentence().join(" ");
    this.started = true;
    return sentence;
}

function nextNumberSentence(nouns, actions) {
    var type = [".", "!", "?", ","][randomIntLessThan(4)];
    var num = 2 + randomIntLessThan(98);
    var noun = pluralize(rotateAndShuffle(nouns));
    var action = rotateAndShuffle(actions);
    var tense;
    if (type === "?") tense = 0;
    else tense = randomIntLessThan(2);
    var s = nextNumberClause(nouns, num, noun, action, tense);
    s[s.length - 1] += type;
    if (type === "?") {
        if (action[1] === "v") {
            s.unshift(["Do", "Did"][randomIntLessThan(2)]);
        } else if (action[1] === "a") {
            var verb = ["Are", "Were"][randomIntLessThan(2)];
            s.splice(2, 1);
            s.unshift(verb);
        }
    } else if (type === ",") {
        var conj = ["but", "while", "so", "and", "or"];
        s.push(conj[randomIntLessThan(conj.length)]);
        var num = 2 + randomIntLessThan(98);
        var noun = pluralize(rotateAndShuffle(nouns));
        var action = rotateAndShuffle(actions);
        s = s.concat(nextNumberClause(nouns, num, noun, action, tense));
        s[s.length - 1] += ".";
    }
    return s;
}

function nextNumberClause(nouns, num, noun, action, tense) {
    if (action[1] === "v") {
        var verb = action[0][tense].split(" ");
        var num2 = 1 + randomIntLessThan(99);
        var noun2 = rotateAndShuffle(nouns);
        if (num2 > 1) noun2 = pluralize(noun2);
        return [].concat(num + "", noun, verb, num2 + "", noun2);
    } else {
        verb = ["are", "were"];
        var adjective = action[0].split(" ");
        return [].concat(num + "", noun, verb[tense], adjective);
    }
}
