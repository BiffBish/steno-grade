// import {SpectraRules} from "./rules.mjs";
// @ts-ignore

let SpectraRules = null;
// @ts-ignore
if (typeof importScripts === "function") {
    try {
        try {
            // @ts-ignore
            importScripts("./rules.mjs");
        } catch (e) {
            console.log("importScripts failed", e);
            // @ts-ignore
            importScripts("./spectra/rules.mjs");
        }
    } catch (e) {
        console.log("importScripts failed", e);
    }
    // @ts-ignore
    console.log("importScripts is defined", _SpectraRules);

    // @ts-ignore
    SpectraRules = _SpectraRules;
    // @ts-ignore
} else if (typeof require === "function") {
    console.log("require is defined");
    try {
        // @ts-ignore
        SpectraRules = require("./rules.mjs").SpectraRules;
    } catch (e) {
        // @ts-ignore
        SpectraRules = require("./spectra/rules.mjs").SpectraRules;
    }
    // @ts-ignore
    SpectraRules ??= window._SpectraRules;
} else {
    console.log("import is defined");
    import("./rules.mjs")
        .then((rules) => {
            // @ts-ignore
            // @ts-ignore
            SpectraRules = rules.SpectraRules;
            // @ts-ignore
            SpectraRules ??= window._SpectraRules;
        })
        .catch((e) => {
            console.log("import failed", e);
            // @ts-ignore
            SpectraRules = import("./spectra/rules.mjs").then((rules) => {
                SpectraRules = rules.SpectraRules;
            });
        })
        .catch((e) => {
            console.log("import failed", e);
            // @ts-ignore
            SpectraRules ??= window._SpectraRules;
        });
}
if (typeof window !== "undefined") {
    // @ts-ignore
    SpectraRules ??= window._SpectraRules;
}

// @ts-ignore
if (typeof _SpectraRules !== "undefined") {
    // @ts-ignore
    SpectraRules ??= _SpectraRules;
}
/* eslint-disable valid-jsdoc */
/* eslint-disable guard-for-in */
// @ts-ignore
// Spectra = {
//     /**
//      * @param {string} code
//      */
// };

/**
 *
 * @param {string} outline
 * @param {string} removing
 */
function removeStartingPart(depth, outline, removing, debug = false, randomNumber = 0) {
    // if (debug)
    //     console.log(
    //         "---".repeat(depth) + "Removing",
    //         removing,
    //         "from",
    //         outline + " " + randomNumber
    //     );
    let strokes = outline.split("/");
    // Remove the first part of the outline that matches the removing part and save it in a variable
    let resulting;
    let includeDash = false;
    let includeAsterisk = false;
    let firstStroke = strokes[0];
    if (firstStroke[0] == "-") {
        includeDash = true;
    }

    if (!firstStroke.startsWith(removing)) {
        if (firstStroke.match(/\*/)) {
            includeAsterisk = true;
            const firstStrokeHasMiddleCharacter = firstStroke.match(/[AOEU-]/);
            if (firstStrokeHasMiddleCharacter) {
                firstStroke = firstStroke.replace(/\*/, "");
            } else {
                firstStroke = firstStroke.replace(/\*/, "-");
            }

            if (!firstStroke.startsWith(removing)) {
                return "{ASTERAKS NO MATCH}";
            }
        } else {
            return "{NO MATCH}";
        }
    }

    resulting = firstStroke.substring(removing.length);
    // console.log("Resulting", resulting);
    if (removing.match(/[AOEU*-]/) && !resulting.match(/[AOEU*-]/)) {
        includeDash = true;
    }

    if (includeAsterisk) resulting = "*" + resulting;
    else if (includeDash) {
        resulting = "-" + resulting;
    }
    if (resulting == "-") resulting = "";
    // Add back in the other strokes seperated by a /

    strokes[0] = resulting;

    strokes = strokes.filter((stroke) => stroke != "");
    if (debug) {
        console.log(
            "---".repeat(depth) + "Removing",
            removing,
            "from",
            outline,
            ": ",
            strokes.join("/") + " " + randomNumber
        );
    }
    return strokes.join("/");
}

function haveCommonLetters(a, b) {
    for (const element of a) {
        if (b.indexOf(element) !== -1) {
            return true;
        }
    }
    return false;
}

