// @ts-ignore
Spectra = {
    /**
     * @param {string} code
     */
};













/**
 *
 * @param {string} outline
 * @param {string} removing
 */
function removeStartingPart(
    depth,
    outline,
    removing,
    debug = false,
    randomNumber = 0
) {
    if (debug)
        console.log(
            "---".repeat(depth) + "Removing",
            removing,
            "from",
            outline + " " + randomNumber
        );
    var strokes = outline.split("/");
    //Remove the first part of the outline that matches the removing part and save it in a variable
    var resulting;
    let includeDash = false;
    let includeAsterisk = false;
    let firstStroke = strokes[0];
    if (firstStroke[0] == "-") {
        includeDash = true;
    }

    if (!firstStroke.startsWith(removing)) {
        if (firstStroke.match(/\*/)) {
            includeAsterisk = true;
            let firstStrokeHasMiddleCharacter = firstStroke.match(/[AOEU-]/);
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
    //Add back in the other strokes seperated by a /

    strokes[0] = resulting;

    strokes = strokes.filter((stroke) => stroke != "");
    if (debug)
        console.log(
            "---".repeat(depth) + "Removing",
            removing,
            "from",
            outline,
            ": ",
            strokes.join("/") + " " + randomNumber
        );
    return strokes.join("/");
}





function haveCommonLetters(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (b.indexOf(a[i]) !== -1) {
      return true;
    }
  }
  return false;
}




let _left_re = /[CLGZNJXBVFYQDM0123456789STKPWHR]/g;
let _vowel_re =
    /AY|OA|OO|AW|EA|EE|OH|UU|OI|IE|OW|I|0|1|2|3|4|5|6|7|8|9|A|O|E|U/g;
let _right_re =
    /RBGS|KSHN|SHN|RCH|CH|SH|NG|NK|TH|K|J|N|M|0|1|2|3|4|5|6|7|8|9|\*|F|R|P|B|L|G|T|S|D|Z/g;
let _separation_re = /([^AOEUI*-]*)([AO*EUI-][AO*EUIHYW-]*|)(.*)/;

function combineStrokeToOutline(stroke, outline) {
   
     
    var strokes = outline.split("/");
    var lastStroke = strokes[strokes.length - 1];

    // console.log("Combining", stroke, "to", lastStroke);

    var seperator = "_";


    let [_, last_left, last_vowel, last_right] = lastStroke.match(_separation_re);

    let [__, stroke_left, stroke_vowel, stroke_right] = stroke.match(_separation_re);


     if (outline == "") {

        if (!stroke_left && stroke_vowel && stroke_right && stroke_vowel == "-") {
            return false;
        }
         
        return stroke;
     }

        
    if (!last_left && !last_vowel && last_right) {
        throw "Invalid stroke" + lastStroke;
    }

    if (!stroke_left && !stroke_vowel && stroke_right) {
        throw "Invalid stroke" + stroke;

    }

    if (last_left && !last_vowel && last_right) {
        throw "Invalid stroke" + lastStroke;
    }

    if (stroke_left && !stroke_vowel && stroke_right) {
        throw "Invalid stroke" + stroke;
    }

    if (stroke_left && stroke_vowel && !stroke_right) {
        throw "Invalid stroke" + stroke;
    }



    // S + R = SR
    if (last_left && !last_vowel && stroke_left && !stroke_vowel) {
        if (haveCommonLetters(last_left, stroke_left)) {
            // return outline + seperator + "/" + stroke;
            return false;
        }
        return outline + seperator + stroke;
    }

    // S-R + R = S-R/R
    if (last_left && last_vowel && last_right && stroke_left && !stroke_vowel) {
        return outline + seperator + "/" + stroke;
    }

    // S-R + -B = S-RB
    if (last_left && last_vowel && last_right && !stroke_left && stroke_vowel && stroke_right) {
        if (haveCommonLetters(last_right, stroke_right)) {
            // return outline + seperator + "/" + stroke;
            return false;

        }
        return outline + seperator + stroke_right;
    }

    // -R + -B = -RB
    if (!last_left && last_vowel && last_right && !stroke_left && stroke_vowel && stroke_right) {
        if (haveCommonLetters(last_right, stroke_right)) {
            // return outline +seperator +  "/" + stroke;
            return false;

        }
        return outline +seperator +  stroke_right;
    }

    // -R + R = -R/R
    if (!last_left && last_vowel && last_right && stroke_left && !stroke_vowel) {
        return outline +seperator +  "/" + stroke;
    }

    // S + -B = S-B
    if (last_left && !last_vowel && !stroke_left && stroke_vowel && stroke_right) {
        return outline + seperator + stroke;
    }

    // E + T = E/T
    if (!last_left && last_vowel && stroke_left && !stroke_vowel && !stroke_right) {
        return outline + seperator + "/" + stroke;
    }

    // S + E = SE
    if (last_left && !last_vowel && !stroke_left && stroke_vowel && !stroke_right) {
        return outline + seperator + stroke;
    }

    // SE + S = SE/S
    if (last_left && last_vowel && !last_right && stroke_left && !stroke_vowel) {
        return outline + seperator + "/" + stroke;
    }


    // SE + EB = SE/EB
    if (last_left && last_vowel && !last_right && !stroke_left && stroke_vowel && stroke_right) {
        if (haveCommonLetters(last_vowel, stroke_vowel)) {
            // return outline + seperator + "/" + stroke;
            return false;

        }
        return outline + seperator + stroke_vowel + stroke_right;
    }

    // E + -B = EB

    if (!last_left && last_vowel && !last_right && !stroke_left && stroke_vowel && stroke_right) {
        if (haveCommonLetters(last_vowel, stroke_vowel)) {
            // return outline + seperator + "/" + stroke;
            return false;
        }
        return outline + seperator + stroke_vowel + stroke_right;
    }

    // -B + E = B/E
    if (!last_left && last_vowel && last_right && !stroke_left && stroke_vowel && !stroke_right) {
        return outline + seperator + "/" + stroke;
    }

    // S-B + E = S-B/E
    if (last_left && last_vowel && last_right && !stroke_left && stroke_vowel && !stroke_right) {
        return outline + seperator + "/" + stroke;
    }
        
        






    console.log("Unknown combination", stroke, outline);
    console.log(`[${last_left}, ${last_vowel}, ${last_right}] + [${stroke_left}, ${stroke_vowel}, ${stroke_right}]`);
    throw "Unknown combination";
}

        
















/**
 * A number, or a string containing a number.
 * @typedef {{
 *      inputOutline: string
 *      inputTarget: string,
 *      outline: string,
 *      remainingOutline: string,
 *      remainingTarget:string,
 *      ruleName: string,
 *      ruleSound: string,
 *      description: string,
 *      subRules: UnpackedRule[],
 *      skippedLetters: number,
 *      target: string,
 *  }
 * } UnpackedRule
 */

/**
 *
 * @param {UnpackedRule[][]} results
 */

/**
 * A processed Rule
 * @typedef {{
 *      name:string,
 *      target:string,
 *      outline:string,
 *      skippedLetters:number
 *      ruleSound:string,
 *      description:string,
 *      subRules: UnpackedRule[],
 *      wordNum:number,
 *  }
 * } ProcessedRule
 * 
/**
 * A processed Result
 * @typedef {{
 *      rules: ProcessedRule[] ,
 *      skippedLetterCount:number,
 *      skippedKeyCount:number, 
 *      skippedKeys: string,
 *      outline: string,
 *  }
 * } ProcessedResult
 */

/**
 *
 * @param { UnpackedRule[][]} results
 * @returns {ProcessedResult | null}
 */
function processResults(results, outline) {
    let bestPerformer = null;
    results.forEach((result) => {
        /**
         * @type {ProcessedResult}
         */
        var returnValue = {
            outline: outline,
            skippedKeyCount: 0,
            skippedKeys: "",
            skippedLetterCount: 0,
            rules: [],
        };
        var numOfWords = result[0].inputOutline.split("/").length;
        // console.log("numOfWords : ", result[0]);
        // console.log("numOfWords : ", numOfWords);
        result.forEach((rule) => {
            returnValue.rules.push({
                name: rule.ruleName,
                target: rule.target,
                outline: rule.outline,
                ruleSound: rule.ruleSound,
                description: rule.description,
                remaningOutline: rule.remainingOutline,
                subRules: rule.subRules,
                skippedLetters: rule.skippedLetters,
                wordNum: numOfWords - rule.inputOutline.split("/").length,
            });
            // returnValue.skippedKeyCount += rule.;
            returnValue.skippedLetterCount += rule.skippedLetters;
        });
        if (bestPerformer == null) bestPerformer = returnValue;

        if (returnValue.skippedLetterCount < bestPerformer.skippedLetterCount) {
            bestPerformer = returnValue;
        }
    });
    return bestPerformer;
}

/**
 * @param {*} result
 * @returns {UnpackedRule[][]}
 */
function UnpackRecursively(result) {
    var finalResult = [];
    // console.log("Processing Result");
    if (!result) return [];
    if (result?.subResults === undefined) return [[]];
    result.subResults.forEach((element, index) => {
        // console.log("element", element);

        if (element.subResult === true) {
            // console.log("TRUE ELEMENT", element);
            finalResult.push([element]);
            return;
            // return [[element]];
        }
        var newResult = UnpackRecursively(element.subResult);
        // element.subResult = [];
        for (let i = 0; i < newResult.length; i++) {
            finalResult.push([element, ...newResult[i]]);
        }
    });
    return finalResult;
}


var defaultRules = {
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
    ],
};

