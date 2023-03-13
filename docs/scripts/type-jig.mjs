/* eslint-disable guard-for-in */
/* -----------------------------------------------------------------------
 * TypeJig - run a typing lesson.
 *
 * `exercise` is a TypeJig.Exercise object, while `display`, `input`,
 * `output`, and `clock` are elements (or element ID strings).
 */

import { StenoDisplay } from "./utils/steno-display.mjs";
//@ts-ignore
let PloverTranslations = import("./../data/plover-translations.mjs").then((m) => m.PloverTranslations);
import { N, initializeButtons, newRNG, shuffle } from "./utils/util.mjs";
/**
 * @typedef {{
 *  correctTimeStamp: number,
 *  incorrectTimeStamp: number,
 *  failed_count: number,
 *  lastKnownTimeStamp: number,
 *  failed: boolean,
 *  first_typed: boolean,
 *  id: number,
 *  expected: string,
 *  typed: string,
 *  strokes: [number, string, string][],
 * }} PersistantWordData
 *
 */

/**
 * @class TypeJig
 */
export class TypeJig {
    /**
     * TypeJig constructor
     * @param {Exercise} exercise
     * @param {any} options
     * @param {StenoDisplay} hint
     * @typedef {{
     * hints: string,
     * }} TypeJigOptions
     */
    constructor(exercise, options, hint = null) {
        this.gradingRules = {};
        if (options?.gradingRules) {
            this.gradingRules = JSON.parse(atob(options?.gradingRules));
        }
        console.log("Grading rules", this.gradingRules);

        console.log("TypeJig", exercise, hint, options);
        this.exercise = exercise;

        this.getNewExercise = options.getNewExercise;
        this.getNewURL = options.getNewURL;

        /**
         * @type {[
         *   number,
         *   number,
         *   string,
         *   string,
         * ][]}
         */
        this.strokes = [];

        this.display = documentElement("exercise");
        this.answerDisplay = documentElement("answer");
        this.input = documentElement("input");
        this.resultsDisplay = documentElement("results");
        const liveWPM = documentElement("live-wpm-display");
        const clockElt = documentElement("clock");

        this.liveWPM = new TypeJig.LiveWPM(liveWPM, this, options?.live_wpm);
        const updateWPM = this.liveWPM.update.bind(this.liveWPM);
        this.clock = new TypeJig.Timer(clockElt, exercise.seconds * 1000, updateWPM);
        /**
         * @type {StenoDisplay} hint
         */
        this.hint = hint || initializeHints(options?.hints);

        if (options?.hints == "true") this.hint.show();
        else this.hint.hide();

        if (!options?.show_timer) this.clock.hide();

        this.live_wpm = options?.live_wpm;
        this.live_cpm = options?.live_cpm;
        console.log(options);
        this.hint_on_fail = options?.hints?.startsWith("fail");
        this.hint_on_fail_count = parseInt(options?.hints?.split("-")[1] || 1);

        this.multi_word_hints = options?.multi_word_hints;
        this.showing_hint_on_word = "";

        this.typedWords = [];

        /**
         * @type {PersistantWordData[]}
         */
        this.persistentWordData = [];

        this.lastTypedWordID = -1;

        this.options = options;
        if (options) {
            if (options.wpm && Math.floor(+options.wpm) == options.wpm) {
                this.speed = { type: "wpm", value: options.wpm };
            } else if (options.cpm && Math.floor(+options.cpm) == options.cpm) {
                this.speed = { type: "cpm", value: options.cpm };
            }
        }

        const self = this; // close over `this` for event handlers.

        this.changeHandler = this.answerChanged.bind(this);
        bindEvent(document.body, "keydown", this.keyDown.bind(this));
        bindEvent(this.input, "input", function (ev) {
            if (!self.pendingChange) {
                self.chordTime = Math.round(ev.timeStamp);
                self.pendingChange = setTimeout(self.changeHandler, 25);
            }
        });

        const focusHandler = this.updateCursor.bind(this);
        bindEvent(this.input, "focus", focusHandler);
        bindEvent(this.input, "blur", focusHandler);
        function focusInput(evt) {
            self.input.focus();
            evt.preventDefault();
        }
        bindEvent(this.display, "click", focusInput);

        this.reset();

        /**
         * @type {number}
         */
        this.chordTime = 0;
        this.previousInput = undefined;
    }

    setExercise(exercise) {
        console.log("setExercise", exercise);
        this.exercise = exercise;
        this.reset();
    }

    reset() {
        this.enter_count = 0;
        this.showing_hint_on_word = "";
        this.persistentWordData = [];
        this.lastTypedWordID = -1;
        this.display.style.width = "100%";

        this.strokes = [];

        console.log("this.display", this.display);
        // this.exercise.calculateBreakPoints(this.display);

        document.getElementById("corrections").style.display = "none";
        document.getElementById("chartDiv").style.display = "none";

        this.liveWPM.reset();
        this.display.style.width = "200%";
        this.typedWords = [];

        this.resultsDisplay.textContent = "";

        const spans = this.display.querySelectorAll("span");
        if (this.speed) {
            for (const element of spans) {
                element.className = "notYet";
            }
        }
        console.log("105", this.hint);

        //If the exercise is a promise, wait for it to resolve.
        if (this.exercise instanceof Promise) {
            let fakeLines = [];

            for (let i = 0; i < 10; i++) {
                fakeLines.push(N("div", { class: "exersize__placeholder__text" }));
            }

            N(this.display, [N("div", { class: "exersize__placeholder" }, [...fakeLines])]);

            this.exercise.then((exercise) => {
                this.exercise = exercise;
                this.reset();
            });

            return;
        }

        if (this.hint && this.hint.update && this.exercise) {
            // Get a string containing the next 10 words. if its at the end of the list get as much as you can.

            const word = this.exercise.words[0];
            const rect = this.display.getBoundingClientRect();

            this.hint.update(word, rect.left, rect.top);
            this.hint.startupPrecompute(this.exercise.words);
        }

        /**
         * @type { true | number | undefined}
         */
        this.pendingChange = true;
        this.input.value = "";
        this.input.blur();
        this.input.focus();
        delete this.pendingChange;
        this.previousInput = undefined;

        this.running = false;
        this.clock.reset();
        this.updateWords(this.exercise?.words, true);
        this.displayTypedWords([]);
        window.scroll(0, scrollOffset(this.display));
    }

    static wordsAndSpaces = function (string) {
        return string.match(/\S+|\s+/g) || [];
    };

    // Can contain a text-to-pseudosteno dictionary for each steno theory.
    // Pseudosteno can be a single string or an array of strings, with
    // longest entries first and shortest briefs last.
    static Translations = {};

    // @ts-ignore
    static processTranslations = function (t, fn) {
        const out = {};

        // Flip around the keys and values. treating duplicates as a list.
        for (const key in t) {
            const value = t[key];
            // If the value is already in the output as a list
            if (out[value] instanceof Array) {
                out[value].push(key);
            } else {
                out[value] = [key];
            }
        }
        return out;
    };

    static longestTranslations = function (t) {
        // @ts-ignore
        return TypeJig.processTranslations(t, function (steno, text) {
            return steno instanceof Array ? steno[0] : steno;
        });
    };
    static shortestTranslations = async function (t) {
        // Get the custom dictionarys from localstorage
        const customDictionariesString = localStorage.getItem("customDictionaries");
        console.log(customDictionariesString);
        const customDictionaries = [];
        if (customDictionariesString) {
            JSON.parse(customDictionariesString).forEach((dictionary) => {
                customDictionaries.push(TypeJig.processTranslations(dictionary));
            });
        }

        customDictionaries.push(TypeJig.processTranslations(await t));

        console.log("Custom dic", customDictionaries);

        return customDictionaries;
    };

    // Arrays of strings (or of arrays of strings).
    static WordSets = {};
    static flattenWordSet = function (a) {
        const out = [];
        for (const element of a) out.push(...element);
        return out;
    };

    start() {
        this.clock.start(this.endExercise.bind(this));
        this.startTime = Date.now();
        this.running = true;
        if (this.speed) {
            this.speed.current = this.display.firstElementChild;
            this.tick();
        }
    }

    tick() {
        const s = this.speed;
        if (!(this.running && s && s.current)) return;
        const fn = this.tick.bind(this);
        let ms = (1000 * 60) / s.value;

        this.exercise.numOfExpectedWords++;

        const thisWord = this.exercise.words[this.exercise.numOfExpectedWords];

        this.updateWords(this.exercise.words);
        if (s.type === "cpm") ms *= thisWord.length;

        if (s.current) setTimeout(fn, ms);
    }
    setWord(word, id) {
        this.typedWords[id] = {
            ...this.typedWords[id],
            ...word,
        };
    }

