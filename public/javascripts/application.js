/*global $, Attacklab, window */

$(function () {
    var $input = $("#editor textarea"),
        $previewScroller = $("#preview-scroller"),
        $preview = $("#preview"),
        $pages = $(".page"),
        $toolbar = $("#toolbar"),
        $chkNonprinting = $("#chk-nonprinting"),
        $chkAutozoom = $("#chk-autozoom"),
        $txtBaseFont = $("#txt-base-font"),
        $txtBaseFontSize = $("#txt-base-font-size"),
        $txtHeadingFont = $("#txt-heading-font"),

        $debug = $("#debug"),

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
        $preview.toggleClass("show-nonprinting", this.checked);
    });

    $chkAutozoom.change(function () {
        $(window).resize();
    });

    $txtBaseFont.change(function () {
        $pages.css({ fontFamily: $txtBaseFont.val() });
    });

    $txtBaseFontSize.change(function () {
        $pages.css({ "font-size": $txtBaseFontSize.val() + "pt" });
    });

    $txtHeadingFont.change(function () {
        var styleElement, $styleElement = $("#heading-styles");

        if ($styleElement.length === 0) {
            styleElement = document.createElement("style");
            $styleElement = $(styleElement);
            $styleElement.appendTo(document.head);
        }

        $styleElement.html("h1,h2,h3,h4,h5,h6 { font-family: '" +
            $txtHeadingFont.val() + "' !important; }");


    });

    $input.keyup(function () {
        var newText = $input.val(), tempHTML;

        if (newText === prevText) {
            return;
        }

        //tempHTML = showdown.makeHtml(newText);
        tempHTML = showdown.makeHtml(newText).replace(
            // Remove trailing spaces.
            /\s+\n/g, "").replace(
            // Replace single carriage returns in paragraphs with line breaks,
            // and insert 'holder' for nonprinting linebreak markers.
            /([^>\n])\n/g, '$1<span class="nonprinting-br"></span><br>');

        $pages.html(tempHTML);

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

        if ($chkAutozoom.attr("checked")) {
            $preview.css({
                "-webkit-transform": "scale(" + zoom + ")",
                "-moz-transform": "scale(" + zoom + ")",
                "-o-transform": "scale(" + zoom + ")",
                "-ms-transform": "scale(" + zoom + ")",
                "transform": "scale(" + zoom + ")"
            });
        } else {
            $preview.css({
                "-webkit-transform": "",
                "-moz-transform": "",
                "-o-transform": "",
                "-ms-transform": "",
                "transform": ""
            });
        }

        $zoomLevel.text(Math.round(zoom * 100));
    });

    $("#app-loading-message").remove();
    $input.focus().keyup();
    $(window).resize();
});
