import { setTheme, storageAvailable, N, LS } from "../scripts/utils/util.mjs";
setTheme();
if (!storageAvailable("localStorage")) {
    document.body.appendChild(document.createTextNode("localStorage not available."));
}
let theme_select = N(
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
theme_select.value = LS.get("theme", "light");
theme_select.onchange = (e) => {
    let theme = e.target.value;
    localStorage.setItem("theme", theme);
    setTheme();
};
N($(".wrapper"), [N("p", { class: "center" }, "Choose your theme:", [theme_select])]);
