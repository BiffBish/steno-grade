/* -----------------------------------------------------------------------
 * TypeJig - run a typing lesson.
 *
 * `exercise` is a TypeJig.Exercise object, while `display`, `input`,
 * `output`, and `clock` are elements (or element ID strings).
 */

function TypeJig(exercise, options, hint = null) {
    /**
     *
     */
    this.gradingRules = {};
    if (options?.gradingRules) {
        this.gradingRules = JSON.parse(atob(options?.gradingRules));
    }
    console.log("Grading rules", this.gradingRules);

    console.log("TypeJig", exercise, hint);
    this.exercise = exercise;

    this.display = documentElement("exercise");
    this.answerDisplay = documentElement("answer");
    this.input = documentElement("input");
    this.resultsDisplay = documentElement("results");
    const liveWPM = documentElement("live-wpm-display");
    const clockElt = documentElement("clock");

    this.liveWPM = new TypeJig.LiveWPM(liveWPM, this, options?.live_wpm);
    const updateWPM = this.liveWPM.update.bind(this.liveWPM);
    this.clock = new TypeJig.Timer(
        clockElt,
        exercise.seconds * 1000,
        updateWPM
    );
    if (hint) this.hint = hint;
    else this.hint = initializeHints(options?.hints);

    if (options?.hints == "true") this.hint.show();
    else this.hint.hide();

    if (!options?.show_timer) this.clock.hide();

    this.live_wpm = options?.live_wpm;
    this.live_cpm = options?.live_cpm;
    console.log(options);
    this.hint_on_fail = options?.hints?.startsWith("fail");
    this.hint_on_fail_count = parseInt(options?.hints?.split("-")[1] || 1);

    this.showing_hint_on_word = "";

    this.typedWords = [];

    this.persistentWordData = [];

    this.lastTypedWordID = -1;

    this.options = options;
    if (options) {
        if (options.wpm !== "" && Math.floor(+options.wpm) == options.wpm) {
            this.speed = { type: "wpm", value: options.wpm };
        } else if (
            options.cpm !== "" &&
            Math.floor(+options.cpm) == options.cpm
        ) {
            this.speed = { type: "cpm", value: options.cpm };
        }
    }

    var self = this; // close over `this` for event handlers.

    this.changeHandler = this.answerChanged.bind(this);
    bindEvent(document.body, "keydown", this.keyDown.bind(this));
    bindEvent(this.input, "input", function () {
        if (!self.pendingChange) {
            self.pendingChange = setTimeout(self.changeHandler, 5);
        }
    });

    var focusHandler = this.updateCursor.bind(this);
    bindEvent(this.input, "focus", focusHandler);
    bindEvent(this.input, "blur", focusHandler);
    function focusInput(evt) {
        self.input.focus();
        evt.preventDefault();
    }
    bindEvent(this.display, "click", focusInput);

    this.reset();
}

TypeJig.prototype.reset = function () {
    this.enter_count = 0;

    this.showing_hint_on_word = "";

    this.persistentWordData = [];

    this.lastTypedWordID = -1;

    this.display.style.width = "100%";
    this.exercise.calculateBreakPoints(this.display);

    document.getElementById("corrections").style.display = "none";
    document.getElementById("chartDiv").style.display = "none";

    this.liveWPM.reset();
    this.display.style.width = "200%";
    this.typedWords = [];

    this.resultsDisplay.textContent = "";
    if (this.exercise && !this.exercise.started) {
        this.display.textContent = "";
    }
    spans = this.display.querySelectorAll("span");
    if (this.speed)
        for (let i = 0; i < spans.length; ++i) {
            spans[i].className = "notYet";
        }
    console.log("105", this.hint);
    if (this.hint && this.hint.update) {
        //Get a string containing the next 10 words. if its at the end of the list get as much as you can.

        var word = this.exercise.words[0];
        var rect = this.display.getBoundingClientRect();

        this.hint.update(word, rect.left, rect.top);
        this.hint.startupPrecompute(this.exercise.words);
    }

    // if (this.hint && this.hint_on_fail) this.hint.show();

    // this.display.previousElementSibling.textContent = '';

    this.pendingChange = true;
    this.input.value = "";
    this.input.blur();
    this.input.focus();
    delete this.pendingChange;

    this.running = false;
    this.clock.reset();
    this.updateWords(this.exercise.words, true);
    this.displayTypedWords([]);
    window.scroll(0, scrollOffset(this.display));
};

TypeJig.wordsAndSpaces = function (string) {
    return string.match(/\S+|\s+/g) || [];
};

// Can contain a text-to-pseudosteno dictionary for each steno theory.
// Pseudosteno can be a single string or an array of strings, with
// longest entries first and shortest briefs last.
TypeJig.Translations = {};

TypeJig.processTranslations = function (t, fn) {
    var out = {};

    //Flip around the keys and values. treating duplicates as a list.
    for (var key in t) {
        var value = t[key];
        //If the value is already in the output as a list
        if (out[value] instanceof Array) {
            out[value].push(key);
        } else {
            out[value] = [key];
        }
    }
    return out;
};

TypeJig.longestTranslations = function (t) {
    return TypeJig.processTranslations(t, function (steno, text) {
        return steno instanceof Array ? steno[0] : steno;
    });
};

TypeJig.shortestTranslations = function (t) {
    //Get the custom dictionarys from localstorage
    customDictionariesString = localStorage.getItem("customDictionaries");
    console.log(customDictionariesString);
    var customDictionaries = [];
    if (customDictionariesString) {
        JSON.parse(customDictionariesString).forEach((dictionary) => {
            customDictionaries.push(TypeJig.processTranslations(dictionary));
        });
    }

    customDictionaries.push(TypeJig.processTranslations(t));

    console.log("Custom dic", customDictionaries);

    return customDictionaries;
};

