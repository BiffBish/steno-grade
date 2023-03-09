/* eslint-disable guard-for-in */
/// <reference path="../libs/jquery-3.6.0.min.js" />

// @ts-ignore
// import {StenoDisplay} from "./steno-display.mjs";


export function populatePage(options) {
    const leftSide = N("div", {id: "leftside"}, [
        N("h3", {id: "lesson-name", class: "center"}),
        N("div", {id: "drill-content"}, [
            N("div", {id: "answer"}),
            N("div", {id: "exercise"}),
            N("div", {id: "results"}),
            N("div", {style: "height: 300px"}, [
                N("canvas", {id: "chartDiv", width: "400", height: "400"}),
            ]),
            N("table", {id: "corrections", style: "display:none"}, [
                N("tr", {}, [
                    N("th", {}, "Expected"),
                    N("th", {}, "Hesitation"),
                    N("th", {}, "Attempts"),
                ]),
            ]),
        ]),
    ]);

    const rightButtons = [
        {
            id: "back",
            title: "LeftArrow",
            text: "&larr; Back to Menu ",
            shortcut: "(LeftArrow)",
        },
        {
            id: "again",
            title: "Enter",
            text: "&#8634; Repeat Drill ",
            shortcut: "(Enter 3x)",
        },
        {
            id: "end",
            title: "Enter",
            text: "&Cross; End Drill ",
            shortcut: "(Tab 3x)",
        },
        {
            id: "new",
            title: "RightArrow",
            text: "&rarr; New Drill ",

            shortcut: "(RightArrow)",
        },
        {
            id: "show-hint",
            title: "UpArrow",
            text: "Show Hint ",
            shortcut: "(UpArrow)",
        },
        {
            id: "hide-hint",
            title: "Down Arrow",
            text: "Hide Hint ",
            shortcut: "(DownArrow)",
        },
    ];

    const themeSelect = N(
        "select",
        {
            id: "themeable",
            onchange: (e) => {
                console.log(e.target.value);
                // let theme = e.target.value;
                // localStorage.setItem("theme", theme);
                // setTheme();
            },
        },
        [
            N("optgroup", {label: "Light Themes"}, [
                N("option", {value: "light"}, "Light"),
                N("option", {value: "oasis"}, "Oasis"),
                N("option", {value: "ocean"}, "Ocean"),
                N("option", {value: "rustic"}, "Rustic"),
            ]),
            N("optgroup", {label: "Dark Themes"}, [
                N("option", {value: "dark"}, "Dark"),
                N("option", {value: "breeze"}, "Breeze"),
                N("option", {value: "retro-pop"}, "Retro Pop"),
                N("option", {value: "autumn"}, "Autumn"),
                N("option", {value: "odyssey"}, "Odyssey"),
            ]),
        ],
    );

    themeSelect.value = localStorage.getItem("theme") || "light";

    themeSelect.onchange = (e) => {
        const theme = e.target.value;
        localStorage.setItem("theme", theme);
        setTheme();
    };

    const nav = N("div", {id: "nav"}, [
        N("p", {id: "stroke-hint"}),
        N("p", {class: "strokes"}),
        N("p", {id: "clock", class: "clock"}),
        N("p", {id: "live-wpm-display", class: "wpm"}),
        ...rightButtons.map((button) => {
            return N("p", {class: "center"}, [
                N("a", {id: button.id, title: button.title}, button.text),
                N("span", {class: "shortcut-key"}, button.shortcut),
            ]);
        }),
        // Lets add a dropdown for all 8 of the themes, light, dark, etc.
        N("p", {class: "center"}, "Choose your theme:", [themeSelect]),
    ]);

    const textarea = N("textarea", {id: "input"});

    const lesson = $("#lesson").get(0);

    console.log(lesson);

    N(lesson, [leftSide, nav, textarea]);

    // document.body.appendChild(lesson);

    // Get the leftside element and add this html below lesson-name
    // <p style="text-align: center; padding-bottom: 3em">
    //     <a href="raw-steno-instructions.html">How to get raw steno output</a>
    // </p>;
    // Select the lesson-name element inside of the leftside element using jquery

    if (options?.require_raw_steno) {
        $(".lesson-name").after(`
            <p style="text-align: center; padding-bottom: 3em">
                <a href="raw-steno-instructions.html">How to get raw steno output</a>
            </p>;
        `);
    }
    console.log("Populated page");
}

