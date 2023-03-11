import { LS, setTheme } from "../scripts/utils/util.mjs";

setTheme();

let currentSettingsHtml = $("#current-settings");
let customSettingsHtml = $("#custom-settings");

//Get the current settings from local storage and pretty print them in the code block
let currentSettings = LS.get("settings", {});
currentSettingsHtml.text(JSON.stringify(currentSettings, null, 2));

let customSettings = LS.get("custom_settings", {});
customSettingsHtml.text(JSON.stringify(customSettings, null, 2));

//Add a listener to the custom settings button that adds the key value pair to the current settings
$("#custom-settings-button").on("click", function () {
    let customSettingsInputString = `${$("#custom-settings-input").val()}`;
    if (!customSettingsInputString) return;
    let customSettingsArray = customSettingsInputString.split("=");
    const [key, value] = customSettingsArray;
    customSettings[key] = value;
    LS.set("custom_settings", customSettings);
    customSettingsHtml.text(JSON.stringify(customSettings, null, 2));
    setTheme();
});

//Add a listener to the reset button that resets all settings to default
// document.getElementById("custom-settings-reset").addEventListener("click", function () {
$("#custom-settings-reset").on("click", function () {
    //alert to make sure
    if (confirm("Are you sure you want to reset all settings to default?")) {
        LS.set("custom_settings", {});
        customSettingsHtml.text("{}");
        setTheme();
    }
});
$("#custom-settings-input").on("keyup", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        currentSettingsHtml.trigger("click");
    }
});