// Arrays of strings (or of arrays of strings).
TypeJig.WordSets = {};
TypeJig.flattenWordSet = function (a) {
    out = [];
    for (var i = 0; i < a.length; ++i) out.push.apply(out, a[i]);
    return out;
};

TypeJig.prototype.start = function () {
    this.clock.start(this.endExercise.bind(this));
    this.startTime = Date.now();
    this.running = true;
    if (this.speed) {
        this.speed.current = this.display.firstElementChild;
        this.tick();
    }
};

TypeJig.prototype.tick = function () {
    var s = this.speed;
    if (!(this.running && s && s.current)) return;
    var fn = this.tick.bind(this);
    var ms = (1000 * 60) / s.value;

    this.exercise.numOfExpectedWords++;

    var thisWord = this.exercise.words[this.exercise.numOfExpectedWords];

    this.updateWords(this.exercise.words);
    if (s.type === "cpm") ms *= thisWord.length;

    if (s.current) setTimeout(fn, ms);
};

function nextItem(range) {
    range.collapse();
    var next = range.endContainer.nextElementSibling;
    if (next != null) {
        range.setStart(next, 0);
        range.setEnd(next, 1);
        if (/^\s+$/.test(range.toString())) nextItem(range);
    }
}

function nextWord(words) {
    var word = words.shift() || "";
    if (/^\s+$/.test(word)) word = words.shift() || "";
    return word;
}

TypeJig.prototype.setWord = function (word, id) {
    this.typedWords[id] = {
        ...this.typedWords[id],
        ...word,
    };
};

TypeJig.prototype.onWord = function (word, id) {
    console.log("OnWord");
    this.typedWords.forEach((element) => {
        element.current = false;
    });

    var oldWord = this.typedWords[id];

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

    //If we skip a word we need to mark the skipped words as dropped
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
};