export function parseQueryString(query) {
    const vars = {};
    query = query.substring(1); // remove leading '?'
    const pairs = query.replace(/\+/g, "%20").split("&");
    for (const element of pairs) {
        let name;
        let value = "";
        const n = element.indexOf("=");
        if (n === -1) name = decodeURIComponent(element);
        else {
            name = decodeURIComponent(element.substring(0, n));
            value = decodeURIComponent(element.substring(n + 1));
        }
        if (vars.hasOwnProperty(name)) {
            if (!Array.isArray(vars[name])) vars[name] = [vars[name]];
            vars[name].push(value);
        } else vars[name] = value;
    }
    return vars;
}

export function getFormFields(form) {
    const fields = {};
    for (const element of form.elements) {
        const input = element;
        if (input.type === "checkbox" && !input.checked) continue;
        fields[input.name] = input.value;
    }
    return fields;
}

export function newRNG(seedTxt) {
    let i; let j; let tmp;
    const s = new Array(256);
    for (i = 0; i < 256; ++i) {
        s[i] = i;
    }
    if (seedTxt == null) {
        seedTxt = Math.random().toString();
    }
    for (i = j = 0; i < 256; ++i) {
        j += s[i] + seedTxt.charCodeAt(i % seedTxt.length);
        j %= 256;
        tmp = s[i];
        s[i] = s[j];
        s[j] = tmp;
    }
    return function() {
        let p;
        let ret = 0;
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


export function changeName(name) {
    const h = document.getElementById("lesson-name");
    if (h.lastChild) h.removeChild(h.lastChild);
    h.appendChild(document.createTextNode(name));
    document.title = name + " - " + document.title.replace(/^.*? - /, "");
}


export function prepareNextSeed(another) {
    const anotherSeed = Math.random().toString();
    another.href = document.location.href
        .toString()
        .replace(/seed=([^&#]*)/, "seed=" + anotherSeed);
    return anotherSeed;
}

export function storageAvailable(type) {
    let storage;
    try {
        storage = window[type];
        const x = "__storage_test__";
        // @ts-ignore
        storage.setItem(x, x);
        // @ts-ignore
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

export function setTheme() {
    console.log("Setting theme");
    if (storageAvailable("localStorage")) {
        // get both settings and custom settings. merging them
        const settings = localStorage.getItem("settings") ?? "{}";
        const customSettings = localStorage.getItem("custom_settings") ?? "{}";
        const mergedSettings = {
            ...(JSON.parse(settings) ?? {}),
            ...(JSON.parse(customSettings) ?? {}),
        };
        localStorage.theme ??= "dark";

        if (localStorage.theme == null) {
            document.documentElement.removeAttribute("data-theme");
        } else {
            document.documentElement.setAttribute(
                "data-theme",
                localStorage.theme,
            );
        }
        console.log("Setting theme", mergedSettings);
        // Get the settings from local storage
        if (mergedSettings) {
            setCustomThemeSetting(
                "main-bg",
                mergedSettings.theme_background_color,
                true,
            );
            setCustomThemeSetting(
                "form-border-thickness",
                mergedSettings.theme_form_border_thickness ?? "1px",
            );
        }
    }
}

export function setCustomThemeSetting(setting, value, dontApplyIfFalse = false) {
    if (dontApplyIfFalse && !value) return;
    const body = document.body;
    body.style.setProperty("--" + setting, value);
}

export function loadLocalSetting(name) {
    if (storageAvailable("localStorage")) {
        return JSON.parse(localStorage.settings ?? "{}")[name] ?? null;
    }
    return null;
}

export function setLocalSetting(name, value) {
    if (storageAvailable("localStorage")) {
        console.log("Setting local setting", name, value);
        console.log(localStorage.settings);
        const settings = JSON.parse(localStorage.settings ?? "{}");
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
export function loadSetting(settingName, defaultValue = null) {
    localStorage.settings ??= "{}";
    const element = document.getElementById(settingName);
    console.log("Loading setting", settingName, element);
    let value = loadLocalSetting(settingName);
    if (value == null) setLocalSetting(settingName, defaultValue);
    value ??= defaultValue;

    if (!element) return;
    if (!(element.nodeName === "INPUT")) return;

    // @ts-ignore
    switch (element.type) {
    case "checkbox":
        if (value != null) {
            // @ts-ignore
            element.checked = value;
        }
        element.addEventListener("input", function(evt) {
            // @ts-ignore
            setLocalSetting(settingName, !!evt.target.checked);
        });
        break;
    case "number":
        if (value != null) {
            // @ts-ignore
            element.value = value;
        }
        element.addEventListener("input", function(evt) {
            // @ts-ignore
            setLocalSetting(settingName, evt.target.value);
        });
        break;

    case "radio":
        const hints = document.getElementsByName(settingName);
        // @ts-ignore
        for (const hint of hints) {
            hint.addEventListener("click", function(evt) {
                // @ts-ignore
                setLocalSetting(settingName, evt.target.value);
            });
            // @ts-ignore
            if (hint.value === value) {
                // @ts-ignore
                hint.checked = true;
            }
        }
        break;
    case "text":
        // @ts-ignore
        if (value != null) element.value = value;
        element.addEventListener("input", function(evt) {
            // @ts-ignore
            setLocalSetting(settingName, evt.target.value);
        });
        break;
    }

    prepareInput(settingName);
}

export function prepareInput(settingName) {
    const element = document.getElementById(settingName);
    if (!element) return;
    if (!(element.nodeName === "INPUT")) return;

    // @ts-ignore
    switch (element.type) {
    case "checkbox":
        // @ts-ignore
        if (element.checked) {
            element.parentElement.classList.add("active");
        }
        element.addEventListener("input", function(evt) {
            // @ts-ignore
            evt.target.parentElement.classList.toggle("active");
        });

        break;
    case "number":
        break;

    case "radio":
        const hints = document.getElementsByName(settingName);
        console.log(hints);
        // @ts-ignore
        for (const hint of hints) {
            // @ts-ignore
            if (hint.checked) {
                hint.parentElement.classList.add("active");
            }
            hint.addEventListener("click", function(evt) {
                console.log(evt);
                // @ts-ignore
                for (const hint of hints) {
                    hint.parentElement.classList.remove("active");
                    // @ts-ignore
                    evt.target.checked = false;
                }
                // @ts-ignore
                evt.target.parentElement.classList.add("active");
                // @ts-ignore
                evt.target.checked = true;
            });
        }
        break;
    case "text":
        break;
    }
}

export function loadSettings() {
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

export function initializeButtons(jig) {
    const again = document.getElementById("again");
    again.addEventListener("click", function(evt) {
        evt.preventDefault();
        jig.reset();
    });

    const end = document.getElementById("end");
    end.addEventListener("click", function(evt) {
        evt.preventDefault();
        jig.endExercise();
    });

    const showHint = document.getElementById("show-hint");
    showHint?.addEventListener("click", function(evt) {
        evt.preventDefault();
        jig.hint.show();
    });

    const hideHint = document.getElementById("hide-hint");
    hideHint?.addEventListener("click", function(evt) {
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
export function updateURLParameter(url, param, paramVal) {
    let newAdditionalURL = "";
    let tempArray = url.split("?");
    const baseURL = tempArray[0];
    const additionalURL = tempArray[1];
    let temp = "";
    if (additionalURL) {
        tempArray = additionalURL.split("&");
        for (let i = 0; i < tempArray.length; i++) {
            if (tempArray[i].split("=")[0] != param) {
                newAdditionalURL += temp + tempArray[i];
                temp = "&";
            }
        }
    }

    const rowsTxt = temp + "" + param + "=" + paramVal;
    return (
        baseURL + "?" + newAdditionalURL + (paramVal == null ? "" : rowsTxt)
    );
}

export function displayOnly(show) {
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

export function N(target, ...args) {
    const el =
        typeof target === "string" ?
            document.createElement(target) : // Handle if the target is a JQuery object
            target instanceof jQuery ?
                target[0] :
                target;
    for (const arg of args) {
        if (arg instanceof Element || arg instanceof Text) {
            el.appendChild(arg);
        } else if (Array.isArray(arg)) {
            N(el, ...arg);
        } else if (typeof arg === "string") {
            // Add a text node and allow for HTML entities
            const textNode = document.createTextNode("");
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = arg;
            textNode.nodeValue = tempDiv.textContent;
            el.appendChild(textNode);
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

export function hiddenField(form, name, value) {
    if (value === "") return;
    if (typeof value === "object") {
        value = btoa(JSON.stringify(value));
    }
    if (form.elements[name]) form.elements[name].value = value;
    else N(form, N("input", {type: "hidden", name: name, value: value}));
}
