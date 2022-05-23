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

function Analyze(outlines, target) {
    target = target.toLowerCase();
    // outlines = ["KPAPL"];
    console.log("Analyzing :" + outlines, target);

    let parameters = {
        maxOneRuleSkip: 0,
        maxSkippedKeys: 0,
        maxSkippedLetters: 0,
    };
    /**
     * @type {ProcessedResult|null}
     */
    let bestPerformer = null;

    for (let index = 0; index < 5; index++) {
        outlines.forEach((outline) => {
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
            // console.log("result", result);

            if (result == null) return;
            // console.log("Result", result);
            var unpacked = UnpackRecursively(result);
            // console.log("Unpacked", unpacked);
            var processed = processResults(unpacked, outline);

            // console.log("Preformer", processed);
            // console.log("outline", outline);

            if (processed == null) return;
            if (bestPerformer == null) {
                bestPerformer = {
                    ...processed,
                    outline: outline,
                };
                return;
            }
            if (bestPerformer == null) {
                return;
            }

            var BestSplitLength = bestPerformer.outline.split("/").length;
            if (BestSplitLength == 0) BestSplitLength = Infinity;
            if (outline.split("/").length < BestSplitLength) {
                // console.log("Shorter answer");
                bestPerformer = {
                    ...processed,
                    outline: outline,
                };
            } else if (outline.split("/").length == BestSplitLength) {
                if (
                    processed.skippedLetterCount <
                    bestPerformer.skippedLetterCount
                ) {
                    // console.log("Less mesups");

                    bestPerformer = {
                        ...processed,
                        outline: outline,
                    };
                } else if (
                    processed.skippedLetterCount ==
                    bestPerformer.skippedLetterCount
                ) {
                    if (processed.rules.length < bestPerformer.rules.length) {
                        // console.log("Less rules");
                        bestPerformer = {
                            ...processed,
                            outline: outline,
                        };
                    }
                }
            }
        });
        if (bestPerformer == null) {
            parameters.maxOneRuleSkip += 1;
            parameters.maxSkippedKeys += 1;
            parameters.maxSkippedLetters += 1;
        } else {
            break;
        }
    }
    // console.log("Best Performer", bestPerformer);
    if (bestPerformer === null) {
        return null;
    }
    return bestPerformer;
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
 * @returns {false| object}
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
    if (ruleName == "ex.") debug = true;
    // if(memorizedData[ruleName]){

    // if (ruleName != "!c") debug = false;
    let randomNumber = Math.floor(Math.random() * 10000000);

    if (target == "" && outline == "") return false;
    var rules = SpectraRules;
    // console.log(ruleName);
    let rule = rules[ruleName];
    let ruleSound = [rule[2]];

    if (!TestRuleOutline(depth, rule[0], outline)) return false;
    if (debug)
        console.log(
            "---".repeat(depth) + "Testing rule :" + ruleName,
            target,
            outline,
            randomNumber
        );

    let letterFit = rule[1];

    let letterParts = letterFit.match(/\(.*?\)|[^\(]*/g);

    let remainingTargetLetters = target;
    let remainingOutlineLetters = outline;
    let skippedLetters = 0;
    let subRules = [];
    for (let index = 0; index < letterParts.length; index++) {
        const letterPart = letterParts[index];
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
                remainingOutlineLetters = result.remainingOutline;
                remainingTargetLetters = result.remainingTarget;
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
        currentParameters.maxSkippedKeys ??= 0;
        currentParameters.maxSkippedKeys += outline.length;
        // console.log(currentParameters.maxSkippedKeys);
        if (
            currentParameters.skippedKeys >
                acceptableParameters.maxSkippedKeys ??
            0
        ) {
            console.log("Too many skipped Keys");
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
            console.log(" --- ".repeat(depth) + "Testing rule :" + ruleName);
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