// const leftRE = /[CLGZNJXBVFYQDM0123456789STKPWHR]/g;
// const vowelRE =
//     /AY|OA|OO|AW|EA|EE|OH|UU|OI|IE|OW|I|0|1|2|3|4|5|6|7|8|9|A|O|E|U/g;
// const _right_re =
//     /RBGS|KSHN|SHN|RCH|CH|SH|NG|NK|TH|K|J|N|M|0|1|2|3|4|5|6|7|8|9|\*|F|R|P|B|L|G|T|S|D|Z/g;
// const separationRE = /([^AOEUI*-]*)([AO*EUI-][AO*EUIHYW-]*|)(.*)/;

// function combineStrokeToOutline(stroke, outline) {
//     const strokes = outline.split("/");
//     const lastStroke = strokes[strokes.length - 1];

//     // console.log("Combining", stroke, "to", lastStroke);

//     const seperator = "_";

//     const [, lastLeft, lastVowel, lastRight] =
//         lastStroke.match(separationRE);

//     const [, strokeLeft, strokeVowel, strokeRight] =
//         stroke.match(separationRE);

//     if (outline == "") {
//         if (
//             !strokeLeft &&
//             strokeVowel &&
//             strokeRight &&
//             strokeVowel == "-"
//         ) {
//             return false;
//         }

//         return stroke;
//     }

//     if (!lastLeft && !lastVowel && lastRight) {
//         throw new Error("Invalid stroke" + lastStroke);
//     }

//     if (!strokeLeft && !strokeVowel && strokeRight) {
//         throw new Error("Invalid stroke" + stroke);
//     }

//     if (lastLeft && !lastVowel && lastRight) {
//         throw new Error("Invalid stroke" + lastStroke);
//     }

//     if (strokeLeft && !strokeVowel && strokeRight) {
//         throw new Error("Invalid stroke" + stroke);
//     }

//     if (strokeLeft && strokeVowel && !strokeRight) {
//         throw new Error("Invalid stroke" + stroke);
//     }

//     // S + R = SR
//     if (lastLeft && !lastVowel && strokeLeft && !strokeVowel) {
//         if (haveCommonLetters(lastLeft, strokeLeft)) {
//             // return outline + seperator + "/" + stroke;
//             return false;
//         }
//         return outline + seperator + stroke;
//     }

//     // S-R + R = S-R/R
//     if (lastLeft && lastVowel && lastRight && strokeLeft && !strokeVowel) {
//         return outline + seperator + "/" + stroke;
//     }

//     // S-R + -B = S-RB
//     if (
//         lastLeft &&
//         lastVowel &&
//         lastRight &&
//         !strokeLeft &&
//         strokeVowel &&
//         strokeRight
//     ) {
//         if (haveCommonLetters(lastRight, strokeRight)) {
//             // return outline + seperator + "/" + stroke;
//             return false;
//         }
//         return outline + seperator + strokeRight;
//     }

//     // -R + -B = -RB
//     if (
//         !lastLeft &&
//         lastVowel &&
//         lastRight &&
//         !strokeLeft &&
//         strokeVowel &&
//         strokeRight
//     ) {
//         if (haveCommonLetters(lastRight, strokeRight)) {
//             // return outline +seperator +  "/" + stroke;
//             return false;
//         }
//         return outline + seperator + strokeRight;
//     }

//     // -R + R = -R/R
//     if (
//         !lastLeft &&
//         lastVowel &&
//         lastRight &&
//         strokeLeft &&
//         !strokeVowel
//     ) {
//         return outline + seperator + "/" + stroke;
//     }

//     // S + -B = S-B
//     if (
//         lastLeft &&
//         !lastVowel &&
//         !strokeLeft &&
//         strokeVowel &&
//         strokeRight
//     ) {
//         return outline + seperator + stroke;
//     }

//     // E + T = E/T
//     if (
//         !lastLeft &&
//         lastVowel &&
//         strokeLeft &&
//         !strokeVowel &&
//         !strokeRight
//     ) {
//         return outline + seperator + "/" + stroke;
//     }

//     // S + E = SE
//     if (
//         lastLeft &&
//         !lastVowel &&
//         !strokeLeft &&
//         strokeVowel &&
//         !strokeRight
//     ) {
//         return outline + seperator + stroke;
//     }

