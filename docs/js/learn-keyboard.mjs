import { setTheme, loadSetting, N } from "../scripts/utils/util.mjs";
import { LearnKeyboard } from "../scripts/learn-keyboard.mjs";
setTheme();
$(function () {
    loadSetting("hints");
    let drill = $("#selectDrill select[name=drill]");
    for (const element of Object.keys(LearnKeyboard)) {
        let option = document.createElement("option");
        option.appendChild(document.createTextNode(element));
        N(drill, [option]);
    }
    drill.focus();
});
