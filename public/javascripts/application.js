/*global $, Attacklab, window */

$(function () {
    var $input = $("#editor"),
        $previewScroller = $("#preview-scroller"),
        $previewPages = $previewScroller.children(".preview-page"),
        //$pageSplitters = $previewScroller.children(".page-splitter"),
        $toolbar = $("#toolbar"),
        $chkNonprinting = $("#chk-nonprinting"),
        $zoomLevel = $("#zoom-level"),

        showdown = new Attacklab.showdown.converter(),
        prevText = "",

        PAGE_WIDTH = 210, // assume A4 paper size for now
        PAGE_HEIGHT = 297,

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

    $chkNonprinting.change(function () {
        $previewPages.toggleClass("nonprinting", this.checked);
    });

    $input.keyup(function () {
        var newText = $input.val();
        if (newText === prevText) {
            return;
        }

        $previewPages.html(showdown.makeHtml(newText));

        prevText = newText;
    }).focus(function () {
        $(this).parent().addClass("focus");
    }).blur(function () {
        $(this).parent().removeClass("focus");
    });

    // Calculate font size based on preview 'page' width.
    $(window).resize(function () {
        // Assume A4 paper size for now (210mm wide).
        zoom = ($previewScroller.width() - 40) / PAGE_WIDTH / PPMM;

        $previewPages.css({
            "-webkit-transform": "scale(" + zoom + ")",
            "-moz-transform": "scale(" + zoom + ")",
            "-o-transform": "scale(" + zoom + ")",
            "-ms-transform": "scale(" + zoom + ")",
            "transform": "scale(" + zoom + ")"
        });

        $zoomLevel.text(Math.round(zoom * 100));
    });

    $("#app-loading-message").remove();
    $input.focus().keyup();
    $(window).resize();
});