//     // SE + S = SE/S
//     if (
//         lastLeft &&
//         lastVowel &&
//         !lastRight &&
//         strokeLeft &&
//         !strokeVowel
//     ) {
//         return outline + seperator + "/" + stroke;
//     }

//     // SE + EB = SE/EB
//     if (
//         lastLeft &&
//         lastVowel &&
//         !lastRight &&
//         !strokeLeft &&
//         strokeVowel &&
//         strokeRight
//     ) {
//         if (haveCommonLetters(lastVowel, strokeVowel)) {
//             // return outline + seperator + "/" + stroke;
//             return false;
//         }
//         return outline + seperator + strokeVowel + strokeRight;
//     }

//     // E + -B = EB

//     if (
//         !lastLeft &&
//         lastVowel &&
//         !lastRight &&
//         !strokeLeft &&
//         strokeVowel &&
//         strokeRight
//     ) {
//         if (haveCommonLetters(lastVowel, strokeVowel)) {
//             // return outline + seperator + "/" + stroke;
//             return false;
//         }
//         return outline + seperator + strokeVowel + strokeRight;
//     }

//     // -B + E = B/E
//     if (
//         !lastLeft &&
//         lastVowel &&
//         lastRight &&
//         !strokeLeft &&
//         strokeVowel &&
//         !strokeRight
//     ) {
//         return outline + seperator + "/" + stroke;
//     }

//     // S-B + E = S-B/E
//     if (
//         lastLeft &&
//         lastVowel &&
//         lastRight &&
//         !strokeLeft &&
//         strokeVowel &&
//         !strokeRight
//     ) {
//         return outline + seperator + "/" + stroke;
//     }

//     console.log("Unknown combination", stroke, outline);
//     console.log(
//         `[${lastLeft}, ${lastVowel}, ${lastRight}] + [${strokeLeft}, ${strokeVowel}, ${strokeRight}]`,
//     );
//     throw new Error("Unknown combination");
// }

/**
 * A number, or a string containing a number.
 * @typedef {{
 *      ruleName: string,
 *      target: string,
 *      outline: string,
 *      description: string,
 *      ruleSound: string[],
 *      subRules: TestingRule[],
 *  }
 * } TestingRule
 */

/**
 * A number, or a string containing a number.
 * @typedef {{
 *      rule: TestingRule,
 *      identifier: number,
 *      inputOutline: string,
 *      inputTarget: string,
 *      remainingOutline: string,
 *      remainingTarget: string,
 *      skippedLetters: number,
 *  }
 * } TestRuleResult
 */

/**
 * A number, or a string containing a number.
 * @typedef {{
 *      rule: TestingRule,
 *      subResult: UnpackedResult[],
 *      inputOutline: string,
 *      inputTarget: string,
 *      remainingOutline: string,
 *      remainingTarget:string,
 *      skippedLetters: number,
 *  }
 * } UnpackedResult
 */

/**
 *
 * @param {UnpackedResult[][]} results
 */

/**
 * A processed Rule
 * @typedef { TestingRule & {
 *    wordNum: number,
 * }
 * } ProcessedRule
 *
/**
 * A processed Result
 * @typedef {{
 *      rules: ProcessedRule[],
 *      skippedLetterCount:number,
 *      skippedKeyCount:number,
 *      skippedKeys: string,
 *      outline: string,
 *  }
 * } ProcessedResult
 */

/**
 * A processed Result
 * @param {(UnpackedResult[])[]} results
 * @param {string} outline
 * @return {ProcessedResult}
 */
function processResults(results, outline) {
    let bestPerformer = null;
    results.forEach((result) => {
        /**
         * @type {ProcessedResult}
         */
        const returnValue = {
            outline: outline,
            skippedKeyCount: 0,
            skippedKeys: "",
            skippedLetterCount: 0,
            rules: [],
        };
        const numOfWords = result[0].inputOutline.split("/").length;
        result.forEach((res) => {
            const rule = res.rule;
            returnValue.rules.push({
                ...rule,
                wordNum: numOfWords - res.inputOutline.split("/").length,
            });
            returnValue.skippedLetterCount += res.skippedLetters;
        });
        if (bestPerformer == null) bestPerformer = returnValue;

        if (returnValue.skippedLetterCount < bestPerformer.skippedLetterCount) {
            bestPerformer = returnValue;
        }
    });
    return bestPerformer;
}

