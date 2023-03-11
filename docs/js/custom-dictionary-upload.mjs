import { LS, setTheme } from "../scripts/utils/util.mjs";
setTheme();

$(function () {
    let customDictionaries = LS.get("customDictionaries", {});

    if (customDictionaries) {
        customDictionaries.forEach((dictionary, index) => {
            console.log(dictionary);

            let fileInput = $("#fileToUpload" + (index + 1));

            const myFile = new File(["Hello World!"], "customDict.txt", {
                type: "text/plain",
                lastModified: new Date().getTime(),
            });

            // Now let's create a DataTransfer to get a FileList
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(myFile);

            fileInput.prop("files", dataTransfer.files);
        });
    }

    $("#submit").on("click", function (event) {
        event.preventDefault();

        /**
         * @type {JQuery<HTMLInputElement>}
         */
        let fileInputs = $("input[type='file']"); // get all file input elements
        let texts = [];

        fileInputs.each(function (index, input) {
            if (input.files?.[0]) {
                texts.push(input.files[0].text()); // add the text content of the selected file to the texts array
            }
        });

        Promise.all(texts).then(function (values) {
            let customDictionaries = [];

            values.forEach(function (value) {
                customDictionaries.push(JSON.parse(value));
                // parse the JSON content of each file and add to the customDictionaries array
            });

            localStorage.setItem("customDictionaries", JSON.stringify(customDictionaries));

            //redirect the user back up one level
            window.history.back();
        });
    });
});