    onWord(word, id) {
        console.log("OnWord");
        this.typedWords.forEach((element) => {
            element.current = false;
        });

        const oldWord = this.typedWords[id];

        if (word.correct == false) {
            word.mistyped = true;
        }

        if (oldWord?.mistyped && word.correct) {
            word.corrected = true;
        }

        this.typedWords[id] = {
            ...this.typedWords[id],
            ...word,
        };

        // If we skip a word we need to mark the skipped words as dropped
        if (id > this.lastTypedWordID + 1) {
            for (let i = this.lastTypedWordID + 1; i < id; i++) {
                this.setWord(
                    {
                        expected: this.exercise.words[i],
                        correct: false,
                        typed: "",
                        dropped: true,
                    },
                    i
                );
            }
        }

        if (id < this.lastTypedWordID) {
            for (let i = id; i < this.lastTypedWordID + 1; i++) {
                this.setWord(
                    {
                        expected: "",
                        typed: "",
                    },
                    i
                );
            }
        }
        word.current = true;
        word.timestamp = this.clock.getTime();
        this.setWord(word, id);
        this.lastTypedWordID = id;
    }

    gradeTypeVsResult(typedWords, expectedWords = this.exercise.words) {
        // remove any leading spaces on typedWords
        // any blank type words if they are at the end
        let trailingSpace = false;
        // if (typedWords[typedWords.length - 1] == "" && typedWords.length > 1) {
        //     typedWords.pop();
        //     trailingSpace = true;
        // }
        const options = this.options;
        // Display the user's answer, marking it for correctness.
        const oldOutput = this.display.previousElementSibling;
        const output = document.createElement("div");
        output.id = oldOutput.id;

        let typedIndex = 0;
        let expectedIndex = 0;

        const wordList = [];

        let errorCount = 0;
        let correctCount = 0;

        // eslint-disable-next-line no-unused-vars
        for (const i of typedWords) {
            if (typedIndex > typedWords.length) break;
            const typed = typedWords[typedIndex];
            const expected = expectedWords[expectedIndex];
            const matchResult = checkMatch(typed, expected);
            const lastTypedWord = typedIndex === typedWords.length - 1;

            if (this.persistentWordData[expectedIndex] == null) {
                this.persistentWordData[expectedIndex] = {
                    id: expectedIndex,
                    expected: expected,
                    typed: typed,
                    lastKnownTimeStamp: null,
                    strokes: [],
                    failed: false,
                    failed_count: 0,
                    correctTimeStamp: null,
                    incorrectTimeStamp: null,
                    first_typed: null,
                };
            }

            if (typedIndex == typedWords.length) break;

            let typedWordData = this.persistentWordData[expectedIndex];

            if (typedWordData.typed == "" && i == typedWords.length - 1) {
                break;
            }

            typedWordData.typed = typed;
            typedWordData.first_typed ||= typed;

            if (matchResult) {
                correctCount++;
                wordList.push({
                    correct: true,
                    expected: expected,
                    typed: typed,
                });
                expectedIndex++;
                typedIndex++;
                continue;
            }
            if (matchResult == null && lastTypedWord) {
                // If its partial and the last word, we need to add it
                wordList.push({
                    correct: null,
                    expected: expected,
                    typed: typed,
                });
                typedIndex++;
                break;
            }

            // Check if we are on an erranious word and further on we type a correct word
            let addedWordsOffset = 0;

            for (let offset = 1; offset <= (options?.grade_rules_addedWordMaxJump ?? 5); offset++) {
                if (typedIndex + offset >= typedWords.length) break;
                const offsetTypedWord = typedWords[typedIndex + offset];
                const offsetMatch = checkMatch(offsetTypedWord, expected);

                if (offsetMatch != false) {
                    addedWordsOffset = offset;
                    break;
                }
            }

            let droppedWordOffset = 0;

            for (let offset = 1; offset <= (options?.grade_rules_droppedWordMaxJump ?? 5); offset++) {
                console.log("Trying to find a dropped word");
                if (expectedIndex + offset >= expectedWords.length) break;
                const offsetExpectedWord = expectedWords[expectedIndex + offset];
                const offsetMatch = checkMatch(typed, offsetExpectedWord);
                if (lastTypedWord && offsetMatch == null) {
                    droppedWordOffset = offset;
                    break;
                }
                if (offsetMatch == true) {
                    droppedWordOffset = offset;
                    break;
                }
            }

            // Chose the lower of the two that are not zero

            // If they are both zero assume it was just a misspelling

            if (addedWordsOffset == 0 && droppedWordOffset == 0) {
                if (typed.length > 0) {
                    typedWordData.failed = true;
                }

                wordList.push({
                    correct: false,
                    expected: expected,
                    typed: typed,
                });
                expectedIndex++;
                typedIndex++;
                errorCount++;
                continue;
            }

            console.log("addedWordsOffset", addedWordsOffset);
            console.log("droppedWordOffset", droppedWordOffset);

            if (addedWordsOffset == 0) addedWordsOffset = Infinity;
            if (droppedWordOffset == 0) droppedWordOffset = Infinity;

            // If one of them are a solution
            if (addedWordsOffset <= droppedWordOffset) {
                const addedWords = [];
                for (let i = 0; i < addedWordsOffset; i++) {
                    addedWords.push(typedWords[typedIndex + i]);
                }
                wordList.push({
                    correct: checkMatch(typedWords[typedIndex + addedWordsOffset], expected),
                    expected: expected,
                    typed: typedWords[typedIndex + addedWordsOffset],
                    addedWords: addedWords,
                });

                typedIndex += addedWordsOffset;
                typedIndex++;
                expectedIndex++;
                errorCount += addedWordsOffset;
                continue;
            }

            if (droppedWordOffset < addedWordsOffset) {
                // @ts-ignore
                // let droppedWords = [];
                for (let i = 0; i < droppedWordOffset; i++) {
                    if (this.persistentWordData[typedIndex + i] == null) {
                        this.persistentWordData[typedIndex + i] = {
                            id: typedIndex + i,
                            expected: expectedWords[expectedIndex + i],
                            typed: "",
                            lastKnownTimeStamp: null,
                            strokes: [],
                            failed: false,
                            failed_count: 0,
                            correctTimeStamp: null,
                            incorrectTimeStamp: null,
                            first_typed: null,
                        };
                    }

                    wordList.push({
                        correct: false,
                        expected: expectedWords[expectedIndex + i],
                        typed: "",
                    });
                }
                wordList.push({
                    correct: checkMatch(typed, expectedWords[expectedIndex + droppedWordOffset]),
                    expected: expectedWords[expectedIndex + droppedWordOffset],
                    typed: typed,
                });

                if (this.persistentWordData[expectedIndex + droppedWordOffset] == null) {
                    this.persistentWordData[expectedIndex + droppedWordOffset] = {
                        id: expectedIndex + droppedWordOffset,
                        expected: expectedWords[expectedIndex + i],
                        typed: typed,
                        lastKnownTimeStamp: null,
                        strokes: [],
                        failed: !checkMatch(typed, expectedWords[expectedIndex + droppedWordOffset]),
                        failed_count: 0,
                        correctTimeStamp: null,
                        incorrectTimeStamp: null,
                        first_typed: null,
                    };
                }

                expectedIndex += droppedWordOffset;
                expectedIndex++;
                typedIndex++;
                errorCount += droppedWordOffset;
                continue;
            }
        }
        console.log("typedIndex", typedIndex);
        // Timestamp the last word
        const LastWord = this.persistentWordData[expectedIndex - 1];
        const LastTypedWord = wordList[wordList.length - 1];
        // console.log(LastWord, "LastWord");
        // console.log(LastTypedWord, "LastWord");
        console.log([...this.persistentWordData], "input data");

        // if the last typed word is correct, add the timestamp
        if (LastTypedWord.correct == true) {
            const nowTime = this.clock.getTime();
            const savedTime = LastWord?.correctTimeStamp;
            console.log(nowTime, savedTime, wordList.length - 1);
            this.persistentWordData[wordList.length - 1].correctTimeStamp = nowTime;
            console.log("setting value for ", wordList.length - 1, this.persistentWordData[wordList.length - 1]);
        }
        console.log([...this.persistentWordData], "persistentWordData");
        LastWord.lastKnownTimeStamp = this.clock.getTime();

        // if (trailingSpace) {
        //     wordList.push({
        //         correct: null,
        //         expected: "placeholder",
        //         typed: "",
        //     });
        // }
        return {
            words: wordList,
            correctCount: correctCount,
            errorCount: errorCount,
            totalCount: expectedWords.length,
        };
    }

