/*global $, Attacklab */

$(function () {
    var $input = $("#editor"),
        $preview = $("#preview"),
        showdown = new Attacklab.showdown.converter(),
        prevText = "";

    $input.keyup(function () {
        var newText = $input.val();
        if (newText === prevText) {
            return;
        }

        $preview.html(showdown.makeHtml(newText));

        prevText = newText;
    });

    $input.focus().keyup();

});
