function populatePage(options) {
    // <div id="leftside">
    // 	<h3 id="lesson-name" class="center"></h3>
    // 	<div id="drill-content">
    // 		<div id="answer"></div>
    // 		<div id="exercise"></div>
    // 		<div id="results"></div>
    // 		<div style="height: 300px">
    // 			<canvas id="chartDiv" width="400" height="400"></canvas>
    // 		</div>
    // 	</div>
    // </div>

    // <div id="nav">
    // 	<p id="stroke-hint"></p>
    // 	<p id="strokes"></p>
    // 	<p id="clock" class="clock"></p>
    // 	<p id="live-wpm-display" class="wpm"></p>
    // 	<p class="center"><a id="back" title="LeftArrow">&larr; Back to Menu <span class="shortcutkey">(LeftArrow)</span></a></p>
    // 	<p class="center"><a id="again" title="Enter">&#8634; Repeat Drill <span class="shortcutkey">(Enter 3x)</span></a></p>
    // 	<p class="center"><a id="end" title="Enter">&Cross; End Drill <span class="shortcutkey">(Tab 3x)</span></a></p>
    // 	<p class="center"><a id="new" title="RightArrow">&rarr; New Drill <span class="shortcutkey">(RightArrow)</span></a></p>
    // </div>
    //Populate the lession div with the html above
    var lesson = document.getElementById("lesson");
    lesson.innerHTML = `
    <div id="leftside">
		<h3 id="lesson-name" class="center"></h3>
		<div id="drill-content">
			<div id="answer"></div>
			<div id="exercise"></div>
			<div id="results"></div>
			<div style="height: 300px">
				<canvas id="chartDiv" width="400" height="400"></canvas>
			</div>
            <table id="corrections" style="display:none">
                <tr>
                    <th>Expected</th>
                    <th>Hesitation</th>
                    <th>Attempts</th>
                </tr>
            </table>
		</div>
	</div>

	<div id="nav">
		<p id="stroke-hint"></p>
		<p class="strokes"></p>
		<p id="clock" class="clock"></p>
		<p id="live-wpm-display" class="wpm"></p>
		<p class="center"><a id="back" title="LeftArrow">&larr; Back to Menu <span class="shortcutkey">(LeftArrow)</span></a></p>
		<p class="center"><a id="again" title="Enter">&#8634; Repeat Drill <span class="shortcutkey">(Enter 3x)</span></a></p>
		<p class="center"><a id="end" title="Enter">&Cross; End Drill <span class="shortcutkey">(Tab 3x)</span></a></p>
		<p class="center"><a id="new" title="RightArrow">&rarr; New Drill <span class="shortcutkey">(RightArrow)</span></a></p>
        <p class="center"><a id="show-hint" title="UpArrow">Show Hint <span class="shortcutkey">(UpArrow)</span></a></p>
		<p class="center"><a id="hide-hint" title="UpArrow">Hide Hint <span class="shortcutkey">(DownArrow)</span></a></p>
	</div>
    <textarea id="input"></textarea>
    `;

    //Get the leftside element and add this html below lesson-name
    // <p style="text-align: center; padding-bottom: 3em">
    //     <a href="raw-steno-instructions.html">How to get raw steno output</a>
    // </p>;
    //Select the lesson-name element inside of the leftside element using jquery

    if (options?.require_raw_steno) {
        $(".lesson-name").after(`
            <p style="text-align: center; padding-bottom: 3em">
                <a href="raw-steno-instructions.html">How to get raw steno output</a>
            </p>;
        `);
    }
}

function parseQueryString(query) {
    var vars = {};
    query = query.substring(1); // remove leading '?'
    var pairs = query.replace(/\+/g, "%20").split("&");
    for (var i = 0; i < pairs.length; ++i) {
        var name,
            value = "";
        var n = pairs[i].indexOf("=");
        if (n === -1) name = decodeURIComponent(pairs[i]);
        else {
            name = decodeURIComponent(pairs[i].substring(0, n));
            value = decodeURIComponent(pairs[i].substring(n + 1));
        }
        if (vars.hasOwnProperty(name)) {
            if (!Array.isArray(vars[name])) vars[name] = [vars[name]];
            vars[name].push(value);
        } else vars[name] = value;
    }
    return vars;
}

function getFormFields(form) {
    var fields = {};
    for (var i = 0; i < form.elements.length; ++i) {
        var input = form.elements[i];
        if (input.type === "checkbox" && !input.checked) continue;
        fields[input.name] = input.value;
    }
    return fields;
}