    displayTypedWords(typedWords, onResults = false) {
        delete this.pendingChange;

        let ex;
        let match;

        // Display the user's answer, marking it for correctness.

        const output = document.createElement("div");

        for (let i = 0; i < typedWords.length; i++) {
            const word = typedWords[i];
            // insert space if not the first word

            if (word.typed == "" && word.expected == "") {
                continue;
            }

            if (i != 0) {
                output.appendChild(document.createTextNode(" "));
            }

            const ans = word.typed;
            match = word.correct;
            ex = word.expected;

            if (this.exercise && this.exercise.enterPoints.includes(i)) {
                output.appendChild(document.createTextNode("\n"));
            }

            // If the match has any erronius words, display them
            if (word.addedWords) {
                for (const element of word.addedWords) {
                    const addedWord = element;
                    const addedWordNode = document.createElement("span");
                    addedWordNode.appendChild(document.createTextNode(addedWord));
                    if (this.options.show_live_grading || onResults) {
                        addedWordNode.className = "incorrect";
                    } else {
                        addedWordNode.className = "unknown1";
                    }

                    if (onResults) {
                        addedWordNode.setAttribute("results", "true");
                        addedWordNode.setAttribute("word_id", i.toString());
                    }
                    output.appendChild(addedWordNode);
                    output.appendChild(document.createTextNode(" "));
                }
            }

            const persistentData = this.persistentWordData[i];
            // If its the last element
            if (i === typedWords.length - 1 || match) {
                const typedSpan = document.createElement("span");
                typedSpan.appendChild(document.createTextNode(ans));

                let className = "";

                console.log("options", this.options);

                if (this.options.show_live_grading || onResults) {
                    if (match == true) {
                        className = "correct";
                    }
                    if (persistentData?.failed && this.options.show_corrections) {
                        className = "corrected";
                    }

                    if (match == false) {
                        className = "incorrect";
                    }
                } else {
                    className = "unknown2";
                }
                typedSpan.className = className;
                // if (match != null)
                //     typedSpan.className = !match
                //         ? "incorrect"
                //         : persistentData?.failed
                //         ? "corrected"
                //         : "correct";
                if (onResults) {
                    typedSpan.setAttribute("results", "true");
                    typedSpan.setAttribute("word_id", i.toString());
                }
                output.appendChild(typedSpan);
                continue;
            }

            const div = document.createElement("span");
            div.style.display = "inline-block";
            div.style.lineHeight = "1";
            div.style.position = "relative";
            if (ex != "" && ans == "") {
                if (this.options.show_live_grading || onResults) {
                    div.className = "blankWord";
                } else {
                    div.className = "unknown3";
                }
            }

            const typedSpan = document.createElement("span");
            typedSpan.style.position = "absolute";
            typedSpan.style.left = "0px";
            const expectedSpan = document.createElement("span");
            expectedSpan.style.opacity = "0";

            typedSpan.appendChild(document.createTextNode(ans));

            if (word.current) {
                expectedSpan.appendChild(document.createTextNode(ans));
            } else {
                if (ans.length > ex.length) {
                    expectedSpan.appendChild(document.createTextNode(ans + ""));
                } else {
                    expectedSpan.appendChild(document.createTextNode(ex + ""));
                }
            }

            let className = "incorrect";
            if (this.options.show_live_grading || onResults) {
                if (match == true) {
                    className = "correct";
                }
                if (persistentData?.failed && this.options.show_corrections && word.correct) {
                    className = "corrected";
                }
            } else {
                className = "unknown4";
            }
            typedSpan.className = className;
            // if (match != null)
            // typedSpan.className = word.corrected
            //     ? "corrected"
            //     : match
            //     ? "correct"
            //     : "incorrect";

            if (onResults) {
                typedSpan.setAttribute("results", "true");
                typedSpan.setAttribute("word_id", i.toString());
            }

            div.appendChild(expectedSpan);
            div.appendChild(typedSpan);

            output.appendChild(div);
            // var span = document.createElement("span");
            // span.appendChild(document.createTextNode(match ? ex : ans));
            // span.className = match ? "correct" : "incorrect";
            // output.appendChild(div);
        }

        this.updateCursor(output);

        // if (match) ex = nextWord(exercise, range);

        // if (this.hint && this.hint.update) {
        //     var rect = output.getBoundingClientRect();
        //     this.hint.update(word, rect.left, rect.top);
        // }

        if (ex !== this.showing_hint_on_word && this.hint_on_fail && match && this.hint) {
            this.showing_hint_on_word = "";
            // this.hint.show();
        }
        output.id = this.answerDisplay.id;
        this.answerDisplay.parentNode.replaceChild(output, this.answerDisplay);
        this.answerDisplay = output;
        return null;
    }
    answerChanged() {
        delete this.pendingChange;
        const previousInput = this.previousInput ?? "";

        const previousWords = previousInput.replaceAll(/^\s+/g, "").split(/\s+/);
        const previousWordsLength = previousWords.length;

        const typedWords = this.input.value.replaceAll(/^\s+/g, "").split(/\s+/);

        // replace all leading spaces if they exist

        if (this.resultsDisplay.textContent !== "") return;

        if (!this.running) {
            if (!this.input.value.trim()) return;
            this.start();
        }

        const gradeResults = this.gradeTypeVsResult(typedWords, this.exercise.words);

        console.log("gradeResults", gradeResults);

        const lastWordIndex = gradeResults.words.length - 1;

        const lastGradedWord = gradeResults.words[lastWordIndex];

        const lastPersistantWord = this.persistentWordData[lastWordIndex];
        const nextAfterLastPersistantWord = this.persistentWordData[lastWordIndex + 1];

        let numOfFailsThisWord = lastPersistantWord?.failed_count ?? 0;

        const numOfFailsNextWord = nextAfterLastPersistantWord?.failed_count ?? 0;

        //If we just messed up the word
        if (lastGradedWord?.correct === false && this.failedThisWord == false) {
            this.failedThisWord = true;
            lastPersistantWord.failed_count++;
            console.log("Adding error to index:", lastWordIndex, "count:", lastPersistantWord.failed_count);
        }

        if (this.lastWordIndex != lastWordIndex || lastGradedWord.typed == "") {
            this.lastWordIndex = lastWordIndex;
            this.failedThisWord = false;
        }

        if (this.hint_on_fail) {
            if (
                (numOfFailsThisWord >= this.hint_on_fail_count && gradeResults.words[lastWordIndex]?.correct == null) ||
                numOfFailsNextWord >= this.hint_on_fail_count
            ) {
                this.hint.show();
            } else {
                this.hint.hide();
            }
        }

        //Lets deal with strokes
        if (typedWords.length > previousWordsLength) {
            console.log("Increased word length");
            //If we increased more then one word then
            for (let i = previousWordsLength - 1; i < typedWords.length; i++) {
                console.log("Increased, Adding stroke to index:", i);
                let strokes = this.persistentWordData[i].strokes;
                let lastStrokeIndex = strokes?.length ?? 1;
                let lastStroke = strokes?.[lastStrokeIndex - 1] ?? [];
                let lastTyped = lastStroke?.[2] ?? "";
                if (lastTyped == this.persistentWordData[i].typed) {
                    continue;
                }
                this.persistentWordData[i].strokes.push([this.chordTime, lastTyped, this.persistentWordData[i].typed]);
            }
        } else if (typedWords.length < previousWordsLength) {
            console.log("Decreased word length");
            //If we decreased more then one word then
            for (let i = typedWords.length - 1; i < previousWordsLength; i++) {
                console.log("Decreased, Adding stroke to index:", i);
                let strokes = this.persistentWordData[i].strokes;
                let lastStrokeIndex = strokes?.length ?? 1;
                let lastStroke = strokes?.[lastStrokeIndex - 1] ?? [];
                let lastTyped = lastStroke?.[2] ?? "";
                if (lastTyped == this.persistentWordData[i].typed) {
                    continue;
                }
                this.persistentWordData[i].strokes.push([this.chordTime, lastTyped, this.persistentWordData[i].typed]);
            }
        } else {
            //If we just changed the last word
            let strokes = this.persistentWordData[lastWordIndex].strokes;
            let lastStrokeIndex = strokes?.length ?? 1;
            let lastStroke = strokes?.[lastStrokeIndex - 1];
            let lastTyped = lastStroke?.[2] ?? "";
            this.persistentWordData[lastWordIndex].strokes.push([
                this.chordTime,
                lastTyped,
                this.persistentWordData[lastWordIndex].typed,
            ]);
        }

        this.typedWords = gradeResults.words;

        if (
            this.typedWords.length >= this.exercise.words.length &&
            this.typedWords[this.typedWords.length - 1].correct
        ) {
            window.setTimeout(this.clock.stop.bind(this.clock));
        }
        this.updateCursor(this.answerDisplay);

        // Get the expected value of the next word
        const r = this.answerDisplay.getBoundingClientRect();
        // @ts-ignore
        // const nextWord = this.exercise.words[this.typedWords.length];
        const thisTypedWord = this.typedWords[this.typedWords.length - 1];

        if (this.hint && this.hint.update) {
            if (thisTypedWord && (thisTypedWord.correct == null || thisTypedWord.typed == "")) {
                const nextWords = this.exercise.words
                    .slice(
                        this.typedWords.length - 1,
                        Math.min(this.typedWords.length + (this.multi_word_hints ? 10 : 0), this.exercise.words.length)
                    )
                    .join(" ");
                console.log("nextWords", nextWords);

                this.hint.update(nextWords, r.left, r.top);
            } else {
                const nextWords = this.exercise.words
                    .slice(
                        this.typedWords.length,
                        Math.min(this.typedWords.length + (this.multi_word_hints ? 10 : 1), this.exercise.words.length)
                    )
                    .join(" ");
                console.log("nextWords", nextWords);
                this.hint.update(nextWords, r.left, r.top);
            }
        }

        this.displayTypedWords(this.typedWords);

        this.updateWords(this.exercise.words);
        this.previousInput = this.input.value;

        console.log("UpdateEnd", this.persistentWordData);
    }

