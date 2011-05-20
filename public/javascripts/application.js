/*global $, Showdown, window, editingDocument */

$(function () {
	var $html = $("html"),
		$input = $("#editor textarea").length ?
			$("#editor textarea") :
			$("#doc-source"),
		$editorBox = $("#editor"),
		$docTitle = $("#doc-title"),
		$previewScroller = $("#preview-scroller"),
		$preview = $("#preview"),
		$pages = $(".page"),
		$toolbar = $("#toolbar"),

		$chkLinebreaks = $("#chk-linebreaks"),
		$chkMonospace = $("#chk-monospace"),

		$rdoPreviewOff = $("#rdo-preview-off"),
		$rdoPreviewPrint = $("#rdo-preview-print"),
		$rdoPreviewHTML = $("#rdo-preview-html"),

		$chkNonprinting = $("#chk-nonprinting"),
		$chkAutozoom = $("#chk-autozoom"),

		$txtBaseFont = $("#txt-base-font"),
		$txtBaseFontSize = $("#txt-base-font-size"),
		$txtHeadingFont = $("#txt-heading-font"),

		$btnSave = $("#btn-save"),

		$debug = $("#debug"),
		$saving = $("#doc-saving-message"),

		$zoomLevel = $("#zoom-level"),

		$editorSizer = $("#editor-sizer"),

		showdown = new Showdown.converter(),
		prevText = "", lastSavedText, lastSavedTitle,
        docPath = $("#doc-path").val(),
		saveTimer, modified, lastSaveInterval, lastSaveTime,
		previewVisible = true,
		sizingEditor = false, sizeOffset, previewMargin =
			$previewScroller.outerWidth(true) - $previewScroller.outerWidth(),

		PAGE_WIDTH = 210, // assume A4 paper size for now
		PAGE_HEIGHT = 297,
		SAVE_INTERVAL = 1000 * 60 * 2,

		zoom = 1, PPI = 96, PPMM = PPI / 25.4,

		// Functions:
		pxToPt, ptToPx, pxToMm, ptToMm, mmToPx,
		updatePreview, saveDocument, resetLastSavedTimer, updateSaveStatus,
		updateModifiedStatus;

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

	updatePreview = function () {
		var newText, tempHTML;

		if (!previewVisible) {
			return;
		}

		newText = $input.val();
		tempHTML = showdown.makeHtml(newText);

		if ($chkLinebreaks.attr("checked")) {
			tempHTML = tempHTML.replace(
				// Remove trailing spaces.
				/\s+\n/g, "").replace(
				// Replace single carriage returns in paragraphs with line breaks,
				// and insert 'holder' for nonprinting linebreak markers.
				/([^>\n])\n/g, '$1<span class="nonprinting-br"></span><br>');
		}

		if ($rdoPreviewHTML.attr("checked")) {
			$pages.text(tempHTML);
		} else {
			$pages.html(tempHTML);
		}
	};

	saveDocument = function () {
		if (!modified) {
			return;
		}

		saveTimer = clearTimeout(saveTimer);
		$saving.fadeIn(100);

		$.post(docPath, {
			_method: "PUT",
			content: $input.val(),
			title: $docTitle.val()

		}, function (status) {
			$saving.fadeOut(100);

			if (status === "SUCCESS") {
				modified = false;
				lastSavedText = $input.val();
				lastSavedTitle = $docTitle.val();
				$btnSave.attr("disabled", true);

			} else {
				alert("Unable to save document.\n\n" + status);
			}

		});
	};

	resetLastSavedTimer = function () {
		lastSaveTime = Date.now();
		updateSaveStatus();
		lastSaveInterval = setInterval(updateSaveStatus, 10000);
	};

	updateSaveStatus = function () {
		var $docAge = $("#doc-age"),
			docAge = Math.round((Date.now() - lastSaveTime) / 1000);


		if (docAge === 0) {
			$docAge.text("just now.");
		} else if (docAge <= 60) {
			$docAge.text(docAge + " seconds ago.");
		} else {
			docAge = Math.ceil(docAge / 60);
			$docAge.text(docAge + " minutes ago.");
		}
	};

	updateModifiedStatus = function () {
		var currentText = $input.val(), currentTitle = $docTitle.val();

		modified = currentText !== lastSavedText ||
			currentTitle !== lastSavedTitle;

		if (modified) {
			if (!saveTimer) {
				saveTimer = setTimeout(saveDocument, SAVE_INTERVAL);
				resetLastSavedTimer();
			}
		} else {
			saveTimer = clearTimeout(saveTimer);
		}

		$btnSave.attr("disabled", !modified);

	};

	$html.click(function () {
		$(".dropdown-list").hide();
	});

	$(".dropdown-list-button").click(function (e) {
		e.stopPropagation();

		$(".dropdown-list").hide();
		$(this).next().toggle();
	});

	$rdoPreviewOff.click(function () {
		$previewScroller.hide();
		previewVisible = false;
	});

	$rdoPreviewPrint.click(function () {
		$previewScroller.show();
		previewVisible = true;
		$preview.removeClass("raw");
		updatePreview();
	});

	$rdoPreviewHTML.click(function () {
		$previewScroller.show();
		previewVisible = true;
		$preview.addClass("raw");
		updatePreview();
	});

	$chkNonprinting.change(function () {
		$preview.toggleClass("show-nonprinting", this.checked);
	});

	$chkAutozoom.change(function () {
		$(window).resize();
	});

	$chkLinebreaks.change(function () {
		updatePreview();
	});

	$chkMonospace.change(function () {
		$input.toggleClass("monospace", $chkMonospace.attr("checked"));
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

	$docTitle.keyup(function () {
		updateModifiedStatus();
	});

	$input.keyup(function () {
		var newText = $input.val();

		if (newText === prevText) {
			return;
		}

		updatePreview();
		updateModifiedStatus();

		prevText = newText;

	}).focus(function () {
		$(this).parent().parent().addClass("focus");
	}).blur(function () {
		$(this).parent().parent().removeClass("focus");
	});

	$btnSave.click(function () {
		saveDocument();
	});

	$editorSizer.mousedown(function (e) {
		sizingEditor = true;
		sizeOffset = $editorSizer.width() - 
			(e.pageX - $editorSizer.offset().left) + 1;

		$editorSizer.addClass("sizing");
		e.preventDefault();
		e.stopPropagation();
	});

	$html.mousemove(function (e) {
		var editorRight, previewLeft;

		if (!sizingEditor) {
			return;
		}

		editorRight = $(document).width() - e.pageX - sizeOffset;
		previewLeft = e.pageX + previewMargin - sizeOffset - 10;

		$editorBox.css({
			right: editorRight
		});

		$previewScroller.css({
			left: previewLeft
		});
	}).mouseup(function () {
		if (sizingEditor) {
			$(window).resize();
		}

		sizingEditor = false;
		$editorSizer.removeClass("sizing");
	});

	// Calculate font size based on preview 'page' width.
	$(window).resize(function () {
		// Assume A4 paper size for now (210mm wide).
		zoom = ($previewScroller.width() - 40) / PAGE_WIDTH / PPMM;

		if ($chkAutozoom && $chkAutozoom.attr("checked")) {
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
    if (docPath) {
		if (!$docTitle.val()) {
			$docTitle.focus();
		} else {
			$input.focus();
		}

		lastSavedText = $input.val();
		lastSavedTitle = $docTitle.val();
		modified = false;
    }
	updatePreview();

	$(window).resize();
});
