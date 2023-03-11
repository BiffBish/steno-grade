/* eslint-disable guard-for-in */
/// <reference path="../libs/jquery-3.6.0.min.js" />

// @ts-ignore
// import {StenoDisplay} from "./steno-display.mjs";
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

export function criticalTheme() {
    if (storageAvailable("localStorage")) {
        localStorage.theme ??= "dark";
        if (localStorage.theme == null) {
            // Attach the theme to the html element
            document.documentElement.removeAttribute("data-theme");
        } else {
            document.documentElement.setAttribute(
                "data-theme",
                localStorage.theme,
            );
        }
    }
}
criticalTheme();