    keyDown(e) {
        let id;
        if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
            this.enter_count = 0;
            return;
        }

        this.right_arrow_count ??= 0;

        if (e.key === "ArrowRight") ++this.right_arrow_count;

        if (e.key === "Enter") ++this.enter_count;

        if (e.key === "Tab") ++this.tab_count;
        else this.tab_count = 0;
        switch (e.key) {
        case "Enter":
            if (this.enter_count >= 3) {
                id = "again";
                this.enter_count = 0;
            }
            break;

        case "Tab":
            if (this.tab_count >= 3) {
                id = "end";
                this.tab_count = 0;
            }
            e.preventDefault();
            break;
        case "ArrowLeft":
            id = "back";
            break;
        case "ArrowRight":
            if (this.right_arrow_count >= 3) {
                id = "new";
                this.right_arrow_count = 0;
            }
            e.preventDefault();
            break;
        case "ArrowUp":
            e.preventDefault();
            id = "show-hint";
            break;
        case "ArrowDown":
            e.preventDefault();

            id = "hide-hint";
            break;
        }
        if (id) {
            console.log("ARROW IDDS" + id);

            const link = document.getElementById(id);
            if (link) {
                link.click();
            }
        }
    }

    async updateWords(words, hardReset) {
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        let display = this.display;

        if (hardReset) {
            display = document.createElement("div");
            display.id = this.display.id;
            display.style.width = "100%";
            this.display.parentNode.replaceChild(display, this.display);
            console.log(document.body.offsetWidth);
            this.display = display;
            this.displayMaxWidth = this.display.offsetWidth;
        }

        let enterPoints;
        if (hardReset) {
            enterPoints = [];
        } else {
            enterPoints = this.exercise.enterPoints;
        }
        this.exercise.enterPoints = enterPoints;

        // var displayStyle = window.getComputedStyle(display);
        const maxLength = this.displayMaxWidth;

        let x = 0;

        for (let i = 0; i < words.length; ++i) {
            x = this.addWordToExercise(words[i], i, hardReset, x, maxLength);
        }

        if (this.exercise.endless) {
            console.log("endless");
            // See if the current typed word is within 2 lines of the last word
            const lastTypedWordIndex = this.typedWords.length - 1;

            let enterPoitnsBefore = 0;
            for (let i = 0; i < enterPoints.length; ++i) {
                if (enterPoints[i] <= lastTypedWordIndex) {
                    enterPoitnsBefore++;
                }
            }

            console.log("enterPoitnsBefore", enterPoitnsBefore);

            const maxLinesBeforeAppend = this.exercise.maxLinesBeforeAppend;

            let endpointsAfter = enterPoints.length - enterPoitnsBefore;

            console.log("endpointsAfter", endpointsAfter);

            console.log("maxLinesBeforeAppend", maxLinesBeforeAppend);
            console.log("enterPoints", enterPoints);
            let updatedColors = false;
            let oldX = x;
            if (endpointsAfter < maxLinesBeforeAppend) {
                while (endpointsAfter < maxLinesBeforeAppend) {
                    const nextWords = this.exercise.getNextWords(1);

                    for (const word of nextWords.slice(0)) {
                        if (enterPoints.includes(words.length)) {
                            x = 0;
                        }

                        console.log("word", word);
                        x = this.addWordToExercise(
                            word,
                            words.length,
                            false,
                            x,
                            maxLength
                            // endpointsAfter == maxLinesBeforeAppend - 1
                        );
                        if (x < oldX) {
                            endpointsAfter++;
                        }
                        oldX = x;
                    }
                    // Add the array of words to the end of the
                    // words.push(...nextWords);
                }
                updatedColors = true;
            }

            if (updatedColors) {
                let enterIndex = 0;
                for (let i = this.typedWords.length; i < words.length; ++i) {
                    // let word = words[i];
                    const wordElement = document.getElementById("word" + i);
                    if (wordElement) {
                        if (enterPoints[enterIndex + enterPoitnsBefore] == i) {
                            enterIndex++;
                        }
                        const opacity = 1 - (enterIndex - 1) / (maxLinesBeforeAppend - 2);
                        // @ts-ignore
                        wordElement.style.opacity = opacity;
                    }
                }
            }
        }

        display.style.width = "200%";

        function focusInput(evt) {
            // @ts-ignore
            self.input.focus();
            evt.preventDefault();
        }
        unbindEvent(this.display, "click", focusInput);

        bindEvent(this.display, "click", focusInput);
    }

    addWordToExercise(word, i, hardReset, x, maxLength, stopOnNewline, opacity) {
        // console.log(
        //     "addWordToExercise",
        //     word,
        //     i,
        //     hardReset,
        //     x,
        //     maxLength,
        //     stopOnNewline,
        //     opacity
        // );
        const display = this.display;
        const enterPoints = this.exercise.enterPoints;
        const maxWidth = maxLength;

        // See if the state of the word has changed
        const existingObject = display.querySelector("#word" + i);
        const diffrence = this.typedWords.length - i;
        if (!hardReset && (diffrence < -5 || diffrence > 5) && existingObject && !opacity) {
            if (this.exercise.numOfExpectedWords >= i) {
                existingObject.classList.remove("notYet");
            }
            // if (!this.exercise.numOfExpectedWords == i + 1) {

            return x + existingObject.offsetWidth;
            // }
        }

        // See if the typed word has any erroneous words and account for them
        const erroneousWords = this.typedWords[i] && this.typedWords[i].addedWords;
        const finalObject = N("span");
        if (erroneousWords) {
            N(
                finalObject,
                {
                    class: "complex-word-container",
                },
                erroneousWords.map((word) =>
                    N("span", word + " ", {
                        style: {
                            opacity: 0,
                        },
                    })
                )
            );
        }

        if (this.typedWords[i] && this.typedWords[i].typed.length > word.length) {
            N(
                finalObject,
                {
                    class: "complex-word-container",
                },
                [
                    N("span", word, {
                        style: {
                            position: "absolute",
                            left: 0,
                        },
                    }),
                    N("span", this.typedWords[i].typed + " ", {
                        style: {
                            opacity: 0,
                        },
                    }),
                ]
            );
        } else {
            N(finalObject, word + " ", {
                style: {
                    display: "inline-block",
                    opacity: opacity,
                },
            });
        }
        if (this.exercise.numOfExpectedWords <= i) {
            finalObject.classList.add("notYet");
        }
        finalObject.id = "word" + i;
        if (hardReset) {
            display.appendChild(finalObject);
            if (finalObject.offsetWidth + x > maxWidth) {
                display.removeChild(finalObject);
                if (stopOnNewline) {
                    return 0;
                }

                display.appendChild(document.createTextNode("\n"));
                display.appendChild(finalObject);
                x = 0;
                enterPoints.push(i);
            }
            x += finalObject.offsetWidth;
        } else {
            const existingObject = display.querySelector("#word" + i);

            if (existingObject) {
                display.replaceChild(finalObject, existingObject);
                if (enterPoints[enterPoints.length - 1] == i) {
                    return 0;
                }
            } else {
                display.appendChild(finalObject);

                console.log("hardReset", hardReset);
                console.log(finalObject.offsetWidth, x, maxWidth);

                if (finalObject.offsetWidth + x > maxWidth) {
                    console.log("finalObject.offsetWidth + x > maxWidth");

                    display.appendChild(document.createTextNode("\n"));

                    if (stopOnNewline) {
                        display.removeChild(finalObject);
                        if (enterPoints[enterPoints.length - 1] != i) {
                            enterPoints.push(i);
                        }
                        return 0;
                    }

                    display.appendChild(finalObject);
                    enterPoints.push(i);
                    this.exercise.numOfExpectedWords++;
                    this.exercise.words.push(word);
                    return finalObject.offsetWidth;
                }
                this.exercise.words.push(word);
            }

            x += finalObject.offsetWidth;
        }
        return x;
    }

    // getWordsn) {
    // // Split the exercise text into words (keeping the whitespace).
    // var exercise = TypeJig.wordsAndSpaces(this.display.textContent);

    // if (this.display.textContent) this.expectedWords = this.display.textContent.split(/\s+/);
    // else this.expectedWords = [];
    //     if (this.exercise && typeof n === "number") {
    //       // Add more text until we have enough (or there is no more).
    //       n = n + this.lookahead;
    //     }

    // while(this.exercise && (!n || this.expectedWords.length < n)) {
    // var text = this.exercise.getText();
    // if(text) {
    // var pieces = text.trim().split(/\s+/);
    // if(this.alternateWith) {
    // for(let i=0; i<this.alternateWith.length; ++i) {
    // pieces.push(this.alternateWith[i]);
    // }
    // }

    // for(let i=0; i<pieces.length; ++i) {
    // this.expectedWords.push(pieces[i]);
    // }

    // } else delete(this.exercise);
    // }
    // this.updateWords(this.expectedWords)
    // return exercise;
    // };

    // @ts-ignore
    currentSpeed(seconds, prev) {
        // var minutes = seconds / 60; // KEEP fractional part for WPM calculation!
        // seconds = Math.floor((seconds % 60) * 10) / 10;
        // var time = Math.floor(minutes) + ":" + seconds;
        // var wordsFromSpaces = this.input.value.split(/\s+/).length;
        // var wordsFromChars = this.input.value.length / 5;
        // var words = this.actualWords ? wordsFromSpaces : wordsFromChars;
        // var WPM = words / minutes;
        // if (prev) WPM = (words - prev.words) / (minutes - prev.minutes);
        // var correctedWPM = WPM - this.errorCount / minutes;
        // var accuracy = 1 - this.errorCount / wordsFromSpaces;
        // return {
        //     minutes: minutes,
        //     time: time,
        //     wordsFromSpaces: wordsFromSpaces,
        //     wordsFromChars: wordsFromChars,
        //     words: words,
        //     WPM: WPM,
        //     correctedWPM: correctedWPM,
        //     accuracy: accuracy,
        // };
    }

    endExercise(seconds) {
        if (this.running) this.running = false;
        else return;

        if (document.activeElement != document.body) {
            // @ts-ignore
            document.activeElement.blur();
        }

        if (this.exercise.endless || seconds === undefined) {
            // remove all words not yet typed
            const words = this.exercise.words.slice(0, this.typedWords.length);
            this.exercise.words = words;
            this.exercise.numOfExpectedWords = words.length;
            this.exercise.endless = false;

            if (!this.typedWords[this.typedWords.length - 1].correct) {
                this.typedWords.pop();
                this.exercise.words.pop();
                this.exercise.numOfExpectedWords--;
                this.persistentWordData.pop();

                this.input.value = this.input.value.split(" ").slice(0, -1).join(" ");
            }

            this.updateWords(words);
        }

        unbindEvent(this.input, this.changeHandler);

        // @ts-ignore
        if (this.lastAnswered) {
            // @ts-ignore
            const elt = this.lastAnswered;
            while (elt.nextSibling) elt.parentNode.removeChild(elt.nextSibling);
        }
        let persistantData = [...this.persistentWordData];
        console.log("Before filtering", [...persistantData]);

        persistantData = persistantData.filter((a) => a?.id != undefined);
        console.log("Before sort", [...persistantData]);

        persistantData.sort((a, b) => a.id - b.id);
        console.log("After", [...persistantData]);

        // @ts-ignore
        // const prevTimestamp = 0;

        for (let index = 1; index < persistantData.length; index++) {
            const prevElement = persistantData[index - 1];
            const element = persistantData[index];
            const nextElement = persistantData[index + 1];

            if (!nextElement) continue;
            if (!prevElement) continue;
            if (element.correctTimeStamp) {
                // @ts-ignore
                element.duration =
                    element.correctTimeStamp - (prevElement.correctTimeStamp ?? prevElement.lastKnownTimeStamp);
                continue;
            }
            if (element.lastKnownTimeStamp) {
                // @ts-ignore
                element.duration =
                    element.lastKnownTimeStamp - (prevElement.correctTimeStamp ?? prevElement.lastKnownTimeStamp);

                continue;
            }

            // @ts-ignore
            element.duration = 0;
        }

        this.showResults(persistantData);

        //Select all elements that have an attribute of results="true"
        const results = document.querySelectorAll("#answer [results=true]");
        console.log(results);
        //On hover of each element, add a child div that is positioned absolute
        results.forEach((result) => {
            console.log(result);
            result.addEventListener("mouseover", (e) => {
                if (result.querySelector(".word-stats")) return;

                const wordID = parseInt(result.getAttribute("word_id"));
                const wordData = persistantData.find((a) => a.id == wordID);

                const prevWordData = persistantData.find((a) => a.id == wordID - 1);

                const strokes = wordData.strokes;
                const expected = wordData.expected;

                const maxLength = strokes.reduce((a, b) => {
                    let len = Math.max(b[1].length, b[2].length);

                    return len > a ? len : a;
                }, 0);

                let informationString = "This word was typed perfectly";

                if (wordData.expected == wordData.typed && wordData.failed_count > 0) {
                    informationString = "You made a mistake while typing this word, but you corrected it";
                }

                if (wordData.expected != wordData.typed) {
                    informationString = "You made a mistake while typing this word, and you did not correct it";
                }

                let durationSeconds;
                if (wordData.correctTimeStamp == null) {
                    durationSeconds = wordData.lastKnownTimeStamp - prevWordData.lastKnownTimeStamp;
                } else {
                    durationSeconds = wordData.correctTimeStamp - prevWordData.lastKnownTimeStamp;
                }

                let durationString = "";
                if (durationSeconds < 1) {
                    durationString = `${Math.round(durationSeconds * 1000)}ms`;
                } else {
                    durationString = `${Math.round(durationSeconds * 100) / 100}s`;
                }

                const correctionDiv = N(
                    "div",
                    [
                        N("h3", "Strokes: "),
                        N("div", [
                            strokes.map((stroke) => {
                                return N(
                                    "div",
                                    [
                                        N("div", stroke[1].padEnd(maxLength), {
                                            class: expected.startsWith(stroke[1])
                                                ? "text-block"
                                                : "text-block--incorrect",
                                        }),
                                        N("div", "=>"),

                                        N("div", stroke[2].padEnd(maxLength), {
                                            class: expected.startsWith(stroke[2])
                                                ? "text-block"
                                                : "text-block--incorrect",
                                        }),
                                    ],
                                    { class: "word-stats__strokes__stroke" }
                                );
                            }),
                        ]),
                    ],
                    {
                        class: "word-stats__strokes",
                    }
                );

                const div = N(
                    "div",
                    {
                        style: {
                            position: "absolute",
                            top: "150%",
                            left: "0",
                        },
                        class: "word-stats",
                    },
                    [
                        N("h2", "Word Stats"),
                        N(
                            "div",
                            [
                                N("p", informationString, {
                                    class: "word-stats__information__description",
                                }),
                            ],
                            {
                                class: "word-stats__information",
                            }
                        ),
                        N("div", [
                            N("span", "Duration: "),
                            N("span", durationString, {
                                class: "text-block",
                            }),
                        ]),
                        correctionDiv,
                        // N("div", [
                        //     N("span", "Errors: "),
                        //     N("span", "0"),
                        // ]),
                        // N("span", [
                        //     N("pre", JSON.stringify({
                        //         id: wordID,
                        //         ...wordData
                        //     }, null, 2 ))
                        // ])
                    ]
                );

                result.appendChild(div);
            });

            result.addEventListener("mouseout", (e) => {
                const div = result.querySelector(".word-stats");
                result.removeChild(div);
            });
        });

        this.saveExerciseReplay(this.exercise, persistantData);

        this.saveDurationInLocalStorage(this.persistentWordData);
        this.saveErrorsInLocalStorage();
    }
    saveExerciseReplay(exercise, persistantData) {
        console.error("saveExerciseReplay is not implemented");
    }

    getAggregateStats() {
        const stats = {};
        for (let i = 0; i < localStorage.length; i++) {
            const Lkey = localStorage.key(i);
            if (Lkey.startsWith("stats-")) {
                // @ts-ignore
                // const date = key.slice(6);
                const statsByDate = JSON.parse(localStorage.getItem(Lkey));
                for (const key in statsByDate) {
                    if (key in stats) stats[key] += statsByDate[key];
                    else stats[key] = statsByDate[key];
                }
            }
        }
        return stats;
    }

    getTodaysStats() {
        // yyyy-mm-dd
        const todayDate = new Date().toISOString().slice(0, 10);
        const statsByToday = JSON.parse(localStorage.getItem("stats-" + todayDate) ?? "{}");
        return statsByToday;
    }

    saveStatsToToday(newPartialStats) {
        // yyyy-mm-dd
        const todayDate = new Date().toISOString().slice(0, 10);

        const stats = this.getTodaysStats();

        const newStats = {
            ...stats,
            ...newPartialStats,
        };
        localStorage.setItem("stats-" + todayDate, JSON.stringify(newStats));
    }

    saveDurationInLocalStorage(words) {
        let durations = this.getTodaysStats()?.durations ?? {};
        if (!durations) durations = {};

        words.forEach((element) => {
            const duration = element.duration;
            if (duration == null || isNaN(duration)) return;
            if (element.expected == null) return;
            const expected = element.expected.replace(/[.,;"]/, "").toLowerCase();
            console.log("Expected, ", expected, element);
            const current = durations[expected] ?? null;
            let resulting = 0;
            if (current == null) {
                resulting = duration;
            } else {
                const diffrence = duration - current;
                resulting = current + diffrence / 10;
            }
            console.log("resulting", resulting);
            durations[expected] = Math.round(resulting * 1000) / 1000;
        });
        console.log(durations);

        this.saveStatsToToday({ durations: durations });
    }
    saveErrorsInLocalStorage() {
        const todayDate = new Date().toISOString().slice(0, 10);
        const statsByToday = JSON.parse(localStorage.getItem("stats-" + todayDate) ?? "{}");

        let errors = statsByToday?.errors ?? [];
        if (!errors) errors = [];

        // Get each occurance of an error in the TypedWords and save the word before and after
        for (let i = 0; i < this.typedWords.length; i++) {
            const typedWord = this.typedWords[i];
            const persistantData = this.persistentWordData?.[i];
            if (typedWord.correct == false) {
                const error = [
                    this.typedWords[i - 1] ? this.typedWords[i - 1].typed : "",
                    typedWord.first_typed,
                    typedWord.expected,
                ];
                errors.push(error);
            } else if (persistantData?.failed) {
                errors.push([
                    this.typedWords[i - 1] ? this.typedWords[i - 1].typed : "",
                    persistantData?.first_typed,
                    typedWord.expected,
                ]);
            }
        }
        this.saveStatsToToday({ errors: errors });
    }

    showResults(persistantData) {
        // @ts-ignore
        let typedWords = this.input.value.replaceAll(/^\s+/g, "").split(/\s+/);
        let seconds = this.clock.getTime(true);
        const gradingResults = this.gradeTypeVsResult(
            // @ts-ignore
            typedWords,
            this.exercise.words
        );
        console.log("gradingResults", gradingResults);
        const errorCount = gradingResults.errorCount;
        const totalWordCount = gradingResults.totalCount;

        const minutes = seconds / 60; // KEEP fractional part for WPM calculation!
        seconds = Math.floor((seconds % 60) * 10) / 10;
        const time = Math.floor(minutes) + ":" + seconds;

        // var wordsFromChars = this.input.value.length / 5;
        const words = totalWordCount;
        const WPM = words / minutes;
        // if (prev) WPM = (words - prev.words) / (minutes - prev.minutes);

        const correctWPM = gradingResults.correctCount / minutes;

        const accuracy = 1 - errorCount / gradingResults.totalCount;

        let results = "Time: " + time + " - " + Math.floor(WPM);
        // if (this.actualWords) {
        //     if (this.actualWords.unit) results += " " + this.actualWords.unit;
        //     else results += " " + this.actualWords;
        // } else {
        const plural = errorCount === 1 ? "" : "s";
        results += " WPM (chars per minute/5)";
        if (errorCount === 0) results += " with no uncorrected errors!";
        else {
            results +=
                ", adjusting for " +
                errorCount +
                " incorrect word" +
                plural +
                " (" +
                Math.floor(100 * accuracy) +
                "%) gives " +
                Math.floor(correctWPM) +
                " WPM.";
        }
        // }

        results = "\n\n" + results;
        // const start = this.resultsDisplay.textContent.length;
        // @ts-ignore
        // const end = start + results.length;

        this.resultsDisplay.textContent += results;
        this.updateWords(this.exercise.words, true);
        // @ts-ignore
        this.renderChart(this.liveWPM.WPMHistory);

        this.resultsDisplay.scrollIntoView(true);
        this.displayTypedWords(this.typedWords, true);

        console.log(persistantData);

        const correctionsElement = document.getElementById("corrections")?.children[0];
        console.log(correctionsElement);

        document.getElementById("corrections").style.display = "table";
        // delete all but the first children
        while (correctionsElement?.children?.length > 1) {
            correctionsElement?.removeChild(correctionsElement?.children[1]);
        }

        // get thr first child of the corrections element

        let sortedPersistantWordData = [...persistantData].sort(function (a, b) {
            return (b.duration ?? 0) - (a.duration ?? 0);
        });

        // filter out all the bad values
        sortedPersistantWordData = sortedPersistantWordData.filter(function (wordData) {
            if (isNaN(wordData.duration)) return false;
            if (wordData.expected == undefined) return false;
            return true;
        });
        sortedPersistantWordData.forEach((element) => {
            const newRow = document.createElement("tr");
            let newCell = document.createElement("td");
            newCell.innerHTML = element.expected;
            newRow.appendChild(newCell);
            newCell = document.createElement("td");
            newCell.innerHTML = ((element.duration ?? 0) * 1000).toFixed(0) + "ms";
            newRow.appendChild(newCell);
            newCell = document.createElement("td");
            newCell.innerHTML = element.failed_count ?? 0;
            newRow.appendChild(newCell);
            correctionsElement?.appendChild(newRow);
        });
    }

    addCursor(output) {
        if (!output) output = this.answerDisplay;
        let cursor = output.querySelector(".cursor");
        if (cursor) return;
        cursor = document.createElement("span");
        cursor.className = "cursor";
        output.appendChild(document.createTextNode("\u200b"));
        output.appendChild(cursor);
    }

    removeCursor(output) {
        if (!output) output = this.display.previousElementSibling;
        const cursors = output.getElementsByClassName("cursor");
        // Note that we go backwards since it is a live collection.  Elements
        // are removed immediately so we need to not screw up indices that we
        // still need.
        for (let i = cursors.length - 1; i >= 0; --i) {
            const c = cursors[i];
            c.parentNode.removeChild(c.previousSibling);
            c.parentNode.removeChild(c);
        }
    }

    // Gets called on focus and blur events, and also gets called with a
    // div when we're building the new output.
    updateCursor(evt) {
        let hasFocus;
        let output;
        if (evt.type === "focus") hasFocus = true;
        else if (evt.type === "blur") hasFocus = false;
        else {
            output = evt;
            hasFocus = document.activeElement === this.input;
        }
        if (hasFocus) this.addCursor(output);
        else this.removeCursor(output);
    }

    renderChart() {
        if (this.wpmChart) {
            this.wpmChart.destroy();
            delete this.wpmChart;
        }

        const averageDatasetData = [
            {
                x: 0,
                y: 0,
            },
        ];

        // zip the persistant word data and the typedWord data
        const combinedData = [];
        for (let i = 0; i < this.typedWords.length; i++) {
            combinedData.push({
                ...this.typedWords[i],
                ...this.persistentWordData[i],
            });
        }

        combinedData.sort((a, b) => a.lastKnownTimeStamp - b.lastKnownTimeStamp);

        for (let i = 0; i < combinedData.length; i++) {
            let pastValue = combinedData[i].lastKnownTimeStamp ?? 0;

            let currentValues = 0;

            for (let j = i; j > 0; j--) {
                if (currentValues >= 10) break;
                if (combinedData[j].correct == false) {
                    continue;
                }
                currentValues++;
                pastValue = combinedData[j];
            }

            const distance = combinedData[i].lastKnownTimeStamp - pastValue;
            averageDatasetData.push({
                x: combinedData[i].lastKnownTimeStamp,
                y: (currentValues / distance) * 60,
                ...combinedData[i],
            });
        }

        const totalDataDataset = [
            {
                x: 0,
                y: 0,
            },
        ];

        for (let i = 0; i < combinedData.length; i++) {
            if (i < 10) {
                totalDataDataset.push({
                    x: combinedData[i].lastKnownTimeStamp,
                    y: (i / combinedData[i].lastKnownTimeStamp) * 60 * (i / (i + 1)),
                    ...combinedData[i],
                });
            } else {
                totalDataDataset.push({
                    x: combinedData[i].lastKnownTimeStamp,
                    y: (i / combinedData[i].lastKnownTimeStamp) * 60,
                    ...combinedData[i],
                });
            }
        }

        // Sort both the totalDataDataset and the averageDatasetData by x
        totalDataDataset.sort(function (a, b) {
            return a.x - b.x;
        });
        averageDatasetData.sort(function (a, b) {
            return a.x - b.x;
        });

        // Apply a rolling average of 5 to the data

        // @ts-ignore
        const aw = this.actualWords;
        const unit = aw && aw.u ? aw.u : "WPM";

        const data = {
            datasets: [
                {
                    label: unit,
                    data: averageDatasetData,
                    fill: false,
                    borderColor: "rgb(75, 192, 192)",
                    pointRadius: 5,
                    pointBackgroundColor: function (context) {
                        const index = context.dataIndex;
                        const value = context.dataset.data[index];
                        let color = "green";
                        if (!value.correct) {
                            color = "red";
                        } else if (value.correct && value.failed) {
                            color = "yellow";
                        }
                        return color;
                    },
                    tension: 0.2,
                    showLine: true,
                },
                {
                    label: "Total WPM",
                    data: totalDataDataset,
                    pointBackgroundColor: function (context) {
                        const index = context.dataIndex;
                        const value = context.dataset.data[index];

                        let color = "green";
                        if (!value.correct) {
                            color = "red";
                        } else if (value.correct && value.failed) {
                            color = "yellow";
                        }
                        return color;
                    },
                    fill: false,
                    borderColor: "rgb(255, 99, 132)",
                    pointRadius: 5,
                    tension: 0.2,
                    showLine: true,
                },
            ],
        };

        const config = {
            type: "scatter",
            data: data,
            options: {
                scales: { y: { beginAtZero: true } },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        displayColors: false,
                        callbacks: {
                            title: function (context) {
                                return context[0].raw.expected;
                            },
                            label: function (context) {
                                return ["WPM :" + context.raw.y.toFixed(), context.raw.x.toFixed(2) + "s"];
                            },
                        },
                    },
                },
            },
        };
        document.getElementById("chartDiv").style.display = "block";
        // @ts-ignore
        this.wpmChart = new Chart(
            // @ts-ignore
            document.getElementById("chartDiv").getContext("2d"),
            config
        );
    }

    // -----------------------------------------------------------------------
}

