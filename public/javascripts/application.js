/*global $, Attacklab, window */

$(function () {
    var $input = $("#editor"),
        $preview = $("#preview"),
        $toolbar = $("#toolbar"),
        $zoomLevel = $("#zoom-level"),

        showdown = new Attacklab.showdown.converter(),
        prevText = "",

        pageWidth = 210, // assume A4 paper size for now

        zoom = 1, PPI = 96, PPMM = PPI / 25.4,

        // Functions:
        pxToPt, ptToPx, pxToMm, ptToMm, mmToPx;

    pxToPt = function (px) {
        // 72 points per inch.
        return px * zoom * 72 / PPI;
    };

    ptToPx = function (pt) {
        return pt * zoom * PPI / 72;
    };

    mmToPx = function (mm) {
        return mm * zoom * PPMM;
    };

    $input.keyup(function () {
        var newText = $input.val();
        if (newText === prevText) {
            return;
        }

        $preview.html(showdown.makeHtml(newText));

        prevText = newText;
    });

    // Calculate font size based on preview 'page' width.
    $(window).resize(function () {
        // Assume A4 paper size for now (210mm wide).
        zoom = $preview.innerWidth() / pageWidth / PPMM;

        $zoomLevel.text(Math.round(zoom * 100));

        $preview.css({ fontSize: ptToPx(12), padding: mmToPx(20) });
    });

    $input.focus().keyup();
    $(window).resize();
});