/**
 * @param {UnpackedResult[]} results
 * @return {(UnpackedResult[])[]}
 */
function unpackRecursively(results) {
    const finalResult = [];
    if (!results) return [];
    if (results === undefined) return [[]];

    results.forEach((element) => {
        if (element.subResult.length == 0) {
            finalResult.push([element]);
            return;
        }
        for (const el of unpackRecursively(element.subResult)) {
            finalResult.push([element, ...el]);
        }
    });
    return finalResult;
}

// const defaultRules = {
//     rules: [
//         {
//             param: "stroke",
//             type: "minimize",
//         },
//         {
//             param: "skippedKeys",
//             type: "minimize",
//         },
//         {
//             param: "skippedLetters",
//             type: "minimize",
//         },
//     ],
// };

const breifRules = {
    title: "Breif",
    rules: [
        {
            param: "stroke",
            type: "minimize",
        },
        {
            param: "skippedKeys",
            type: "minimize",
        },
        {
            param: "skippedLetters",
            type: "minimize",
        },
        {
            param: "rules",
            type: "minimize",
        },
        {
            param: "Keys",
            type: "minimize",
        },
    ],
};

const mostAccurateRules = {
    title: "Most Accurate",
    rules: [
        {
            param: "skippedLetters",
            type: "minimize",
        },
        {
            param: "skippedKeys",
            type: "minimize",
        },
        {
            param: "stroke",
            type: "minimize",
        },
        {
            param: "Asterisk",
            type: "minimize",
        },
        {
            param: "rules",
            type: "minimize",
        },
        {
            param: "Keys",
            type: "minimize",
        },
    ],
};

const analysisParameters = {
    rules: [mostAccurateRules, breifRules],
};

/**
 * @typedef {{
 *   rules: {
 *       param: string,
 *       type: string,
 *   }[],
 *   title: string,
 * }} SortingRules
 */

/**
 * @param {ProcessedResult} best
 * @param {ProcessedResult} processed
 * @param {SortingRules} sortingRules
 * @return {number}
 * @description Compares two ProcessedResults and returns a number based on which one is better.
 * 1 if a is better, -1 if b is better, 0 if they are equal.
 */
function comparePreformer(best, processed, sortingRules) {
    /**
     * @type {*}
     */
    let a;
    /**
     * @type {*}
     */
    let b;
    const res = ((a, b) => {
        for (const rule of sortingRules.rules) {
            switch (rule.param) {
            case "stroke":
                a = processed.outline.split("/").length;
                b = best.outline.split("/").length;
                if (a < b) {
                    return 1;
                }
                if (a > b) {
                    return -1;
                }
                break;
            case "skippedLetters":
                a = processed.skippedLetterCount;
                b = best.skippedLetterCount;
                if (a < b) {
                    return 1;
                }
                if (a > b) {
                    return -1;
                }
                break;
            case "skippedKeys":
                a = processed.skippedKeyCount;
                b = best.skippedKeyCount;
                if (a < b) {
                    return 1;
                }
                if (a > b) {
                    return -1;
                }
                break;
            case "rules":
                a = processed.rules.length;
                b = best.rules.length;
                if (a < b) {
                    return 1;
                }
                if (a > b) {
                    return -1;
                }
                break;

            case "Asterisk":
                // The number of "*" characters in the outline
                a = processed.outline.match(/\*/g)?.length || 0;
                b = best.outline.match(/\*/g)?.length || 0;
                if (a < b) {
                    return 1;
                }
                if (a > b) {
                    return -1;
                }
                break;
            case "Keys":
                // The number of keys in the outline
                a = processed.outline.length;
                b = best.outline.length;
                if (a < b) {
                    return 1;
                }
                if (a > b) {
                    return -1;
                }
                break;
            default:
                break;
            }
        }
        return 0;
    })(a, b);
    return res;
}

/**
 * @typedef {{
 *    title: string,
 *    res: ProcessedResult,
 * }[] | null} AnalyzeResult
 */

/**
 *
 * @param {*} outlines
 * @param {*} target
 * @return {AnalyzeResult}
 *
 */