class LiveWPM {
    constructor(elt, typeJig, showLiveWPM) {
        this.elt = elt;
        elt.innerHTML = "";
        this.typeJig = typeJig;
        this.prevSpeed = null;
        this.showLiveWPM = showLiveWPM;
    }
    update(seconds) {
        const aw = this.typeJig.actualWords;
        const unit = aw && aw.u ? aw.u : "WPM";
        const stats = this.typeJig.currentSpeed(seconds, this.prevSpeed);
        this.prevSpeed = stats;
        // Show the average of the last (up to) 5 samples

        // Get the average distance between the last 5 samples
        const persistantData = this.typeJig.persistentWordData;

        if (persistantData.length >= 11) {
            if (!persistantData[persistantData.length - 1]) {
                this.elt.innerHTML = "~ First Unknown";
                return;
            }
            if (!persistantData[persistantData.length - 11]) {
                this.elt.innerHTML = "~ Second Unknown";
                return;
            }
            const distance =
                persistantData[persistantData.length - 1].lastKnownTimeStamp -
                persistantData[persistantData.length - 11].lastKnownTimeStamp;

            if (this.showLiveWPM) {
                this.elt.innerHTML = "~" + Math.floor((10 / distance) * 60) + " " + unit;
            }
        } else {
            const distance = persistantData[persistantData.length - 1].lastKnownTimeStamp;

            if (this.showLiveWPM) {
                this.elt.innerHTML = "~" + Math.floor((persistantData.length / distance) * 60) + " " + unit;
            }
        }
    }
    reset() {
        this.WPMHistory = [];
    }
}
TypeJig.LiveWPM = LiveWPM;

