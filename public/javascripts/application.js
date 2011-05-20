/*jslint nomen:false */
/*global $, _, Showdown, window, editingDocument */

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

		$chkMonospace = $("#chk-monospace"),

		$chkLinebreaks = $("#chk-linebreaks"),
		$chkPrivateDoc = $("#chk-private-doc"),

		$rdoPreviewOff = $("#rdo-preview-off"),
		$rdoPreviewPrint = $("#rdo-preview-print"),
		$rdoPreviewHTML = $("#rdo-preview-html"),

		$chkNonprinting = $("#chk-nonprinting"),
		$chkAutozoom = $("#chk-autozoom"),

		$txtBaseFont = $("#txt-base-font"),
		$txtBaseFontSize = $("#txt-base-font-size"),
		$txtHeadingFont = $("#txt-heading-font"),

		$lastSaved = $("#last-saved"),
		$btnSave = $("#btn-save"),

		$debug = $("#debug"),
		$saving = $("#doc-saving-message"),

		$zoomLevel = $("#zoom-level"),

		$editorSizer = $("#editor-sizer"),

		showdown = new Showdown.converter(),
		prevText = "", lastSavedText, lastSavedTitle,
		savedState = {},
		currentState = {},
		ageTimer, saveTimer,
        docPath = $("#doc-path").val(),
		previewVisible = true,
		sizingEditor = false, sizeOffset, previewMargin =
			$previewScroller.outerWidth(true) - $previewScroller.outerWidth(),

		PAGE_WIDTH = 210, // assume A4 paper size for now
		PAGE_HEIGHT = 297,
		SAVE_INTERVAL = 1000 * 60 * 2,

		zoom = 1, PPI = 96, PPMM = PPI / 25.4,

		// Functions:
		pxToPt, ptToPx, pxToMm, ptToMm, mmToPx,
		updatePreview, resetSaveTimer, saveDocument,
		resetAgeTimer, updateAgeStatus,
		updateModifiedStatus, changeState, modified;

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
		var newText, tempHTML, i,
			codeblock = /(<code(?:[^>]*)>[^<]*)<\/code>/g,
			codeblocks = [],
			HTMLView = $rdoPreviewHTML.attr("checked");

		if (!previewVisible) {
			return;
		}

		newText = $input.val();
		tempHTML = showdown.makeHtml(newText);

		if ($chkLinebreaks.attr("checked")) {
			// Encode tildes so we can use them as escape characters.
			tempHTML = tempHTML.replace(/~/, "~T");

			// Yank out <pre> blocks to prevent linebreaks from affecting them.
			i = -1;
			tempHTML = tempHTML.replace(codeblock, function () {
				i += 1;
				codeblocks[i] = arguments[1];
				return "~C" + i + "</code>";
			});

			// Replace single carriage returns in with line breaks, and
			// insert 'holder' for nonprinting linebreak markers if in 'print'
			// preview mode.
			tempHTML = tempHTML.replace(
				/([^>\n])\n/g, HTMLView ? 
					'$1<br>\n' :
					'$1<span class="nonprinting-br"></span><br>\n');

			// Restore code blocks. Will fail if there are more than 9999
			// separate code blocks.
			i = -1;
			tempHTML = tempHTML.replace(/~C\d{1,4}/g, function () {
				i += 1;
				return codeblocks[i];
			});

			// Restore tildes.
			tempHTML = tempHTML.replace(/~T/, "~");
		}

		if (HTMLView) {
			$pages.text(tempHTML);
		} else {
			$pages.html(tempHTML);
		}
	};

	resetSaveTimer = function () {
		clearTimeout(saveTimer);
		saveTimer = setInterval(function () {
			saveDocument();
		}, 60000);
	};

	saveDocument = function () {
		if (!modified()) {
			return;
		}

		ageTimer = clearTimeout(ageTimer);
		$saving.fadeIn(100);

		$.post(docPath, _({ "_method": "PUT" }).extend(currentState),
			function (status) {
				$saving.fadeOut(100);

				if (status === "SUCCESS") {
					savedState = currentState;
					savedState.lastSaved = Date.now();
					updateModifiedStatus();

					resetAgeTimer();
					resetSaveTimer();
				} else {
					alert("Unable to save document.\n\n" + status);
				}

			});
	};

	changeState = function (changes) {
		currentState = _({}).extend(currentState, changes);
		updateModifiedStatus();
	};

	modified = function () {
		var result = false;

		_(currentState).each(function (value, key) {
			if (currentState[key] !== savedState[key]) {
				result = true;
			}
		});
		return result;
	};

	updateModifiedStatus = function () {
		var mod = modified();

		$lastSaved.toggle(mod);
		$btnSave.attr("disabled", !mod);
	};

	resetAgeTimer = function () {
		clearTimeout(ageTimer);
		ageTimer = setInterval(function () {
			updateAgeStatus();
		}, 10000);
	};

	updateAgeStatus = function () {
		var $docAge = $("#doc-age"),
			docAge = Math.round((Date.now() - savedState.lastSaved) / 1000);


		if (docAge === 0) {
			$docAge.text("just now.");
		} else if (docAge <= 60) {
			$docAge.text(docAge + " seconds ago.");
		} else {
			docAge = Math.ceil(docAge / 60);
			$docAge.text(docAge + " minutes ago.");
		}
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
		$preview.toggleClass("raw", $rdoPreviewHTML.attr("checked"));
		updatePreview();
	});

	$chkNonprinting.change(function () {
		$preview.toggleClass("show-nonprinting", this.checked);
	});

	$chkAutozoom.change(function () {
		$(window).resize();
	});

	$chkLinebreaks.change(function () {
		changeState({ linebreaks: $chkLinebreaks.attr("checked") });
		updatePreview();
	});

	$chkPrivateDoc.change(function () {
		changeState({ privateDoc: $chkPrivateDoc.attr("checked") });
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
		changeState({ title: $docTitle.val() });
	});

	$input.keyup(function () {
		var newText = $input.val();

		if (newText === prevText) {
			return;
		}

		changeState({ content: newText });

		updatePreview();

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

		// Set up initial saved state.
		savedState = {
			lastSaved: Date.now(),
			content: $input.val(),
			title: $docTitle.val(),
			linebreaks: $chkLinebreaks.attr("checked"),
			privateDoc: $chkPrivateDoc.attr("checked")
		};

		// Make current state the same as the saved state.
		changeState(savedState);
		resetAgeTimer();
		resetSaveTimer();
    }
	updatePreview();

	$(window).resize();
});
