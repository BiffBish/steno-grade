setTheme();

        function makeDisplay(element, word) {
            // if (floating_hints) {
            //     strokes.style.position = "fixed";
            // }
            var translations = TypeJig.shortestTranslations(PloverTranslations);
            console.log("Making stenoDisplay");

            var display = new StenoDisplay(element, translations, true);
            display.update(word, 0, 0);
        }
        function makeImprovementPair(mistake) {
            let typed = mistake.typed;
            let expected = mistake.expected;
            let count = mistake.count;
            let beforeWords = mistake.beforeWords;

            var list = $("#most-messed-up-words");

            console.log(list);
            let typedWord = document.createElement("div");
            typedWord.classList.add("strokes");
            typedWord.innerHTML = typed;
            makeDisplay(typedWord, typed);

            let expectedWord = document.createElement("div");
            expectedWord.classList.add("strokes");
            expectedWord.innerHTML = expected;
            makeDisplay(expectedWord, expected);

            //Have the typed word and expected word be side by side in its own div
            let wordPair = document.createElement("div");
            wordPair.classList.add("word-pair");

            let description = document.createElement("div");

            {
                let overallUpdate = document.createElement("h2");
                overallUpdate.innerHTML = typed + " -> " + expected;
                description.append(overallUpdate);
            }

            let descriptionList = document.createElement("ul");
            descriptionList.style.width = "200px";

            //count the number of occuranted of each key in beforeWords

            let beforeWordsCount = {};
            for (let i = 0; i < beforeWords.length; i++) {
                let word = beforeWords[i];
                if (beforeWordsCount[word] == undefined) {
                    beforeWordsCount[word] = 1;
                } else {
                    beforeWordsCount[word]++;
                }
            }

            //for key and value in beforeWordsCount
            for (let key in beforeWordsCount) {
                let value = beforeWordsCount[key];
                let updateItem = document.createElement("li");
                updateItem.innerHTML = "";
                if (value > 1) updateItem.innerHTML = " (" + value + "x) ";
                updateItem.innerHTML +=
                    key + " " + typed + " -> " + key + " " + expected;
                descriptionList.append(updateItem);
            }
            // beforeWords.forEach((beforeWord) => {
            //     let updateItem = document.createElement("li");
            //     updateItem.innerHTML =
            //         beforeWord +
            //         " " +
            //         typed +
            //         " -> " +
            //         beforeWord +
            //         " " +
            //         expected;
            //     descriptionList.append(updateItem);
            // });

            description.append(descriptionList);

            wordPair.appendChild(description);
            wordPair.appendChild(typedWord);
            wordPair.appendChild(expectedWord);

            list.append(wordPair);
        }

        //Loop through all the values in "errors" in localstorage

        let errors = JSON.parse(localStorage.getItem("errors"));

        let countedErrors = {};
        for (let i = 0; i < errors.length; i++) {
            let typed = errors[i][1];
            let expected = errors[i][2];
            if (countedErrors[typed + "_=_" + expected] === undefined) {
                countedErrors[typed + "_=_" + expected] = {
                    count: 0,
                    typed: typed,
                    expected: expected,
                    beforeWords: [],
                };
            }
            countedErrors[typed + "_=_" + expected].count++;
            countedErrors[typed + "_=_" + expected].beforeWords.push(
                errors[i][0]
            );
        }

        //sort countedErrors by their count
        let sortedCountedErrors = Object.values(countedErrors).sort(
            (a, b) => b.count - a.count
        );

        //filter it by the top 20
        let top20 = sortedCountedErrors.slice(0, 20);
        top20.forEach((mistake) => {
            makeImprovementPair(mistake);
        });

        let durations = TypeJig.getAggregateStats().durations;

        let listedDurations = Object.entries(durations);

        let sortedDurations = listedDurations.sort((a, b) => {
            return b[1] - a[1];
        });
        var list = $("#most-durations-words");

        sortedDurations.forEach((duration) => {
            let descriptionList = document.createElement("ul");
            descriptionList.style.width = "200px";

            let description = document.createElement("div");

            let overallUpdate = document.createElement("h2");
            overallUpdate.innerHTML = duration[0];
            description.append(overallUpdate);

            let updateItem = document.createElement("li");
            updateItem.innerHTML = "Duration: " + duration[1] * 1000 + "ms";
            descriptionList.append(updateItem);
            description.append(descriptionList);

            let wordPair = document.createElement("div");
            wordPair.classList.add("word-pair");
            wordPair.appendChild(description);

            list.append(wordPair);
        });

        //get the ul with the ID of "most-messed-up-words"
        //Using JQuery