export function setExercise(name, exercise, hints = null, options = {}, getNewURL = null, getNewExercise = null) {
    const h = document.getElementById("lesson-name");
    name ??= exercise.name;
    h.textContent = name;
    document.title = name + " - Steno Grade";

    const back = document.getElementById("back");
    // @ts-ignore
    back.href =
        document.location.href.replace(/\?.*$/, "").replace(/\/[^\/]*$/, "") + "/" + (options.menu || "form") + ".html";
    const again = document.getElementById("again");
    // @ts-ignore
    again.href = document.location.href;

    const end = document.getElementById("end");
    // @ts-ignore
    end.href = document.location.href;

    // Add the options from local storage to the options
    const settings = localStorage.getItem("settings") ?? "{}";
    const customSettings = JSON.parse(localStorage.getItem("custom_settings") ?? "{}");

    if (settings) {
        options = {
            ...(JSON.parse(settings) ?? {}),
            ...customSettings,
            ...options,
            getNewExercise,
            getNewURL,
        };
    }
    console.log("Setting exersize", exercise, hints, options);

    // if (jig != null) jig.exercise = exercise;
    const jig = new TypeJig(exercise, options, hints);
    initializeButtons(jig);
    return jig;
}

// @ts-ignore
function initializeHints(hints, floatingHints) {
    const strokes = document.getElementsByClassName("strokes")[0];
    if (floatingHints) {
        // @ts-ignore
        strokes.style.position = "fixed";
    }
    // @ts-ignore
    const translations = TypeJig.shortestTranslations(PloverTranslations);
    console.log("Making stenoDisplay", PloverTranslations, translations);

    return new StenoDisplay(strokes, translations, true);
}
// function nextItem(range) {
//     range.collapse();
//     const next = range.endContainer.nextElementSibling;
//     if (next != null) {
//         range.setStart(next, 0);
//         range.setEnd(next, 1);
//         if (/^\s+$/.test(range.toString())) nextItem(range);
//     }
// }

