
// importScripts("spectra.js");


let _analyze = null;
(async () => {
    await new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 0);
    });
    // @ts-ignore
    if (typeof importScripts === "function") {
    //Always load the rules from 127.0.0.1:5500/scripts/spectra/rules.mjs
        try {
        // @ts-ignore
            importScripts("./spectra.js");
        } catch (e) {
        // @ts-ignore
            importScripts("./spectra/spectra.js");
        }
        // @ts-ignore
    } else if (typeof require === "function") {
        try {
        // @ts-ignore
            _analyze = require("./spectra.mjs")._analyze;
        } catch (e) {
        // @ts-ignore
            _analyze = require("./spectra/spectra.mjs")._analyze;
        }
        // @ts-ignore
        _analyze ??= window._SpectraRules;
    } else {
        console.log("_analyze import is defined");
        try {
            import("./spectra.js").then((rules) => {
            // @ts-ignore
                console.log("_analyze  loaded from import", rules._analyze, window._analyze);
                // @ts-ignore
                _analyze = rules._analyze;
                // @ts-ignore
                _analyze ??= window._analyze;
                console.log("_analyze  loaded from import", _analyze);
            });
        } catch (e) {
        // @ts-ignore
            import("./spectra/spectra.js").then((rules) => {
            // @ts-ignore
                console.log("_analyze  loaded from backup import", rules._analyze, window._analyze);
                _analyze = rules._analyze;
                // @ts-ignore
                _analyze ??= window._analyze;
                console.log("_analyze  loaded from backup import", _analyze);
            });
        }
    }
    if (typeof window !== "undefined") {
        // @ts-ignore
        _analyze ??= window._analyze;
    }

    // @ts-ignore
    _analyze ??= self._analyze;
    console.log("_analyze loaded", _analyze, _analyze?.toString());
})();


export function analyze(...args) {
    if (_analyze) {
        return _analyze(...args);
    }

    throw new Error("Spectra rules not loaded");
}
