import { setTheme, N } from "../scripts/utils/util.mjs";

import { LearnPloverOrder } from "../scripts/learn-plover.mjs";

setTheme();
$(function () {
    let drill = $("#selectDrill select[name=drill]");
    for (const element of LearnPloverOrder) {
        let option = document.createElement("option");
        option.appendChild(document.createTextNode(element));
        N(drill, [option]);
    }
    drill.focus();
});
