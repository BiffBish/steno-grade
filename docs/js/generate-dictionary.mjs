setTheme();
//When the user clicks Save the dictionary is saved to local storage
$(function () {
    console.log("Ready");
    console.log($("#submit_1"));
    $("#submit_1").click(function () {
        console.log("Generating dictionary");

        var words = $("#words").val().split("\n");

        var outputList = [];
        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            var outlineList = GenerateOutlinesFromInputRecursively(word, "", 0);
            outputList = outputList.concat(outlineList);
        }

        var output = outlineList.join("\n");

        $("#output").val(output);
    });
});
