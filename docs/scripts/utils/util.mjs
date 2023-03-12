/* eslint-disable guard-for-in */
/// <reference path="../libs/jquery-3.6.0.min.js" />

import { PRNG } from "../alea-prng.mjs";
import { TypeJig } from "../type-jig.mjs";

// @ts-ignore
// import {StenoDisplay} from "./steno-display.mjs";

//q: How do i do an optional parameter in jsdoc?
//a: https://stackoverflow.com/questions/43946379/how-to-document-an-optional-parameter-in-jsdoc

export function shuffle(a, rnd) {
    for (let i = a.length - 1; i >= 1; i--) {
        const j = Math.floor(rnd() * (i + 1));
        const aI = a[i];
        a[i] = a[j];
        a[j] = aI;
    }
    return a;
}
/**
 *
 * @param {{
 *   require_raw_steno: boolean,
 * }=} options
 */
export function populatePage(options) {
    const leftSide = N("div", { id: "leftside" }, [
        N("h3", { id: "lesson-name", class: "center" }),
        N("div", { id: "drill-content" }, [
            N("div", { id: "answer" }),
            N("div", { id: "exercise" }),
            N("div", { id: "results" }),
            N("div", { style: "height: 300px" }, [N("canvas", { id: "chartDiv", width: "400", height: "400" })]),
            N("table", { id: "corrections", style: "display:none" }, [
                N("tr", {}, [N("th", {}, "Expected"), N("th", {}, "Hesitation"), N("th", {}, "Attempts")]),
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
            N("optgroup", { label: "Light Themes" }, [
                N("option", { value: "light" }, "Light"),
                N("option", { value: "oasis" }, "Oasis"),
                N("option", { value: "ocean" }, "Ocean"),
                N("option", { value: "rustic" }, "Rustic"),
            ]),
            N("optgroup", { label: "Dark Themes" }, [
                N("option", { value: "dark" }, "Dark"),
                N("option", { value: "breeze" }, "Breeze"),
                N("option", { value: "retro-pop" }, "Retro Pop"),
                N("option", { value: "autumn" }, "Autumn"),
                N("option", { value: "odyssey" }, "Odyssey"),
            ]),
        ]
    );

    themeSelect.value = localStorage.getItem("theme") || "light";

    themeSelect.onchange = (e) => {
        const theme = e.target.value;
        localStorage.setItem("theme", theme);
        setTheme();
    };

    const nav = N("div", { id: "nav" }, [
        N("p", { id: "stroke-hint" }),
        N("p", { class: "strokes" }),
        N("p", { id: "clock", class: "clock" }),
        N("p", { id: "live-wpm-display", class: "wpm" }),
        ...rightButtons.map((button) => {
            return N("p", { class: "center" }, [
                N("a", { id: button.id, title: button.title }, button.text),
                N("span", { class: "shortcut-key" }, button.shortcut),
            ]);
        }),
        // Lets add a dropdown for all 8 of the themes, light, dark, etc.
        N("p", { class: "center" }, "Choose your theme:", [themeSelect]),
    ]);

    const textarea = N("textarea", { id: "input" });

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

/**
 * @param {string} query
 * @returns {Object.<string, string|Array.<string>>}
 */
export function parseQueryString(query) {
    /**
     * @type {Object.<string, string|Array.<string>>}
     */
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
            let val = vars[name];
            if (!Array.isArray(val)) {
                vars[name] = [val];
            } else {
                val.push(value);
            }
        } else vars[name] = value;
    }
    return vars;
}

/**
 * @param {string} query
 * @returns {Object.<string, string>}
 */
export function parseQueryStringFlat(query) {
    // @ts-ignore
    return parseQueryString(query);
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
    let i;
    let j;
    let tmp;
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
    return function () {
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
    another.href = document.location.href.toString().replace(/seed=([^&#]*)/, "seed=" + anotherSeed);
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
            document.documentElement.setAttribute("data-theme", localStorage.theme);
        }
        console.log("Setting theme", mergedSettings);
        // Get the settings from local storage
        if (mergedSettings) {
            setCustomThemeSetting("main-bg", mergedSettings.theme_background_color, true);
            setCustomThemeSetting("form-border-thickness", mergedSettings.theme_form_border_thickness ?? "1px");
        }

        /* add a JavaScript function to extract the RGB values of --main-bg */
        function getRGBValues(color) {
            let match = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            if (match) {
                return [match[1], match[2], match[3]];
            }

            let hexMatch = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);

            if (hexMatch) {
                return [parseInt(hexMatch[1], 16), parseInt(hexMatch[2], 16), parseInt(hexMatch[3], 16)];
            }

            let shortHexMatch = color.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
            if (shortHexMatch) {
                return [
                    parseInt(shortHexMatch[1] + shortHexMatch[1], 16),
                    parseInt(shortHexMatch[2] + shortHexMatch[2], 16),
                    parseInt(shortHexMatch[3] + shortHexMatch[3], 16),
                ];
            }
            return null;
        }

        function rgb2hsv(r, g, b) {
            let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
            rabs = r / 255;
            gabs = g / 255;
            babs = b / 255;
            v = Math.max(rabs, gabs, babs);
            diff = v - Math.min(rabs, gabs, babs);
            diffc = (c) => (v - c) / 6 / diff + 1 / 2;
            percentRoundFn = (num) => Math.round(num * 100) / 100;
            if (diff == 0) {
                h = s = 0;
            } else {
                s = diff / v;
                rr = diffc(rabs);
                gg = diffc(gabs);
                bb = diffc(babs);

                if (rabs === v) {
                    h = bb - gg;
                } else if (gabs === v) {
                    h = 1 / 3 + rr - bb;
                } else if (babs === v) {
                    h = 2 / 3 + gg - rr;
                }
                if (h < 0) {
                    h += 1;
                } else if (h > 1) {
                    h -= 1;
                }
            }
            return [Math.round(h * 360), percentRoundFn(s * 100), percentRoundFn(v * 100)];
        }

        const RGBToHSL = (r, g, b) => {
            r /= 255;
            g /= 255;
            b /= 255;
            const l = Math.max(r, g, b);
            const s = l - Math.min(r, g, b);
            const h = s ? (l === r ? (g - b) / s : l === g ? 2 + (b - r) / s : 4 + (r - g) / s) : 0;
            return [
                60 * h < 0 ? 60 * h + 360 : 60 * h,
                100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
                (100 * (2 * l - s)) / 2,
            ];
        };

        const propertyKeys = [
            "--main-bg",
            "--main-fg",
            "--link-text",
            "--form-border",
            "--form-shadow",
            "--answer-text",
            "--correct-text-bg",
            "--corrected-text-bg",
            "--unknown-text-bg",
            "--incorrect-text-bg",
            "--form-border-thickness",
            "--form-gap",
            "--steno-key-outline",
            "--steno-key-bg",
            "--steno-key-fg",
            "--steno-key-primary-bg",
            "--steno-key-primary-fg",
            "--steno-key-secondary-bg",
            "--steno-key-secondary-fg",
            "--steno-key-tertiary-bg",
            "--steno-key-tertiary-fg",
            "--steno-alt-key-bg",
            "--steno-alt-key-fg",
        ];

        const styles = getComputedStyle(document.documentElement);
        // @ts-ignore
        for (const element of propertyKeys) {
            const property = element;
            const value = styles.getPropertyValue(property);
            console.log(property, value);
            // if (value.startsWith("rgb")) {
            const rgb = getRGBValues(value.trim());
            if (!rgb) continue;
            const hsl = RGBToHSL(rgb[0], rgb[1], rgb[2]);

            document.documentElement.style.setProperty(property + "-rgb", rgb.join(", "));

            document.documentElement.style.setProperty(property + "-r", rgb[0]);
            document.documentElement.style.setProperty(property + "-g", rgb[1]);
            document.documentElement.style.setProperty(property + "-b", rgb[2]);

            document.documentElement.style.setProperty(property + "-hsl", hsl.join(", "));

            document.documentElement.style.setProperty(property + "-h", hsl[0] + "");
            document.documentElement.style.setProperty(property + "-s", hsl[1] + "%");
            document.documentElement.style.setProperty(property + "-l", hsl[2] + "%");

            // } else if (value.startsWith("#")) {

            // }
        }

        /* use JavaScript to set the --main-bg-rgb variable to the RGB values of --main-bg */
        let mainBg = getComputedStyle(document.documentElement).getPropertyValue("--main-bg");
        console.log("Main bg", mainBg);

        let mainBgRGB = getRGBValues(mainBg);
        console.log("Main bg rgb", mainBgRGB);
        if (mainBgRGB) {
            document.documentElement.style.setProperty("--main-bg-rgb", mainBgRGB.join(", "));
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
        element.addEventListener("input", function (evt) {
            // @ts-ignore
            setLocalSetting(settingName, !!evt.target.checked);
        });
        break;
    case "number":
        if (value != null) {
            // @ts-ignore
            element.value = value;
        }
        element.addEventListener("input", function (evt) {
            // @ts-ignore
            setLocalSetting(settingName, evt.target.value);
        });
        break;

    case "radio":
        const hints = document.getElementsByName(settingName);
        // @ts-ignore
        for (const hint of hints) {
            hint.addEventListener("click", function (evt) {
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
        element.addEventListener("input", function (evt) {
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
        element.addEventListener("input", function (evt) {
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
            hint.addEventListener("click", function (evt) {
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

/**
 *
 * @param {TypeJig} jig
 */
export async function initializeButtons(jig) {
    const again = $("#again");
    again.on("click", function (evt) {
        evt.preventDefault();
        jig.reset();
    });

    const end = $("#end");
    end.on("click", function (evt) {
        evt.preventDefault();
        jig.endExercise();
    });

    const showHint = $("#show-hint");
    showHint.on("click", function (evt) {
        evt.preventDefault();
        jig.hint.show();
    });

    const hideHint = $("#hide-hint");
    hideHint.on("click", function (evt) {
        evt.preventDefault();
        jig.hint.hide();
    });

    const next = $("#new");
    next.on("click", async function (evt) {
        //If ctrl click then open in new tab
        if (evt.ctrlKey || evt.metaKey || evt.shiftKey) {
            return;
        }

        if (jig?.getNewURL) {
            evt.preventDefault();
            const newURL = await jig.getNewURL();
            window.history.replaceState("", "", newURL);

            next.attr("href", await jig.getNewURL());
            if (!jig.getNewExercise) {
                window.location.reload();
            }
        }
        if (jig?.getNewExercise) {
            evt.preventDefault();
            jig.setExercise(jig.getNewExercise());
        }
    });

    if (jig.getNewURL) {
        const newURL = await jig.getNewURL();
        next.attr("href", newURL);
    }
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
    return baseURL + "?" + newAdditionalURL + (paramVal == null ? "" : rowsTxt);
}

export function displayOnly(show) {
    const tabs = ["form", "lesson"];
    for (const tab of tabs) {
        const displayType = tab === "lesson" ? "flex" : "block";
        document.getElementById(tab).style.display = tab === show ? displayType : "none";
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
        typeof target === "string"
            ? document.createElement(target) // Handle if the target is a JQuery object
            : target instanceof jQuery
                ? target[0]
                : target;
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
    else N(form, N("input", { type: "hidden", name: name, value: value }));
}

export class LS {
    static get(key, def) {
        if (!storageAvailable("localStorage")) return def;
        const val = localStorage.getItem(key);
        console.log("get", key, val);
        try {
            return JSON.parse(val);
        } catch (e) {
            return val ?? def;
        }
        // return val === null ? def : JSON.parse(val);
    }

    static set(key, val) {
        if (!storageAvailable("localStorage")) return;
        localStorage.setItem(key, JSON.stringify(val));
        return val;
    }
}

export function assureSeed() {
    let fields = parseQueryStringFlat(document.location.search);
    if (!fields.seed) {
        fields.seed = "" + Math.random();
        window.history.replaceState("", "", updateURLParameter(window.location.href, "seed", fields.seed));
    }
    return fields.seed;
}

export function getNextSeedUrl() {
    assureSeed();
    let fields = parseQueryStringFlat(document.location.search);
    let currentSeed = fields.seed ?? Math.random();

    let newSeed = PRNG(currentSeed)();
    return updateURLParameter(window.location.href, "seed", newSeed);
}