TypeJig.prototype.gradeTypeVsResult = function (typedWords, expectedWords) {
    //remove any leading spaces on typedWords
    //any blank type words if they are at the end
    let trailingSpace = false;
    if (typedWords[typedWords.length - 1] == "" && typedWords.length > 1) {
        typedWords.pop();
        trailingSpace = true;
    }
    var options = this.options;
    // Display the user's answer, marking it for correctness.
    var oldOutput = this.display.previousElementSibling;
    var output = document.createElement("div");
    output.id = oldOutput.id;

    var expectedWords = this.exercise.words;

    var typedIndex = 0;
    var expectedIndex = 0;

    var wordList = [];

    var errorCount = 0;
    var correctCount = 0;

    for (let i = 0; i < typedWords.length; ++i) {
        if (typedIndex >= typedWords.length) break;
        var typed = typedWords[typedIndex];
        var expected = expectedWords[expectedIndex];
        var matchResult = checkMatch(typed, expected);
        var lastTypedWord = typedIndex === typedWords.length - 1;
        this.persistentWordData[typedIndex] = {
            ...this.persistentWordData[typedIndex],
            id: typedIndex,
            expected: expected,
            typed: typed,
        };
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
            //If its partial and the last word, we need to add it
            wordList.push({
                correct: null,
                expected: expected,
                typed: typed,
            });
            break;
        }

        //Check if we are on an erranious word and further on we type a correct word
        let addedWordsOffset = 0;

        for (
            let offset = 1;
            offset <= (options?.grade_rules_addedWordMaxJump ?? 5);
            offset++
        ) {
            if (typedIndex + offset >= typedWords.length) break;
            const offsetTypedWord = typedWords[typedIndex + offset];
            let offsetMatch = checkMatch(offsetTypedWord, expected);

            if (offsetMatch != false) {
                addedWordsOffset = offset;
                break;
            }
        }

        let droppedWordOffset = 0;

        for (
            let offset = 1;
            offset <= (options?.grade_rules_droppedWordMaxJump ?? 5);
            offset++
        ) {
            console.log("Trying to find a dropped word");
            if (expectedIndex + offset >= expectedWords.length) break;
            const offsetExpectedWord = expectedWords[expectedIndex + offset];
            let offsetMatch = checkMatch(typed, offsetExpectedWord);
            if (lastTypedWord && offsetMatch == null) {
                droppedWordOffset = offset;
                break;
            }
            if (offsetMatch == true) {
                droppedWordOffset = offset;
                break;
            }
        }

        //Chose the lower of the two that are not zero

        //If they are both zero assume it was just a misspelling

        if (addedWordsOffset == 0 && droppedWordOffset == 0) {
            if (typed.length > 0) {
                this.persistentWordData[typedIndex] = {
                    ...this.persistentWordData[typedIndex],
                    failed: true,
                    first_typed:
                        this.persistentWordData[typedIndex]?.first_typed ??
                        typed,
                    expected: expected,
                    typed: typed,
                };
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

        if (addedWordsOffset == 0) addedWordsOffset = Infinity;
        if (droppedWordOffset == 0) droppedWordOffset = Infinity;

        //If one of them are a solution
        if (addedWordsOffset <= droppedWordOffset) {
            addedWords = [];
            for (let i = 0; i < addedWordsOffset; i++) {
                addedWords.push(typedWords[typedIndex + i]);
            }
            wordList.push({
                correct: checkMatch(
                    typedWords[typedIndex + addedWordsOffset],
                    expected
                ),
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
            droppedWords = [];
            for (let i = 0; i < droppedWordOffset; i++) {
                wordList.push({
                    correct: false,
                    expected: expectedWords[expectedIndex + i],
                    typed: "",
                });
            }
            wordList.push({
                correct: checkMatch(
                    typed,
                    expectedWords[expectedIndex + droppedWordOffset]
                ),
                expected: expectedWords[expectedIndex + droppedWordOffset],
                typed: typed,
            });
            expectedIndex += droppedWordOffset;
            expectedIndex++;
            typedIndex++;
            errorCount += droppedWordOffset;
            continue;
        }
    }

    //Timestamp the last word
    var LastWord = this.persistentWordData[wordList.length - 1];
    var LastTypedWord = wordList[wordList.length - 1];
    console.log(LastWord, "LastWord");
    console.log(LastTypedWord, "LastWord");
    console.log([...this.persistentWordData], "input data");

    //if the last typed word is correct, add the timestamp
    if (LastTypedWord.correct == true) {
        let nowTime = this.clock.getTime();
        let savedTime = LastWord.correctTimeStamp;
        console.log(nowTime, savedTime, wordList.length - 1);
        this.persistentWordData[wordList.length - 1] = {
            ...this.persistentWordData[wordList.length - 1],
            correctTimeStamp:
                this.persistentWordData[wordList.length - 1]
                    ?.correctTimeStamp ?? nowTime,
        };
        console.log(
            "setting value for ",
            wordList.length - 1,
            this.persistentWordData[wordList.length - 1]
        );
    }
    console.log([...this.persistentWordData], "persistentWordData");
    this.persistentWordData[wordList.length - 1] = {
        ...this.persistentWordData[wordList.length - 1],
        lastKnownTimeStamp: this.clock.getTime(),
    };
    if (trailingSpace) {
        wordList.push({
            correct: null,
            expected: "placeholder",
            typed: "",
        });
    }
    return {
        words: wordList,
        correctCount: correctCount,
        errorCount: errorCount,
        totalCount: expectedWords.length,
    };
};

TypeJig.prototype.displayTypedWords = function (typedWords, onResults = false) {
    delete this.pendingChange;

    var ex, match;

    // Display the user's answer, marking it for correctness.

    var output = document.createElement("div");

    for (let i = 0; i < typedWords.length; i++) {
        var word = typedWords[i];
        //insert space if not the first word

        if (word.typed == "" && word.expected == "") {
            continue;
        }

        if (i != 0) {
            output.appendChild(document.createTextNode(" "));
        }

        var ans = word.typed;
        match = word.correct;
        ex = word.expected;

        if (this.exercise && this.exercise.enterPoints.includes(i)) {
            output.appendChild(document.createTextNode("\n"));
        }

        //If the match has any erronius words, display them
        if (word.addedWords) {
            for (let j = 0; j < word.addedWords.length; j++) {
                var addedWord = word.addedWords[j];
                var addedWordNode = document.createElement("span");
                addedWordNode.appendChild(document.createTextNode(addedWord));
                if (this.options.show_live_grading || onResults) {
                    addedWordNode.className = "incorrect";
                } else {
                    addedWordNode.className = "unknown";
                }
                output.appendChild(addedWordNode);
                output.appendChild(document.createTextNode(" "));
            }
        }

        var persistentData = this.persistentWordData[i];
        //If its the last element
        if (i === typedWords.length - 1 || match) {
            var typedSpan = document.createElement("span");
            typedSpan.appendChild(document.createTextNode(ans));

            let className = "";
            // console.log(this.options.show_corrections);
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
                className = "unknown";
            }
            typedSpan.className = className;
            // if (match != null)
            //     typedSpan.className = !match
            //         ? "incorrect"
            //         : persistentData?.failed
            //         ? "corrected"
            //         : "correct";
            output.appendChild(typedSpan);
            continue;
        }

        var div = document.createElement("span");
        div.style.display = "inline-block";
        div.style.lineHeight = "1";
        div.style.position = "relative";
        if (ex != "" && ans == "") {
            if (this.options.show_live_grading || onResults) {
                div.className = "blankWord";
            } else {
                div.className = "unknown";
            }
        }

        var typedSpan = document.createElement("span");
        typedSpan.style.position = "absolute";
        typedSpan.style.left = "0px";
        var expectedSpan = document.createElement("span");
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

        var className = "incorrect";
        if (this.options.show_live_grading || onResults) {
            if (match == true) {
                className = "correct";
            }
            if (persistentData?.failed && this.options.show_corrections) {
                className = "corrected";
            }
        } else {
            className = "unknown";
        }
        typedSpan.className = className;
        // if (match != null)
        // typedSpan.className = word.corrected
        //     ? "corrected"
        //     : match
        //     ? "correct"
        //     : "incorrect";

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

    if (
        ex !== this.showing_hint_on_word &&
        this.hint_on_fail &&
        match &&
        this.hint
    ) {
        this.showing_hint_on_word = "";
        // this.hint.show();
    }
    output.id = this.answerDisplay.id;
    this.answerDisplay.parentNode.replaceChild(output, this.answerDisplay);
    this.answerDisplay = output;
    return null;
};

function checkMatch(typed, expected) {
    if (typed == "" || typed == null || typed == undefined) return false;
    if (expected == "" || expected == null || expected == undefined)
        return false;
    if (
        typed.length < expected.length &&
        typed === expected.slice(0, typed.length)
    ) {
        return null;
    }
    return typed === expected;
}

TypeJig.prototype.answerChanged = function () {
    delete this.pendingChange;
    let typedWords = this.input.value.replaceAll(/^\s+/g, "").split(/\s+/);

    //replace all leading spaces if they exist

    if (this.resultsDisplay.textContent !== "") return;
    if (!this.running && !!this.input.value.trim()) {
        this.start();
    }
    let gradeResults = this.gradeTypeVsResult(typedWords, this.exercise.words);

    let lastWordIndex = gradeResults.words.length - 1;

    let numOfFailsThisWord =
        this.persistentWordData[lastWordIndex]?.failed_count ?? 0;

    // this.failedThisWord = false;

    let currentWordisError =
        gradeResults.words[lastWordIndex]?.correct == false;

    if (currentWordisError && this.failedThisWord == false) {
        this.failedThisWord = true;
        numOfFailsThisWord++;
        this.persistentWordData[lastWordIndex] = {
            ...this.persistentWordData[lastWordIndex],
            failed_count: numOfFailsThisWord,
        };
        console.log(
            "Adding error to index:",
            lastWordIndex,
            "count:",
            numOfFailsThisWord
        );
    }

    if (
        this.lastWordIndex != lastWordIndex ||
        gradeResults.words[lastWordIndex].typed == ""
    ) {
        this.lastWordIndex = lastWordIndex;
        this.failedThisWord = false;
    }
    if (this.options.hint_on_fail) {
        if (
            numOfFailsThisWord > this.options.hint_on_fail_count &&
            gradeResults.words[lastWordIndex]?.correct == null
        ) {
            this.hint.show();
        } else {
            this.hint.hide();
        }
    }

    // if (this.hint_on_fail) {
    //     if (gradeResults.words[lastWordIndex].typed == "") {
    //         lastWordIndex--;
    //     }

    //     let onLastWord = (this.erroredWordIndex ?? 0) == lastWordIndex;
    //     let beforeTheErrorWord =
    //         (this.erroredWordIndex ?? 0) - 1 == lastWordIndex;

    //     let superBeforeTheErrorWord =
    //         (this.erroredWordIndex ?? 0) - 1 > lastWordIndex;
    //     let pastErrorWord = lastWordIndex > (this.erroredWordIndex ?? 0);

    //     if (
    //         this.lastWordIndex != lastWordIndex &&
    //         (this.numOfLastWordErrors ?? 0) > 0
    //     ) {
    //         this.waitingForError = true;
    //         if ((this.numOfLastWordErrors ?? 0) > 0) {
    //             if (
    //                 beforeTheErrorWord &&
    //                 (this.numOfLastWordErrors ?? 0) >= this.hint_on_fail_count
    //             ) {
    //                 this.hint.show();
    //             }
    //         }
    //     }
    //     if (pastErrorWord || superBeforeTheErrorWord) {
    //         console.log("Resetting error");
    //         this.waitingForError = false;
    //         this.numOfLastWordErrors = 0;
    //         this.erroredWordIndex = null;
    //         this.hint.hide();
    //     }
    //     if (this.waitingForError) {
    //         if (currentWordisError) {
    //             this.waitingForError = false;
    //             this.numOfLastWordErrors ??= 0;
    //             this.numOfLastWordErrors += 1;
    //             this.hint.hide();
    //         }
    //         if (
    //             gradeResults.words[this.erroredWordIndex ?? 0]?.correct == true
    //         ) {
    //             this.waitingForError = false;
    //             this.numOfLastWordErrors = 0;
    //             this.erroredWordIndex = null;
    //             this.hint.hide();
    //         }
    //     } else {
    //         if (
    //             (this.numOfLastWordErrors ?? 0) == 0 &&
    //             !this.waitingForError &&
    //             currentWordisError
    //         ) {
    //             this.waitingForError = false;
    //             this.erroredWordIndex = lastWordIndex;
    //             this.numOfLastWordErrors = 1;
    //         }
    //     }
    // }

    this.typedWords = gradeResults.words;

    if (
        this.typedWords.length >= this.exercise.words.length &&
        this.typedWords[this.typedWords.length - 1].correct
    ) {
        window.setTimeout(this.clock.stop.bind(this.clock));
    }
    this.updateCursor(this.answerDisplay);

    //Get the expected value of the next word

    var r = this.answerDisplay.getBoundingClientRect();
    var nextWord = this.exercise.words[this.typedWords.length];
    var thisTypedWord = this.typedWords[this.typedWords.length - 1];

    if (this.hint && this.hint.update) {
        if (
            thisTypedWord &&
            (thisTypedWord.correct == null || thisTypedWord.typed == "")
        ) {
            var nextWords = this.exercise.words
                .slice(
                    this.typedWords.length - 1,
                    Math.min(
                        this.typedWords.length + 10,
                        this.exercise.words.length
                    )
                )
                .join(" ");
            this.hint.update(nextWords, r.left, r.top);
        } else {
            var nextWords = this.exercise.words
                .slice(
                    this.typedWords.length,
                    Math.min(
                        this.typedWords.length + 10,
                        this.exercise.words.length
                    )
                )
                .join(" ");
            this.hint.update(nextWords, r.left, r.top);
        }
    }

    // if(ex !== this.showing_hint_on_word && this.hint_on_fail && match && this.hint){
    // 	this.showing_hint_on_word = "";
    // 	this.hint.hide();
    // }

    // this.display.parentNode.replaceChild(output, oldOutput);
    this.displayTypedWords(this.typedWords);

    this.updateWords(this.exercise.words);
};

TypeJig.prototype.keyDown = function (e) {
    var id;
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

        var link = document.getElementById(id);
        if (link) {
            link.click();
        }
    }
};

TypeJig.prototype.updateWords = function (words, hardReset) {
    var display = this.display;

    if (hardReset) {
        display = document.createElement("div");
        display.id = this.display.id;
        display.style.width = "200%";
    }

    for (let i = 0; i < words.length; ++i) {
        var word = words[i];

        var typedWentOver =
            this.typedWords[i] && this.typedWords[i].typed.length > word.length;
        if (hardReset) {
            if (this.exercise?.enterPoints?.includes(i)) {
                display.appendChild(document.createTextNode("\n"));
            }
        }

        //See if the state of the word has changed
        if (hardReset) {
        } else if (this.typedWords.length - i > 10) {
            if (this.exercise.numOfExpectedWords == i + 1) {
            } else {
                continue;
            }
        }

        var finalObject = document.createElement("span");

        //See if the typed word has any erroneous words and account for them
        var erroneousWords =
            this.typedWords[i] && this.typedWords[i].addedWords;
        if (erroneousWords) {
            finalObject.classList.add("complex-word-container");
            for (let j = 0; j < erroneousWords.length; j++) {
                var erroneousWord = erroneousWords[j];
                var div = document.createElement("span");
                div.style.opacity = 0;

                div.appendChild(document.createTextNode(erroneousWord + " "));

                finalObject.appendChild(div);
            }
        }

        if (typedWentOver) {
            finalObject.classList.add("complex-word-container");
            // div.style.float = "left"

            var typedSpan = document.createElement("span");
            typedSpan.style.position = "absolute";
            typedSpan.style.left = 0;
            var expectedSpan = document.createElement("span");
            expectedSpan.style.opacity = 0;

            typedSpan.appendChild(document.createTextNode(word));

            expectedSpan.appendChild(
                document.createTextNode(this.typedWords[i].typed + " ")
            );
            finalObject.appendChild(typedSpan);
            finalObject.appendChild(expectedSpan);
        } else {
            finalObject.style.display = "inline-block";

            finalObject.appendChild(document.createTextNode(word + " "));
        }

        if (this.exercise.numOfExpectedWords <= i) {
            finalObject.classList.add("notYet");
        }
        finalObject.id = "word" + i;
        var existingObject = display.querySelector("#word" + i);
        if (existingObject) {
            display.replaceChild(finalObject, existingObject);
        } else {
            display.appendChild(finalObject);
        }
    }
    if (hardReset) {
        this.display.parentNode.replaceChild(display, this.display);
    }
    function focusInput(evt) {
        self.input.focus();
        evt.preventDefault();
    }
    unbindEvent(this.display, "click", focusInput);
    this.display = display;
    bindEvent(this.display, "click", focusInput);
};

// TypeJig.prototype.getWords = function(n) {
// 	// Split the exercise text into words (keeping the whitespace).
// 	var exercise = TypeJig.wordsAndSpaces(this.display.textContent);

// 	if (this.display.textContent) this.expectedWords = this.display.textContent.split(/\s+/);
// 	else this.expectedWords = [];
//     if (this.exercise && typeof n === "number") {
//       // Add more text until we have enough (or there is no more).
//       n = n + this.lookahead;
//     }

// 	while(this.exercise && (!n || this.expectedWords.length < n)) {
// 		var text = this.exercise.getText();
// 		if(text) {
// 			var pieces = text.trim().split(/\s+/);
// 			if(this.alternateWith) {
// 				for(let i=0; i<this.alternateWith.length; ++i) {
// 					pieces.push(this.alternateWith[i]);
// 				}
// 			}

// 			for(let i=0; i<pieces.length; ++i) {
// 				this.expectedWords.push(pieces[i]);
// 			}

// 		} else delete(this.exercise);
// 	}
// 	this.updateWords(this.expectedWords)
// 	return exercise;
// };

TypeJig.prototype.currentSpeed = function (seconds, prev) {
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
};

TypeJig.prototype.endExercise = function (seconds) {
    if (this.running) this.running = false;
    else return;

    if (document.activeElement != document.body) document.activeElement.blur();
    unbindEvent(this.input, this.changeHandler);

    if (this.lastAnswered) {
        let elt = this.lastAnswered;
        while (elt.nextSibling) elt.parentNode.removeChild(elt.nextSibling);
    }
    let persistantData = [...this.persistentWordData];
    console.log("Before filtering", [...persistantData]);

    persistantData = persistantData.filter((a) => a.id != undefined);
    console.log("Before sort", [...persistantData]);

    persistantData.sort((a, b) => a.id - b.id);
    console.log("After", [...persistantData]);

    let prevTimestamp = 0;

    for (let index = 1; index < persistantData.length; index++) {
        const prevElement = persistantData[index - 1];
        const element = persistantData[index];
        const nextElement = persistantData[index + 1];

        if (!nextElement) continue;
        if (!prevElement) continue;
        if (element.correctTimeStamp) {
            element.duration =
                element.correctTimeStamp -
                (prevElement.correctTimeStamp ??
                    prevElement.lastKnownTimeStamp);
            continue;
        }
        if (element.lastKnownTimeStamp) {
            element.duration =
                element.lastKnownTimeStamp -
                (prevElement.correctTimeStamp ??
                    prevElement.lastKnownTimeStamp);

            continue;
        }

        element.duration = 0;
    }
    this.showResults(persistantData);
    this.saveDurationInLocalStorage(this.persistentWordData);
    this.saveErrorsInLocalStorage();
};

TypeJig.prototype.saveDurationInLocalStorage = function (words) {
    var durations = JSON.parse(localStorage.getItem("durations") ?? "{}");
    if (!durations) durations = {};

    words.forEach((element) => {
        let duration = element.duration;
        if (duration == null || isNaN(duration)) return;

        let expected = element.expected.replace(/[.,;"]/, "").toLowerCase();
        console.log("Expected, ", expected, element);
        let current = durations[expected] ?? null;
        let resulting = 0;
        if (current == null) {
            resulting = duration;
        } else {
            let diffrence = duration - current;
            resulting = current + diffrence / 10;
        }
        console.log("resulting", resulting);
        durations[expected] = Math.round(resulting * 1000) / 1000;
    });
    console.log(durations);
    localStorage.setItem("durations", JSON.stringify(durations));
};
TypeJig.prototype.saveErrorsInLocalStorage = function () {
    var errors = JSON.parse(localStorage.getItem("errors"));
    if (!errors) errors = [];

    //Get each occurance of an error in the TypedWords and save the word before and after
    for (let i = 0; i < this.typedWords.length; i++) {
        var typedWord = this.typedWords[i];
        var persistantData = this.persistentWordData?.[i];
        if (typedWord.correct == false) {
            var error = [
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
    localStorage.setItem("errors", JSON.stringify(errors));
};

TypeJig.prototype.showResults = function (persistantData) {
    typedWords = this.input.value.replaceAll(/^\s+/g, "").split(/\s+/);
    var seconds = this.clock.getTime(true);
    var gradingResults = this.gradeTypeVsResult(
        typedWords,
        this.exercise.words
    );
    var errorCount = gradingResults.errorCount;
    var totalWordCount = gradingResults.totalCount;

    var minutes = seconds / 60; // KEEP fractional part for WPM calculation!
    seconds = Math.floor((seconds % 60) * 10) / 10;
    var time = Math.floor(minutes) + ":" + seconds;

    // var wordsFromChars = this.input.value.length / 5;
    var words = totalWordCount;
    var WPM = words / minutes;
    // if (prev) WPM = (words - prev.words) / (minutes - prev.minutes);

    var correctWPM = gradingResults.correctCount / minutes;

    var accuracy = 1 - errorCount / gradingResults.totalCount;

    var results = "Time: " + time + " - " + Math.floor(WPM);
    // if (this.actualWords) {
    //     if (this.actualWords.unit) results += " " + this.actualWords.unit;
    //     else results += " " + this.actualWords;
    // } else {
    var plural = errorCount === 1 ? "" : "s";
    results += " WPM (chars per minute/5)";
    if (errorCount === 0) results += " with no uncorrected errors!";
    else
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
    // }

    results = "\n\n" + results;
    var start = this.resultsDisplay.textContent.length;
    var end = start + results.length;

    this.resultsDisplay.textContent += results;
    this.updateWords(this.exercise.words, true);
    this.renderChart(this.liveWPM.WPMHistory);

    this.resultsDisplay.scrollIntoView(true);
    this.displayTypedWords(this.typedWords, true);

    console.log(persistantData);

    var correctionsElement =
        document.getElementById("corrections")?.children[0];
    console.log(correctionsElement);

    document.getElementById("corrections").style.display = "table";
    //delete all but the first children
    while (correctionsElement?.children?.length > 1) {
        correctionsElement?.removeChild(correctionsElement?.children[1]);
    }

    //get thr first child of the corrections element

    var sortedPersistantWordData = [...persistantData].sort(function (a, b) {
        return (b.duration ?? 0) - (a.duration ?? 0);
    });

    //filter out all the bad values
    sortedPersistantWordData = sortedPersistantWordData.filter(function (
        wordData
    ) {
        if (isNaN(wordData.duration)) return false;
        if (wordData.expected == undefined) return false;
        return true;
    });
    sortedPersistantWordData.forEach((element) => {
        var newRow = document.createElement("tr");
        var newCell = document.createElement("td");
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
};

TypeJig.prototype.addCursor = function (output) {
    if (!output) output = this.answerDisplay;
    var cursor = output.querySelector(".cursor");
    if (cursor) return;
    var cursor = document.createElement("span");
    cursor.className = "cursor";
    output.appendChild(document.createTextNode("\u200b"));
    output.appendChild(cursor);
};

TypeJig.prototype.removeCursor = function (output) {
    if (!output) output = this.display.previousElementSibling;
    var cursors = output.getElementsByClassName("cursor");
    // Note that we go backwards since it is a live collection.  Elements
    // are removed immediately so we need to not screw up indices that we
    // still need.
    for (let i = cursors.length - 1; i >= 0; --i) {
        var c = cursors[i];
        c.parentNode.removeChild(c.previousSibling);
        c.parentNode.removeChild(c);
    }
};

// Gets called on focus and blur events, and also gets called with a
// div when we're building the new output.
TypeJig.prototype.updateCursor = function (evt) {
    var hasFocus, output;
    if (evt.type === "focus") hasFocus = true;
    else if (evt.type === "blur") hasFocus = false;
    else {
        output = evt;
        hasFocus = document.activeElement === this.input;
    }
    if (hasFocus) this.addCursor(output);
    else this.removeCursor(output);
};

// -----------------------------------------------------------------------
// Helper functions

isOwnPlural = { cod: true };

function pluralize(word) {
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
    var offset = 0;
    if (elt.offsetParent)
        do {
            offset += elt.offsetTop;
        } while ((elt = elt.offsetParent));
    return offset;
}

function hasClass(elt, className) {
    var re = new RegExp("(s|^)" + className + "(s|$)");
    return re.test(elt.className);
}

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
function shuffle(a) {
    for (var i = a.length - 1; i >= 1; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var a_i = a[i];
        a[i] = a[j];
        a[j] = a_i;
    }
    return a;
}

function randomIntLessThan(n) {
    return Math.floor(n * Math.random()) % n;
}

function shuffleTail(a, n) {
    n = Math.min(n, a.length);
    var i = n,
        b = a.length - n; // current and base indices
    while (--i > 0) {
        var other = randomIntLessThan(i + 1);
        var t = a[i + b];
        a[i + b] = a[other + b];
        a[other + b] = t;
    }
}

function randomize(a) {
    shuffleTail(a, a.length);
    a.randomEltsUsed = 0;
}

// Rotate the first word out to the end of the array.
// If the array has been `randomize`d (has a `randomEltsUsed` property
// defined), shuffle the used words when more than 2/3 of them have been used,
// which ensures that the last word can't be shuffled to be the next one in the
// queue.
function rotateAndShuffle(a) {
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

TypeJig.wordCombos = function (combos) {
    let index0, index1;

    function nextWord() {
        if (index0 == null) {
            shuffle(combos);
            for (let i = 0; i < combos.length; ++i) shuffle(combos[i]);
            (index0 = 0), (index1 = 0);
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
};

// -----------------------------------------------------------------------

TypeJig.LiveWPM = function (elt, typeJig, showLiveWPM) {
    this.elt = elt;
    elt.innerHTML = "";
    this.typeJig = typeJig;
    this.prevSpeed = null;
    this.showLiveWPM = showLiveWPM;
};

TypeJig.LiveWPM.prototype.update = function (seconds) {
    const aw = this.typeJig.actualWords;
    const unit = aw && aw.u ? aw.u : "WPM";
    const stats = this.typeJig.currentSpeed(seconds, this.prevSpeed);
    this.prevSpeed = stats;
    // Show the average of the last (up to) 5 samples

    //Get the average distance between the last 5 samples
    let persistantData = this.typeJig.persistentWordData;

    if (persistantData.length >= 11) {
        if (!persistantData[persistantData.length - 1]) {
            this.elt.innerHTML = "~ First Unknown";
            return;
        }
        if (!persistantData[persistantData.length - 11]) {
            this.elt.innerHTML = "~ Second Unknown";
            return;
        }
        distance =
            persistantData[persistantData.length - 1].lastKnownTimeStamp -
            persistantData[persistantData.length - 11].lastKnownTimeStamp;

        if (this.showLiveWPM)
            this.elt.innerHTML =
                "~" + Math.floor((10 / distance) * 60) + " " + unit;
    } else {
        distance = persistantData[persistantData.length - 1].lastKnownTimeStamp;

        if (this.showLiveWPM)
            this.elt.innerHTML =
                "~" +
                Math.floor((persistantData.length / distance) * 60) +
                " " +
                unit;
    }
};

TypeJig.LiveWPM.prototype.reset = function () {
    this.WPMHistory = [];
};

function movingAvg(array, countBefore, countAfter) {
    if (countAfter == undefined) countAfter = 0;
    const result = [];
    for (let i = 0; i < array.length; ++i) {
        const subArr = array.slice(
            Math.max(i - countBefore, 0),
            Math.min(i + countAfter + 1, array.length)
        );
        const avg =
            subArr.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / subArr.length;
        result.push(avg);
    }
    return result;
}

TypeJig.prototype.renderChart = function () {
    if (this.wpmChart) {
        this.wpmChart.destroy();
        delete this.wpmChart;
    }

    averageDatasetData = [
        {
            x: 0,
            y: 0,
        },
    ];

    //zip the persistant word data and the typedWord data
    var combinedData = [];
    for (var i = 0; i < this.typedWords.length; i++) {
        combinedData.push({
            ...this.typedWords[i],
            ...this.persistentWordData[i],
        });
    }

    combinedData.sort((a, b) => a.lastKnownTimeStamp - b.lastKnownTimeStamp);

    for (let i = 0; i < combinedData.length; i++) {
        var pastValue = combinedData[i].lastKnownTimeStamp ?? 0;

        var currentValues = 0;

        for (let j = i; j > 0; j--) {
            if (currentValues >= 10) break;
            if (combinedData[j].correct == false) {
                continue;
            }
            currentValues++;
            pastValue = combinedData[j];
        }

        distance = combinedData[i].lastKnownTimeStamp - pastValue;
        averageDatasetData.push({
            x: combinedData[i].lastKnownTimeStamp,
            y: (currentValues / distance) * 60,
            ...combinedData[i],
        });
    }

    totalDataDataset = [
        {
            x: 0,
            y: 0,
        },
    ];

    for (let i = 0; i < combinedData.length; i++) {
        if (i < 10) {
            totalDataDataset.push({
                x: combinedData[i].lastKnownTimeStamp,
                y:
                    (i / combinedData[i].lastKnownTimeStamp) *
                    60 *
                    (i / (i + 1)),
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

    //Sort both the totalDataDataset and the averageDatasetData by x
    totalDataDataset.sort(function (a, b) {
        return a.x - b.x;
    });
    averageDatasetData.sort(function (a, b) {
        return a.x - b.x;
    });

    //Apply a rolling average of 5 to the data

    const aw = this.actualW10ords;
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
                    var index = context.dataIndex;
                    var value = context.dataset.data[index];
                    return value.correct == false
                        ? "red" // draw negative values in red
                        : value.correct && value.failed
                        ? "yellow" // else, alternate values in blue and green
                        : "green";
                },
                tension: 0.2,
                showLine: true,
            },
            {
                label: "Total WPM",
                data: totalDataDataset,
                pointBackgroundColor: function (context) {
                    var index = context.dataIndex;
                    var value = context.dataset.data[index];
                    return value.correct == false
                        ? "red" // draw negative values in red
                        : value.correct && value.failed
                        ? "yellow" // else, alternate values in blue and green
                        : "green";
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
                            return [
                                all.datasets[tooltipItem[0].datasetIndex].data[
                                    tooltipItem[0].index
                                ].expected,
                            ];
                        },
                        label: function (context) {
                            return [
                                "WPM :" + context.raw.y.toFixed(),
                                context.raw.x.toFixed(2) + "s",
                            ];
                        },
                    },
                },
            },
        },
    };
    document.getElementById("chartDiv").style.display = "block";
    this.wpmChart = new Chart(
        document.getElementById("chartDiv").getContext("2d"),
        config
    );
};

// -----------------------------------------------------------------------
/**
 *
 * @param {*} elt The element to display the text in
 * @param {number|null} countdownMs The number of seconds if any that represents the "end" of the timer
 * @param {*} onUpdate A function to call when the timer 'ticks'
 */

TypeJig.Timer = function (elt, countdownMs, onUpdate) {
    this.elt = elt;
    elt.innerHTML = "";

    this.alarm = countdownMs > 0;
    this.timerLength = countdownMs ?? 0;

    this.updateThis = this.update.bind(this);
    this.showTime();
    this.onUpdate = onUpdate || function () {};
    this.running = false;
    console.log("Timer", this);
};

/**
 *
 * @returns {number} Returns the number of seconds (fractional!) since the timer has started. 0 if not started
 */
TypeJig.Timer.prototype.getTime = function (round) {
    if (!this.startTime) return 0;
    if (round) {
        return Math.floor((new Date().getTime() - this.startTime) / 1000);
    } else {
        return (new Date().getTime() - this.startTime) / 1000;
    }
};

TypeJig.Timer.prototype.reset = function () {
    delete this.startTime;
    delete this.endTime;
    this.seconds = 0;
    this.showTime();
};

TypeJig.Timer.prototype.start = function (alarm) {
    this.onFinished = alarm;
    this.startTime = new Date().getTime();
    if (this.alarm) this.endTime = this.startTime + this.timerLength;

    window.setTimeout(this.updateThis, 1000);
};

TypeJig.Timer.prototype.stop = function () {
    var elapsed = (new Date().getTime() - this.startTime) / 1000;
    if (this.onFinished) this.onFinished(elapsed);
    delete this.startTime;
    delete this.endTime;
};

TypeJig.Timer.prototype.update = function () {
    if (this.startTime) {
        var running = true;
        var now = new Date().getTime();
        var msElapsed = Math.max(0, now - this.startTime);
        var msTilNext = 1000 - (msElapsed % 1000);

        if (this.endTime) running = now < this.endTime;

        this.showTime();

        this.onUpdate(msElapsed);

        if (running) window.setTimeout(this.updateThis, msTilNext);
        else this.stop();
    }
};

TypeJig.Timer.prototype.showTime = function () {
    if (!this.elt) return;
    var elapsed = this.getTime(true);

    if (this.alarm) {
        elapsed = Math.floor(this.timerLength / 1000 - elapsed);
    }

    var m = Math.floor(elapsed / 60);
    var s = elapsed % 60;
    if (s < 10) s = "0" + s;
    this.elt.innerHTML = m + ":" + s;
};

TypeJig.Timer.prototype.hide = function () {
    this.elt.style.display = "none";
};

// -----------------------------------------------------------------------

/**
 *
 * @param {string[] | string[][]} words The words to type
 * @param {number} seconds The number of seconds to type all the words
 * @param {boolean} shuffle Whether to shuffle the words
 * @param {*} select
 * @param {*} speed
 */
TypeJig.Exercise = function (words, seconds, shuffle, select, speed) {
    this.name = "Unnamed Exercise";
    this.enterPoints = [];

    var processedWords = [];
    words = words.flat(2);
    for (var i = 0; i < words.length; i++) {
        if (words[i] == "\n") {
            processedWords.push("\n" + (words[i + 1] ?? ""));
            i++;
        } else {
            processedWords.push(words[i]);
        }
    }

    this.started = false;
    /**
     * @type {string[]}
     */
    this.words = processedWords;
    console.log(this.words);
    //Remove all the \n characters from words
    this.words = this.words.map((w) => w?.replace(/\n/g, ""));
    this.words = this.words.filter((w) => w != "");
    /**
     * @type {string[]}
     */
    this.rawWords = [...processedWords];
    this.seconds = seconds;
    this.shuffle = shuffle;
    this.select =
        TypeJig.Exercise.select[select] || TypeJig.Exercise.select.random;
    this.numOfExpectedWords = -1;

    if (shuffle) randomize(this.words);
};

function indexInto(a) {
    if (typeof a.i === "undefined") a.i = 0;
    var word = a[a.i];
    if (++a.i === a.length) delete a.i;
    return word;
}

TypeJig.Exercise.select = {
    random: function (a) {
        return a[randomIntLessThan(a.length)];
    },
    first: function (a) {
        return a[0];
    },
    ordered: indexInto,
    shuffled: function (a) {
        if (typeof a.i === "undefined") randomize(a);
        return indexInto(a);
    },
};

TypeJig.Exercise.prototype.getText = function () {
    var word = rotateAndShuffle(this.words);
    if (word instanceof Array) word = this.select(word);
    return word;
};

TypeJig.Exercise.prototype.calculateBreakPoints = function (display) {
    this.enterPoints = [];

    var words = this.rawWords;
    while (display.firstChild) {
        display.removeChild(display.firstChild);
    }

    var y = 0;
    for (let i = 0; i < words.length; ++i) {
        var word = words[i];
        var span = document.createElement("span");
        span.appendChild(document.createTextNode(word + " "));
        display.appendChild(span);

        var r = display.getBoundingClientRect();
        if (r.bottom > y + 0.001 || word.includes("\n")) {
            if (i != 0) this.enterPoints.push(i);
            y = r.bottom;
        }
        // output.appendChild(document.createTextNode("\n"));
        // if (endOfAnswer) {
        // 	var limit = 0.66 * window.innerHeight;
        // 	var end = this.display.getBoundingClientRect().bottom;
        // 	var r = range.getBoundingClientRect();
        // 	if (end > window.innerHeight && r.bottom > limit)
        // 		window.scrollBy(0, r.bottom - limit);
        // }
    }
    return display;
};