function _analyze(outlines, target) {
    // target = target.toLowerCase();

    //Lowercase the target if it is not a stanalone vowel
    // console
    if (target.match(/[AEIOU]/g) == null) {
        target = target.toLowerCase();
    }
    const results = [];
    for (const sortingRules of analysisParameters.rules) {
        const parameters = {
            maxOneRuleSkip: 0,
            maxSkippedKeys: 0,
            maxSkippedLetters: 0,
        };
        /**
         * @type {ProcessedResult|null}
         */
        let bestPerformer = null;
        // Reduce the outlines to the ones with the least amount of /

        let smallestNumOfSlashes = Infinity;
        outlines.forEach((outline) => {
            if (outline.split("/").length < smallestNumOfSlashes) {
                smallestNumOfSlashes = outline.split("/").length;
            }
        });
        if (sortingRules.rules[0].param == "stroke") {
            outlines = outlines.filter((outline) => outline.split("/").length == smallestNumOfSlashes);
        }

        for (let index = 0; index < 3; index++) {
            outlines.forEach((outline) => {
                // outline = "PH*ET/SEUL/*EUPB";
                const result = findRulesThatFitRecursively(
                    {},
                    0,
                    outline,
                    target.replace(" ", ""),
                    false,
                    {},
                    parameters
                );
                if (result == null) return;

                const unpacked = unpackRecursively(result);
                const processed = processResults(unpacked, outline);

                if (processed == null) return;
                if (bestPerformer == null) {
                    bestPerformer = {
                        ...processed,
                        outline: outline,
                    };
                    return;
                }
                if (comparePreformer(bestPerformer, processed, sortingRules) == 1) {
                    bestPerformer = {
                        ...processed,
                        outline: outline,
                    };
                }
            });
            if (bestPerformer == null) {
                parameters.maxOneRuleSkip += 3;
                parameters.maxSkippedKeys += 1;
                parameters.maxSkippedLetters += 3;
            } else {
                // break;
            }

            if (bestPerformer != null) {
                break;
            }
        }

        // console.log("Best Performer", bestPerformer);
        if (bestPerformer === null) {
            break;
        }
        results.push({
            title: sortingRules.title,
            res: bestPerformer,
        });
    }
    if (results.length == 0) {
        return null;
    }
    return results;
}

// @ts-ignore
function testRuleOutline(depth, ruleOutline, outline) {
    // console.log(
    //     "---".repeat(depth) + "Testing rule outline",
    //     ruleOutline,
    //     "on",
    //     outline
    // );
    const firstWord = outline.split("/")[0];

    if (outline == "*" && !firstWord.match(/\*/)) return false;

    // Catch the trivial cases
    if (outline.startsWith(ruleOutline)) return true;

    if (!(!ruleOutline.match(/\*/) && firstWord.match(/\*/))) return false;
    // If theres a astersk remaning but no astersk in the rule
    // Because asterisks can be used in a later rule we will allow under some conditions

    // We need to remove the asterisk from the first word while following steno rules

    const firstWordHasMiddleCharacter = firstWord.match(/[AOEU-]/);

    if (firstWordHasMiddleCharacter) {
        const firstWordWithoutAsterisk = firstWord.replace(/\*/, "");

        if (firstWordWithoutAsterisk.startsWith(ruleOutline)) return true;
        return false;
    }

    // Replace the asterisk with a dash
    const firstWordWithoutAsterisk = firstWord.replace(/\*/, "-");

    if (firstWordWithoutAsterisk.startsWith(ruleOutline)) return true;
    return false;
}
/**
 * @param {*} memorizedData The memorized data
 * @param {number} depth The depth of the recursion
 * @param {string} inputOutline The outline string
 * @param {string} ruleName The rule name
 * @param {string} inputTarget The target string
 * @param {boolean} debug Debug mode
 * @return {null | TestRuleResult}
 */