function new_rng(seed_txt) {
    var s, i, j, tmp;
    s = new Array(256);
    for (i = 0; i < 256; ++i) {
        s[i] = i;
    }
    if (seed_txt == null) {
        seed_txt = Math.random().toString();
    }
    for (i = j = 0; i < 256; ++i) {
        j += s[i] + seed_txt.charCodeAt(i % seed_txt.length);
        j %= 256;
        tmp = s[i];
        s[i] = s[j];
        s[j] = tmp;
    }
    return function () {
        var p,
            ret = 0;
        for (p = 0; p < 7; ++p) {
            ret *= 256;
            i = (i + 1) % 256;
            j = (j + s[i]) % 256;
            tmp = s[i];
            s[i] = s[j];
            s[j] = tmp;
            ret += s[(s[i] + s[j]) % 256];
        }
        return ret / 72057594037927935.0;
    };
}

function initializeHints(hints, floating_hints) {
    var strokes = document.getElementsByClassName("strokes")[0];
    if (floating_hints) {
        strokes.style.position = "fixed";
    }
    var translations = TypeJig.shortestTranslations(PloverTranslations);
    console.log("Making stenoDisplay");

    return new StenoDisplay(strokes, translations, true);
}

function changeName(name) {
    var h = document.getElementById("lesson-name");
    if (h.lastChild) h.removeChild(h.lastChild);
    h.appendChild(document.createTextNode(name));
    document.title = name + " - " + document.title.replace(/^.*? - /, "");
}

function setExercise(name, exercise, hints = null, options, jig) {
    var h = document.getElementById("lesson-name");
    h.textContent = name;
    document.title = name + " - Steno Grade";

    var back = document.getElementById("back");
    back.href =
        document.location.href.replace(/\?.*$/, "").replace(/\/[^\/]*$/, "") +
        "/" +
        (options.menu || "form") +
        ".html";
    var again = document.getElementById("again");
    again.href = document.location.href;

    var end = document.getElementById("end");
    end.href = document.location.href;

    //Add the settings from local storage to the options
    var settings = localStorage.getItem("settings") ?? "{}";
    if (settings) {
        options = {
            ...options,
            ...(JSON.parse(settings) ?? {}),
        };
    }
    console.log("Setting exersize", exercise, hints, options);

    if (jig != null) jig.exercise = exercise;
    else jig = new TypeJig(exercise, options, hints);
    return jig;
}

