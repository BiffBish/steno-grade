import { Intro } from "../scripts/intro.js";
import { N, setTheme } from "../scripts/utils/util.mjs";

$(function () {
    let form = $("#selectDrill");
    let drill = form.find("[name='drill']");

    let order = Object.keys(Intro);
    for (const element of order) {
        let option = document.createElement("option");
        option.appendChild(document.createTextNode(element));
        N(drill, [option]);
    }
    drill.trigger("focus");
    form.on("submit", function (ev) {
        //Get the drill valu
        // @ts-ignore
        if (!$("[name='drill']").val()?.length > 0) {
            //Stop
            ev.preventDefault();
        }
    });

    $("[name='seed']").val(Math.random() * 1000000);
});
setTheme();