function testRule(memorizedData, depth, inputOutline, ruleName, inputTarget, debug = false) {
    const randomNumber = Math.floor(Math.random() * 10000000);

    if (inputTarget == "" || inputOutline == "") return null;

    const rules = SpectraRules;
    const ruleDef = rules[ruleName];

    if (ruleDef == undefined) {
        console.log("Rule not found", ruleName, rules);
        return null;
    }

    /**
     * @type {TestingRule}
     */
    const rule = {
        ruleName: ruleName,
        description: ruleDef[4],
        ruleSound: ruleDef[2],
        outline: ruleDef[0],
        target: ruleDef[1],
        subRules: [],
    };

    if (rule == undefined) return null;

    if (debug) {
        console.log(
            `${"---".repeat(depth)} Testing rule : ["${ruleName}", "${rule.target}", "${
                rule.outline
            }"] ["${inputTarget}", "${inputOutline}"] ${randomNumber}`
        );
    }

    const letterParts = rule.target.match(/\(.*?\)|[^\(]*/g);

    let remainingTargetLetters = inputTarget;
    let remainingOutlineLetters = inputOutline;
    const skippedLetters = 0;

    /**
     * @type {TestingRule[]}
     */
    const subRules = [];
    for (const letterPart of letterParts) {
        if (letterPart == "") continue;
        if (debug) {
            console.log("---".repeat(depth) + "-LetterPart", letterPart, randomNumber);
        }

        // Handle sub rules
        if (letterPart.startsWith("(")) {
            let subRuleName = letterPart.substring(1, letterPart.length - 1);
            let optional = false;
            if (subRuleName.startsWith("|")) {
                optional = true;
                subRuleName = subRuleName.substring(1);
            }
            const result = testRule(
                memorizedData,
                depth + 1,
                remainingOutlineLetters,
                subRuleName,
                remainingTargetLetters,
                debug
            );

            if (debug) {
                console.log("---".repeat(depth) + "-SubRuleName", subRuleName, randomNumber);
                console.log("---".repeat(depth) + "-SubRuleName Result: ", result);
            }

            if (!result) {
                if (optional) {
                    continue;
                }
                return null;
            }
            subRules.push(result.rule);

            remainingOutlineLetters = result.remainingOutline;
            remainingTargetLetters = result.remainingTarget;
            continue;
        }

        if (!remainingTargetLetters.startsWith(letterPart)) {
            return null;
        }
        remainingTargetLetters = remainingTargetLetters.substring(letterPart.length);
        if (debug) {
            console.log("---".repeat(depth) + "-LetterPart Matches", letterPart, remainingTargetLetters);
        }
    }

    remainingOutlineLetters = removeStartingPart(depth, inputOutline, rule.outline, debug, randomNumber);
    if (debug) {
        console.log("---".repeat(depth) + "RemainingOutline", remainingOutlineLetters, randomNumber);
    }

    rule.subRules = subRules;
    return {
        rule: rule,

        inputOutline: inputOutline,
        inputTarget: inputTarget,

        skippedLetters: skippedLetters,

        remainingOutline: remainingOutlineLetters,
        remainingTarget: remainingTargetLetters,

        identifier: randomNumber,
    };
}
/**
 *
 * @param {*} memorizedData
 * @param {*} depth
 * @param {*} outline
 * @param {*} target
 * @param {*} debug
 * @param {*} currentParameters
 * @param {*} acceptableParameters
 * @return {UnpackedResult[]}
 */
function findRulesThatFitRecursively(
    memorizedData,
    depth,
    outline,
    target,
    debug = false,
    currentParameters = {},
    acceptableParameters = {}
) {
    currentParameters.skippedKeys ??= 0;
    currentParameters.skippedLetters ??= 0;

    /**
     * @type {UnpackedResult[]} workingRules
     */
    const workingRules = [];

    if (target == "" || outline == "") {
        return [];
    }

    if (debug) {
        console.log("---".repeat(depth) + "FindRulesThatFitRecursively", outline + "_" + target);
    }
    if (memorizedData[outline + "_" + target]) {
        if (debug) console.log("---".repeat(depth) + "Memorized");
        return memorizedData[outline + "_" + target];
    }

    const rules = SpectraRules;

    for (const ruleName in rules) {
        if (debug) {
            // console.log(" --- ".repeat(depth) + "Testing rule :" + ruleName);
        }

        let ruleResult = null;
        let testingTarget = target;
        const rule = rules[ruleName];

        if (!testRuleOutline(depth, rule[0], outline)) continue;

        if (!haveCommonLetters(rule[1], target) && !rule[1].includes("(")) {
            if (debug) {
                console.log(`${"---".repeat(depth)} No common letters ${rule[1]} ${target}`);
            }
            continue;
        }

        const parameters = { ...currentParameters };
        let skippedLetters = 0;

        for (let i = parameters.skippedLetters; i <= acceptableParameters.maxSkippedLetters; i++) {
            ruleResult = testRule(memorizedData, depth, outline, ruleName, testingTarget, debug);

            if (ruleResult) {
                if (ruleResult.remainingOutline == "" && ruleResult.remainingTarget == "") {
                    break;
                }

                if (ruleResult.remainingOutline == "" && ruleResult.remainingTarget != "") {
                    skippedLetters += ruleResult.remainingTarget.length;
                    ruleResult.remainingTarget = "";
                    break;
                }

                if (ruleResult.remainingOutline != "" && ruleResult.remainingTarget == "") {
                    parameters.skippedKeys += ruleResult.remainingOutline.length;
                    ruleResult.remainingOutline = "";
                }
                break;
            }

            skippedLetters++;

            testingTarget = testingTarget.substring(1);
            if (testingTarget == "") {
                break;
            }

            if (debug) {
                console.log("---".repeat(depth) + "-Rule", ruleName, "does not fit, skipping one letter");
            }
        }

        if (
            !ruleResult ||
            parameters.skippedKeys > acceptableParameters.maxSkippedKeys ||
            parameters.skippedLetters + skippedLetters > acceptableParameters.maxSkippedLetters
        ) {
            continue;
        }

        parameters.skippedLetters += skippedLetters;

        if (ruleResult.remainingOutline != "" && ruleResult.remainingTarget == "") {
            console.error("Rule " + ruleName + " is not valid", ruleResult);
            throw new Error("Rule " + ruleName + " is not valid");
        }

        if (debug) {
            console.log(
                `${"---".repeat(depth)}-Rule ["${ruleName}"] fits, result: [${ruleResult.remainingOutline}] [${
                    ruleResult.remainingTarget
                }]`
            );
        }

        const subResult = findRulesThatFitRecursively(
            memorizedData,
            depth + 1,
            ruleResult.remainingOutline,
            ruleResult.remainingTarget,
            debug,
            parameters,
            acceptableParameters
        );
        if (debug) console.log("---".repeat(depth) + "-SubResult", subResult);

        const skippedKeys = (currentParameters?.skippedKeys ?? 0) + ruleResult.remainingOutline.length;

        if (subResult) {
            workingRules.push({
                rule: ruleResult.rule,
                inputOutline: ruleResult.inputOutline,
                inputTarget: ruleResult.inputOutline,
                remainingOutline: ruleResult.remainingOutline,
                remainingTarget: ruleResult.remainingTarget,
                skippedLetters: skippedLetters,
                subResult: subResult,
            });
        }

        if (skippedKeys > 2) {
            continue;
        }
    }

    memorizedData[outline + "_" + target] = workingRules;
    if (workingRules.length == 0) {
        memorizedData[outline + "_" + target] = null;
        return null;
    }
    return workingRules;
}

// function GenerateOutlinesFromInputRecursively(target, outline, depth) {
//     // console.log("GenerateOutlinesFromInputRecursively", target, outline, depth);
//     if (depth > 10) {
//         return [];
//     }

//     if (target == "") {
//         return [outline];
//     }
//     const rules = GeneratorRules;
//     let outlines = [];
//     for (const ruleName in rules) {
//         const rule = rules[ruleName];
//         if (rule[1].length == 0) {
//             continue;
//         }

//         if (target.startsWith(rule[1])) {
//             if (rule[3] == "REFERENCE") {
//                 continue;
//             }
//             // var newOutline = combineStrokeToOutline(rule[0],outline);
//             const newOutlineB = combineStrokeToOutline(rule[0], outline);
//             const newOutline = `$${ruleName}$` + newOutlineB;
//             if (!newOutlineB) {
//                 continue;
//             }
//             const newTarget = target.substring(rule[1].length);
//             const newOutlines = GenerateOutlinesFromInputRecursively(
//                 newTarget,
//                 newOutline,
//                 depth + 1,
//             );
//             outlines = outlines.concat(newOutlines);
//         }
//     }
//     return outlines;
// }

// //If this is a module then export _analyze
// if (typeof module !== "undefined") {
//     module.exports = {
//         _analyze,
//         Tesging: "Testing",
//     };
// }

// if (typeof self !== 'undefined' && typeof self.importScripts === 'function') {
//   // We're being loaded with importScripts(), so we need to assign the function to self.
//   self._analyze = _analyze;
// } else {
//   // We're being loaded as a module, so we can export the function.
//   module.exports = _analyze;
// }
// @ts-ignore
self._analyze = _analyze;