function prepareNextSeed(another) {
    let anotherSeed = Math.random().toString();
    another.href = document.location.href
        .toString()
        .replace(/seed=([^&#]*)/, "seed=" + anotherSeed);
    return anotherSeed;
}

function storageAvailable(type) {
    var storage;
    try {
        storage = window[type];
        var x = "__storage_test__";
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return (
            e instanceof DOMException &&
            // everything except Firefox
            (e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === "QuotaExceededError" ||
                // Firefox
                e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage &&
            storage.length !== 0
        );
    }
}

function setTheme() {
    console.log("Setting theme");
    if (storageAvailable("localStorage")) {
        //get both settings and custom settings. merging them
        var settings = localStorage.getItem("settings") ?? "{}";
        var customSettings = localStorage.getItem("custom_settings") ?? "{}";
        var mS = {
            ...(JSON.parse(settings) ?? {}),
            ...(JSON.parse(customSettings) ?? {}),
        };

        if (localStorage.theme == null) {
            document.body.removeAttribute("data-theme");
        } else {
            document.body.setAttribute("data-theme", localStorage.theme);
        }
        console.log("Setting theme", mS);
        //Get the settings from local storage
        if (mS) {
            //Add a varable to the root element to set boredr thickness
            var root = document.documentElement;
            var body = document.body;
            setCustomThemeSetting("main-bg", mS.theme_background_color, true);
            setCustomThemeSetting(
                "form-border-thickness",
                mS.theme_form_border_thickness ?? "1px"
            );
        }
    }
}
function setCustomThemeSetting(setting, value, dontApplyIfFalse = false) {
    if (dontApplyIfFalse && !value) return;
    var body = document.body;
    body.style.setProperty("--" + setting, value);
}

function loadLocalSetting(name) {
    if (storageAvailable("localStorage")) {
        return JSON.parse(localStorage.settings ?? "{}")[name] ?? null;
    }
    return null;
}

function setLocalSetting(name, value) {
    if (storageAvailable("localStorage")) {
        console.log("Setting local setting", name, value);
        console.log(localStorage.settings);
        var settings = JSON.parse(localStorage.settings ?? "{}");
        settings[name] = value;
        localStorage.settings = JSON.stringify(settings);
    }
}
/**
 *
 * @param {string} settingName
 * @param {any} defaultValue
 * @returns
 */
function loadSetting(settingName, defaultValue = null) {
    localStorage.settings ??= "{}";
    const element = document.getElementById(settingName);
    console.log("Loading setting", settingName, element);
    var value = loadLocalSetting(settingName);
    if (value == null) setLocalSetting(settingName, defaultValue);
    value ??= defaultValue;

    if (!element) return;
    if (!(element.nodeName === "INPUT")) return;

    switch (element.type) {
        case "checkbox":
            if (value != null) {
                element.checked = value;
            }
            element.addEventListener("input", function (evt) {
                setLocalSetting(settingName, !!evt.target.checked);
            });
            break;
        case "number":
            if (value != null) {
                element.value = value;
            }
            element.addEventListener("input", function (evt) {
                setLocalSetting(settingName, evt.target.value);
            });
            break;

        case "radio":
            const hints = document.getElementsByName(settingName);
            console.log(hints);
            for (const hint of hints) {
                console.log(hint, hint.value);
                hint.addEventListener("click", function (evt) {
                    console.log(evt);
                    setLocalSetting(settingName, evt.target.value);
                });
                if (hint.value === value) hint.checked = true;
            }
            break;
        case "text":
            if (value != null) element.value = value;
            element.addEventListener("input", function (evt) {
                setLocalSetting(settingName, evt.target.value);
            });
            break;
    }
}

function loadSettings() {
    if (!storageAvailable("localStorage")) return;

    // Theme
    if (localStorage.theme == null) {
        document.body.removeAttribute("data-theme");
    } else {
        document.body.setAttribute("data-theme", localStorage.theme);
    }
    loadSetting("hints", "fail-1");
    loadSetting("live_wpm", true);
    loadSetting("show_timer", true);
    loadSetting("show_corrections", false);
    loadSetting("show_live_grading", true);
    loadSetting("grade_rules_addedWordMaxJump", 5);
    loadSetting("grade_rules_droppedWordMaxJump", 5);
    loadSetting("cpm");
    loadSetting("wpm");
    loadSetting("alternate");
    loadSetting("multi_word_hints", false);
}

function initializeButtons(jig) {
    let again = document.getElementById("again");
    again.addEventListener("click", function (evt) {
        evt.preventDefault();
        jig.reset();
    });

    let end = document.getElementById("end");
    end.addEventListener("click", function (evt) {
        evt.preventDefault();
        jig.endExercise();
    });

    let showHint = document.getElementById("show-hint");
    showHint?.addEventListener("click", function (evt) {
        evt.preventDefault();
        jig.hint.show();
    });

    let hideHint = document.getElementById("hide-hint");
    hideHint?.addEventListener("click", function (evt) {
        evt.preventDefault();
        jig.hint.hide();
    });
}
/**
 * Update a URL parameter and return the new URL.
 * Note that if handling anchors is needed in the future,
 * this function will need to be extended. See the link below.
 *
 * http://stackoverflow.com/a/10997390/11236
 */
function updateURLParameter(url, param, paramVal) {
    var newAdditionalURL = "";
    var tempArray = url.split("?");
    var baseURL = tempArray[0];
    var additionalURL = tempArray[1];
    var temp = "";
    if (additionalURL) {
        tempArray = additionalURL.split("&");
        for (var i = 0; i < tempArray.length; i++) {
            if (tempArray[i].split("=")[0] != param) {
                newAdditionalURL += temp + tempArray[i];
                temp = "&";
            }
        }
    }

    var rows_txt = temp + "" + param + "=" + paramVal;
    return (
        baseURL + "?" + newAdditionalURL + (paramVal == null ? "" : rows_txt)
    );
}

function displayOnly(show) {
    const tabs = ["form", "lesson"];
    for (const tab of tabs) {
        const displayType = tab === "lesson" ? "flex" : "block";
        document.getElementById(tab).style.display =
            tab === show ? displayType : "none";
    }
}

// ---------------------------------------------------------------------
// Add attributes, properties, and children to a DOM node
// (possibly creating it first).
// args:
//     target: an Element or a tag name (e.g. "div")
//     then optional in any order (type determines function)
//         Element: child
//         string: text node child
//         array: values are treated as args
//         null/undefined: ignored
//         object: set attributes and properties of `target`.
//             string: set attribute
//             array: set property to array[0]
//             object: set property properties. example: N('span', {style: {color: 'red'}})
//             function: add event listener.

function N(target, ...args) {
    const el =
        typeof target === "string" ? document.createElement(target) : target;
    for (const arg of args) {
        if (arg instanceof Element || arg instanceof Text) {
            el.appendChild(arg);
        } else if (Array.isArray(arg)) {
            N(el, ...arg);
        } else if (typeof arg === "string") {
            el.appendChild(document.createTextNode(arg));
        } else if (arg instanceof Object) {
            for (const k in arg) {
                const v = arg[k];
                if (Array.isArray(v)) {
                    el[k] = v[0];
                } else if (v instanceof Function) {
                    el.addEventListener(k, v);
                } else if (v instanceof Object) {
                    for (const vk in v) el[k][vk] = v[vk];
                } else {
                    el.setAttribute(k, v);
                }
            }
        }
    }
    return el;
}

function hiddenField(form, name, value) {
    if (value === "") return;
    if (typeof value === "object") {
        value = btoa(JSON.stringify(value));
    }
    if (form.elements[name]) form.elements[name].value = value;
    else N(form, N("input", { type: "hidden", name: name, value: value }));
}