var breifRules = {
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

var mostAccurateRules = {
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

var analysisParameters = {
    rules: [mostAccurateRules, breifRules],
};

/**
 * @param {ProcessedResult} best
 * @param {ProcessedResult} processed
 * @returns {number}
 * @description Compares two ProcessedResults and returns a number based on which one is better.
 * 1 if a is better, -1 if b is better, 0 if they are equal.
 */
function ComparePreformer(best, processed, sortingRules) {
    console.log("Comparing", best, processed);

    /**
     * @type {*}
     */
    let a;
    /**
     * @type {*}
     */
    let b;
    let res = ((a, b) => {
        for (const rule of sortingRules.rules) {
            console.log("Comparing rule", rule, sortingRules);
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
                    //The number of "*" characters in the outline
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
                    //The number of keys in the outline
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
    console.log("Comparing Result", res);
    return res;
}

//Define an Analyze result

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
 * @returns {AnalyzeResult}
 *
 */
function Analyze(outlines, target) {
    console.log("Analyzing", outlines, target);
    target = target.toLowerCase();
    // outlines = ["KPAPL"];

    const results = [];
    for (const sortingRules of analysisParameters.rules) {
        let parameters = {
            maxOneRuleSkip: 0,
            maxSkippedKeys: 0,
            maxSkippedLetters: 0,
        };
        /**
         * @type {ProcessedResult|null}
         */
        let bestPerformer = null;
        //Reduce the outlines to the ones with the least amount of /

        let smallestNumOfSlashes = Infinity;
        outlines.forEach((outline) => {
            if (outline.split("/").length < smallestNumOfSlashes) {
                smallestNumOfSlashes = outline.split("/").length;
            }
        });
        console.log("Smallest number of slashes", smallestNumOfSlashes);
        if (sortingRules.rules[0].param == "stroke") {
            outlines = outlines.filter(
                (outline) => outline.split("/").length == smallestNumOfSlashes
            );
        }

        // console.log("Analyzing :" + outlines, target);

        for (let index = 0; index < 5; index++) {
            outlines.forEach((outline) => {
                console.log("Trying :", index, outline);
                // console.log("outline", outline);

                // outline = "PH*ET/SEUL/*EUPB";
                var result = FindRulesThatFitRecursively(
                    {},
                    0,
                    outline,
                    target.replace(" ", ""),
                    false,
                    {},
                    parameters
                );
                if (result == null) return;
                var unpacked = UnpackRecursively(result);
                var processed = processResults(unpacked, outline);

                if (processed == null) return;
                if (bestPerformer == null) {
                    bestPerformer = {
                        ...processed,
                        outline: outline,
                    };
                    return;
                }
                console.log("Comparing", bestPerformer, processed);
                if (
                    ComparePreformer(bestPerformer, processed, sortingRules) ==
                    1
                ) {
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
    console.log("Analyzing :" + outlines, target, results);
    return results;
}

//Lets try a recursive solution

function TestRuleOutline(depth, ruleOutline, outline) {
    // console.log(
    //     "---".repeat(depth) + "Testing rule outline",
    //     ruleOutline,
    //     "on",
    //     outline
    // );
    var firstWord = outline.split("/")[0];

    if (outline == "*" && !firstWord.match(/\*/)) return false;

    //Catch the trivial cases
    if (outline.startsWith(ruleOutline)) return true;

    if (!(!ruleOutline.match(/\*/) && firstWord.match(/\*/))) return false;
    //If theres a astersk remaning but no astersk in the rule
    //Because asterisks can be used in a later rule we will allow under some conditions

    //We need to remove the asterisk from the first word while following steno rules

    let firstWordHasMiddleCharacter = firstWord.match(/[AOEU-]/);

    if (firstWordHasMiddleCharacter) {
        let firstWordWithoutAsterisk = firstWord.replace(/\*/, "");

        if (firstWordWithoutAsterisk.startsWith(ruleOutline)) return true;
        return false;
    }

    //Replace the asterisk with a dash
    let firstWordWithoutAsterisk = firstWord.replace(/\*/, "-");

    if (firstWordWithoutAsterisk.startsWith(ruleOutline)) return true;
    return false;
}

/**
 *
 * @param {*} outline
 * @param {*} ruleName
 * @param {*} target
 * @returns {false | object}
 */
function TestRule(
    memorizedData,
    depth,
    outline,
    ruleName,
    target,
    debug = false,
    currentParameters,
    acceptableParameters
) {
    // if (ruleName == "ex.") debug = true;
    // if(memorizedData[ruleName]){

    // if (ruleName != "!c") debug = false;
    let randomNumber = Math.floor(Math.random() * 10000000);

    if (target == "" && outline == "") return false;
    var rules = SpectraRules;
    // console.log(ruleName);
    let rule = rules[ruleName];
    if (rule == undefined) return false;
    let ruleSound = [rule[2]];

    if (!TestRuleOutline(depth, rule[0], outline)) return false;
    if (debug)
        console.log(
            "---".repeat(depth) + "Testing rule :" + ruleName,
            target,
            outline,
            randomNumber,
            currentParameters
        );

    let letterFit = rule[1];

    let letterParts = letterFit.match(/\(.*?\)|[^\(]*/g);

    let remainingTargetLetters = target;
    let remainingOutlineLetters = outline;
    let skippedLetters = 0;
    let subRules = [];
    for (const letterPart of letterParts) {
        if (letterPart == "") continue;
        if (debug)
            console.log(
                "---".repeat(depth) + "-LetterPart",
                letterPart,
                randomNumber
            );

        //Handle sub rules
        if (letterPart.startsWith("(")) {
            let subRuleName = letterPart.substring(1, letterPart.length - 1);
            if (debug)
                console.log(
                    "---".repeat(depth) + "-SubRuleName",
                    subRuleName,
                    randomNumber
                );

            let result = TestRule(
                memorizedData,
                depth + 1,
                remainingOutlineLetters,
                subRuleName,
                remainingTargetLetters,
                debug,
                currentParameters,
                acceptableParameters
            );
            if (debug)
                console.log(
                    "---".repeat(depth) + "-SubRuleName Result: ",
                    result
                );
            subRules.push(result);
            // ruleSound.push(result.ruleSound);
            if (!result) return false;
            remainingOutlineLetters = result.remainingOutline;
            remainingTargetLetters = result.remainingTarget;
        } else if (remainingTargetLetters.startsWith(letterPart)) {
            remainingTargetLetters = remainingTargetLetters.substring(
                letterPart.length
            );
            if (debug)
                console.log(
                    "---".repeat(depth) + "-LetterPart Matches",
                    letterPart,
                    remainingTargetLetters
                );
        } else {
            //Remove one letter from the target and try again
            if (remainingTargetLetters.length > 0) {
                skippedLetters++;
                if (skippedLetters > acceptableParameters.maxOneRuleSkip) {
                    return false;
                }
                currentParameters ??= {};
                currentParameters.skippedLetters ??= 0;
                currentParameters.skippedLetters++;
                if (
                    currentParameters.skippedLetters >
                    acceptableParameters.maxSkippedLetters
                ) {
                    return false;
                }

                remainingTargetLetters = remainingTargetLetters.substring(1);
                let result = TestRule(
                    memorizedData,
                    depth + 1,
                    remainingOutlineLetters,
                    ruleName,
                    remainingTargetLetters,
                    debug,
                    currentParameters,
                    acceptableParameters
                );

                if (!result) {
                    if (debug) console.log("---".repeat(depth) + "-failed");
                    return false;
                }
                if (debug) console.log("---".repeat(depth) + "-passed", result);

                remainingOutlineLetters = result.remainingOutline;
                remainingTargetLetters = result.remainingTarget;

                skippedLetters += result.skippedLetters;
            }
        }
    }

    remainingOutlineLetters = removeStartingPart(
        depth,
        outline,
        rule[0],
        debug,
        randomNumber
    );
    if (debug)
        console.log(
            "---".repeat(depth) + "RemainingOutline",
            remainingOutlineLetters,
            randomNumber
        );

    return {
        ruleName: ruleName,
        description: rule[4],
        outline: rule[0],
        target: rule[1],
        ruleSound: ruleSound,
        subRules: subRules,
        inputOutline: outline,
        inputTarget: target,
        skippedLetters: skippedLetters,

        remainingOutline: remainingOutlineLetters,
        remainingTarget: remainingTargetLetters,

        identifier: randomNumber,
    };
}

function FindRulesThatFitRecursively(
    memorizedData,
    depth,
    outline,
    target,
    debug = false,
    currentParameters = {},
    acceptableParameters = {}
) {
    if (target == "") {
        currentParameters.skippedKeys ??= 0;
        currentParameters.skippedKeys += outline.length;

        if (
            currentParameters.skippedKeys >
                acceptableParameters.maxSkippedKeys ??
            0
        ) {
            return false;
        }

        return true;
    }

    if (debug)
        console.log(
            "---".repeat(depth) + "FindRulesThatFitRecursively",
            outline + "_" + target
        );
    if (memorizedData[outline + "_" + target]) {
        if (debug) console.log("---".repeat(depth) + "Memorized");
        return memorizedData[outline + "_" + target];
    }

    var rules = SpectraRules;

    var workingRules = [];

    var minSkippedLetters = Infinity;
    // while(outline.length>)
    for (const ruleName in rules) {
        if (debug)
            // console.log(" --- ".repeat(depth) + "Testing rule :" + ruleName);
            var doNothing = 0;

        var newParameters = { ...currentParameters };
        var result = TestRule(
            memorizedData,
            depth,
            outline,
            ruleName,
            target,
            debug,
            newParameters,
            acceptableParameters
        );
        // console.log(result);
        if (result) {
            if (debug)
                console.log("---".repeat(depth) + "-Rule", ruleName, "fits");
            if (debug)
                console.log(
                    "---".repeat(depth) + "-Remaining outline",
                    result.remainingOutline
                );
            if (debug)
                console.log(
                    "---".repeat(depth) + "-Remaining target",
                    result.remainingTarget
                );

            let subResult = FindRulesThatFitRecursively(
                memorizedData,
                depth + 1,
                result.remainingOutline,
                result.remainingTarget,
                debug,
                newParameters,
                acceptableParameters
            );
            if (debug)
                console.log("---".repeat(depth) + "-SubResult", subResult);

            if (subResult) {
                workingRules.push({
                    subResult: subResult,
                    ...result,
                });
            }

            let skippedKeys =
                (currentParameters?.skippedKeys ?? 0) +
                result.remainingOutline.length;
            let allowedOutlineLetters =
                acceptableParameters?.maxSkippedKeys ?? 0;

            if (skippedKeys > 2) {
                continue;
            }
            memorizedData[outline + "_" + target] = { ...result };
        }
    }
    memorizedData[outline + "_" + target] = {
        minSkippedLetters: minSkippedLetters,
        subResults: workingRules,
    };
    if (workingRules.length == 0) {
        memorizedData[outline + "_" + target] = null;
        return null;
    }
    return {
        minSkippedLetters: minSkippedLetters,
        subResults: workingRules,
    };
}

function AnalyzeRecursive(outline, target) {
    var rules = SpectraRules;
    // console.log("Analyzing :" + outline, target);
}

function GenerateOutlinesFromInputRecursively(target, outline, depth) {
    // console.log("GenerateOutlinesFromInputRecursively", target, outline, depth);
    if (depth > 10) {
        return [];
    }

    if (target == "") {
        return [outline];
    }
    var rules = GeneratorRules;
    var outlines = [];
    for (const ruleName in rules) {
        var rule = rules[ruleName];
        if (rule[1].length == 0) {
            continue;
        }

        if (target.startsWith(rule[1])) {
            if (rule[3] == "REFERENCE") {
                continue;
            }
            // var newOutline = combineStrokeToOutline(rule[0],outline);
            var newOutlineB = combineStrokeToOutline(rule[0], outline);
            var newOutline = `$${ruleName}$` + newOutlineB;
            if (!newOutlineB) {
                continue;
            }
            var newTarget = target.substring(rule[1].length);
            var newOutlines = GenerateOutlinesFromInputRecursively(
                newTarget,
                newOutline,
                depth + 1
            );
            outlines = outlines.concat(newOutlines);
        }
    }
    return outlines;
}