// function nextWord(words) {
//     let word = words.shift() || "";
//     if (/^\s+$/.test(word)) word = words.shift() || "";
//     return word;
// }

function checkMatch(typed, expected) {
    if (typed == "" || typed == null || typed == undefined) return false;
    if (expected == "" || expected == null || expected == undefined) {
        return false;
    }
    if (typed.length < expected.length && typed === expected.slice(0, typed.length)) {
        return null;
    }
    return typed === expected;
}

// -----------------------------------------------------------------------
// Helper functions

const isOwnPlural = { cod: true };

export function pluralize(word) {
    if (isOwnPlural.hasOwnProperty(word)) return word;
    switch (word[word.length - 1]) {
    case "s":
        return word + "es";
    case "y":
        return word.slice(0, -1) + "ies";
    default:
        return word + "s";
    }
}

function bindEvent(elt, evt, fn) {
    if (elt.addEventListener) elt.addEventListener(evt, fn, false);
    else if (elt.attachEvent) elt.attachEvent("on" + evt, fn);
}

function unbindEvent(elt, evt, fn) {
    if (elt.removeEventListener) elt.removeEventListener(evt, fn, false);
    else if (elt.detachEvent) elt.detachEvent("on" + evt, fn);
}

function documentElement(elt) {
    if (typeof elt === "string") elt = document.getElementById(elt);
    return elt;
}

function scrollOffset(elt) {
    let offset = 0;
    if (elt.offsetParent) {
        do {
            offset += elt.offsetTop;
        } while ((elt = elt.offsetParent));
    }
    return offset;
}

export function wordCombos(combos) {
    let index0;
    let index1;

    function nextWord() {
        if (index0 == null) {
            shuffle(combos);
            for (let i = 0; i < combos.length; ++i) shuffle(combos[i]);
            index0 = 0;
            index1 = 0;
        }
        if (index1 >= combos[index0].length) {
            index0++;
            index1 = 0;
        }
        if (index0 < combos.length) return combos[index0][index1++];
        else {
            index0 = null;
            return nextWord();
        }
    }

    return nextWord;
}
// // @ts-ignore
// function hasClass(elt, className) {
//     const re = new RegExp("(s|^)" + className + "(s|$)");
//     return re.test(elt.className);
// }

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */

export function randomIntLessThan(n) {
    return Math.floor(n * Math.random()) % n;
}

export function shuffleTail(a, n) {
    n = Math.min(n, a.length);
    let i = n;
    const b = a.length - n; // current and base indices
    while (--i > 0) {
        const other = randomIntLessThan(i + 1);
        const t = a[i + b];
        a[i + b] = a[other + b];
        a[other + b] = t;
    }
}

export function randomize(a) {
    shuffleTail(a, a.length);
    a.randomEltsUsed = 0;
}

// Rotate the first word out to the end of the array.
// If the array has been `randomize`d (has a `randomEltsUsed` property
// defined), shuffle the used words when more than 2/3 of them have been used,
// which ensures that the last word can't be shuffled to be the next one in the
// queue.
// @ts-ignore
export function rotateAndShuffle(a) {
    if (typeof a.used === "undefined") a.used = 0;
    // don't shuffle if the current entry is multiple words
    else if (typeof a[0].i === "undefined") {
        a.push(a.shift());
        a.used += 1;

        if (typeof a.randomEltsUsed === "undefined") {
            if (a.used >= a.length) return false;
        } else {
            a.randomEltsUsed += 1;
            if (a.randomEltsUsed > (2 / 3) * a.length) {
                shuffleTail(a, a.randomEltsUsed);
                a.randomEltsUsed = 0;
            }
        }
    }
    return a[0];
}

// // @ts-ignore
// function movingAvg(array, countBefore, countAfter) {
//     if (countAfter == undefined) countAfter = 0;
//     const result = [];
//     for (let i = 0; i < array.length; ++i) {
//         const subArr = array.slice(
//             Math.max(i - countBefore, 0),
//             Math.min(i + countAfter + 1, array.length),
//         );
//         const avg =
//             subArr.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / subArr.length;
//         result.push(avg);
//     }
//     return result;
// }

// -----------------------------------------------------------------------

/**
 * @property {number} startTime - propriety description
 *
 *
 *
 * @param {*} elt The element to display the text in
 * @param {number|null} countdownMs The number of seconds if any that represents the "end" of the timer
 * @param {*} onUpdate A function to call when the timer 'ticks'
 *
 * @property {number} startTime The element to display the text in
 */
class Timer {
    /**
     * @param {*} elt The element to display the text in
     * @param {number|null} countdownMs The number of seconds if any that represents the "end" of the timer
     * @param {*} onUpdate A function to call when the timer 'ticks'
     */
    constructor(elt, countdownMs, onUpdate) {
        this.elt = elt;
        elt.innerHTML = "";

        this.alarm = countdownMs > 0;
        this.timerLength = countdownMs ?? 0;

        this.updateThis = this.update.bind(this);
        this.showTime();
        this.onUpdate = onUpdate || function () {};
        this.running = false;
        console.log("Timer", this);
    }
    /**
     *
     * @return {number} Returns the number of seconds (fractional!) since the timer has started. 0 if not started
     */
    getTime(round) {
        if (!this.startTime) return 0;
        if (round) {
            return Math.floor((new Date().getTime() - this.startTime) / 1000);
        } else {
            return (new Date().getTime() - this.startTime) / 1000;
        }
    }

    reset() {
        delete this.startTime;
        delete this.endTime;
        this.seconds = 0;
        this.showTime();
    }

    start(alarm) {
        this.onFinished = alarm;
        this.startTime = new Date().getTime();
        if (this.alarm) this.endTime = this.startTime + this.timerLength;

        window.setTimeout(this.updateThis, 1000);
    }

    stop() {
        const elapsed = (new Date().getTime() - this.startTime) / 1000;
        if (this.onFinished) this.onFinished(elapsed);
        delete this.startTime;
        delete this.endTime;
    }

    update() {
        if (this.startTime) {
            let running = true;
            const now = new Date().getTime();
            const msElapsed = Math.max(0, now - this.startTime);
            const msTilNext = 1000 - (msElapsed % 1000);

            if (this.endTime) running = now < this.endTime;

            this.showTime();

            this.onUpdate(msElapsed);

            if (running) window.setTimeout(this.updateThis, msTilNext);
            else this.stop();
        }
    }

    showTime() {
        if (!this.elt) return;
        let elapsed = this.getTime(true);

        if (this.alarm) {
            elapsed = Math.floor(this.timerLength / 1000 - elapsed);
        }

        const m = Math.floor(elapsed / 60);
        let s = elapsed % 60;
        // @ts-ignore
        if (s < 10) s = "0" + s;
        this.elt.innerHTML = m + ":" + s;
    }

    hide() {
        this.elt.style.display = "none";
    }
}
TypeJig.Timer = Timer;

// -----------------------------------------------------------------------

/**
 * @typedef {Object} ExerciseOptions
 *
 * @property {string} [name] The name of the exercise
 * @property {string[] | string[][]} [words] The words to type
 * @property {boolean} [shuffle] Whether to shuffle the words
 * @property {string} [type] The type of exercise
 *
 * @property {number} [seed] The seed to use for the random number generator, If applicable
 *
 * ## Endless options
 * @property {number} [seconds] The number of seconds to type all the words
 * @property {boolean} [endless] Whether to keep going until the user stops
 * @property {number} [maxLinesBeforeAppend] The number of lines to display before appending new lines
 *
 * @property {function} [getNextWords] A function to call to get the next words
 */

/**
 * @typedef {Object} Options
 *
 * @property {string} [name] The name of the exercise
 * @property {string[]} [words] The words to type
 * @property {number} [seconds] The number of seconds to type all the words
 * @property {boolean} [shuffle] Whether to shuffle the words
 *
 * @property {boolean} [showTimer] Whether to show the timer
 * @property {number} [maxLinesBeforeAppend] Whether to show the word count
 */

/**
 * @class Exercise
 *
 * @param {string[] | string[][]} words The words to type
 * @param {number} seconds The number of seconds to type all the words
 * @param {boolean} shuffle Whether to shuffle the words
 * @param {*} select
 * @param {*} speed
 */

class Exercise {
    /**
     *
     * @param {ExerciseOptions} options
     */
    constructor(options) {
        this.options = options;
        this.name = options.name || "Exercise";

        this.enterPoints = [];

        let words = [...options.words];

        if (options.shuffle) {
            let rng = newRNG(options.seed);
            words = shuffle(words, rng);
        }

        const processedWords = [];

        /**
         * @type {string[]}
         */
        let flatWords = words.flat(2);
        for (let i = 0; i < flatWords.length; i++) {
            if (flatWords[i] == "\n") {
                processedWords.push("\n" + (flatWords[i + 1] ?? ""));
                i++;
            } else {
                processedWords.push(flatWords[i]);
            }
        }

        this.started = false;
        /**
         * @type {string[]}
         */
        this.words = processedWords;
        console.log(this.words);
        // Remove all the \n characters from words
        this.words = this.words.map((w) => w?.replace(/\n/g, ""));
        this.words = this.words.filter((w) => w != "");
        /**
         * @type {string[]}
         */
        this.rawWords = [...processedWords];
        this.seconds = options.seconds || 0;
        // this.select =
        //     TypeJig.Exercise.select[select] || TypeJig.Exercise.select.random;

        this.endless = options.endless || false;
        this.getNextWords = options.getNextWords;
        this.maxLinesBeforeAppend = options.maxLinesBeforeAppend;

        this.numOfExpectedWords = -1;
    }

    calculateBreakPoints(display) {
        this.enterPoints = [];

        const words = this.rawWords;
        while (display.firstChild) {
            display.removeChild(display.firstChild);
        }

        // @ts-ignore
        // const y = 0;
        const r = display.getBoundingClientRect();
        console.log(r, words);

        let x = 0;

        for (let i = 0; i < words.length; ++i) {
            const word = words[i];
            const span = N("span", word + " ");

            display.appendChild(span);

            console.log(display);

            console.log(word, span.getBoundingClientRect(), r.width, span);
            if (word.includes("\n") || x > r.width) {
                if (i != 0) this.enterPoints.push(i);
                x = 0;
            }
            // output.appendChild(document.createTextNode("\n"));
            // if (endOfAnswer) {
            // var limit = 0.66 * window.innerHeight;
            // var end = this.display.getBoundingClientRect().bottom;
            // var r = range.getBoundingClientRect();
            // if (end > window.innerHeight && r.bottom > limit)
            // window.scrollBy(0, r.bottom - limit);
            // }
            x += span.getBoundingClientRect().width;
        }
        console.log(this.enterPoints);
        return display;
    }
}
TypeJig.Exercise = Exercise;

// // @ts-ignore
// function indexInto(a) {
//     if (typeof a.i === "undefined") a.i = 0;
//     const word = a[a.i];
//     if (++a.i === a.length) delete a.i;
//     return word;
// }

// TypeJig.

class ExerciseReplay {
    /**
     *
     * @param {Exercise} exercise
     * @param {string} url
     * @param {*} options
     * @param {PersistantWordData[]} persistantData
     */
    constructor(exercise, url, options, persistantData) {
        this.exercise = exercise;
        this.url = url;
        this.options = options;
        this.persistantData = persistantData;
    }
}
