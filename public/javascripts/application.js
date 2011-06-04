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
		$chkSmartQuotes = $("#chk-smart-quotes"),
		$chkSmartDashes = $("#chk-smart-dashes"),
		$chkPrivateDoc = $("#chk-private-doc"),

		$rdoPreviewOff = $("#rdo-preview-off"),
		$rdoPreviewPrint = $("#rdo-preview-print"),
		$rdoPreviewHTML = $("#rdo-preview-html"),

		$chkNonprinting = $("#chk-nonprinting"),
		$chkPageMargins = $("#chk-page-margins"),
		$chkAutozoom = $("#chk-autozoom"),

		$txtBaseFont = $("#txt-base-font"),
		$txtBaseFontSize = $("#txt-base-font-size"),
		$txtHeadingFont = $("#txt-heading-font"),

		$lastSaved = $("#last-saved"),
		$btnSave = $("#btn-save"),

		$debug = $("#debug"),
		$saving = $("#doc-saving-message"),

		$zoomLevel = $("#zoom-level"),
		$updateSpeed = $("#update-speed"),

		$syntaxGuide = $("#syntax-guide"),
		$editorSizer = $("#editor-sizer"),

		showdown = new Showdown.converter(),
		prevText = "", lastSavedText, lastSavedTitle,
		savedState = {},
		currentState = {},
		ageTimer, saveTimer,
		updateTimer, updateSpeed = 200,
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
		var newText, HTML, i,
			codeblock = /(<code(?:[^>]*)>[^<]*)<\/code>/g,
			codeblocks = [], mlCodeblocks = [], newlines = [],
			HTMLView = $rdoPreviewHTML.attr("checked"),
			updateStart,
			extractCodeblocks, restoreCodeblocks;

		if (!previewVisible) {
			return;
		}

		updateStart = Date.now();

		extractCodeblocks = function () {
			// Encode tildes so we can use them as escape characters.
			newText = newText.replace(/~/, "~T");

			// Inline code blocks
			codeblocks = [];
			i = -1;
			newText = newText.replace(/`(.+)`/g, function () {
				i += 1;
				codeblocks[i] = arguments[1];
				return "~C" + i;
			});

			// Multi-line code blocks
			mlCodeblocks = [];
			i = -1;
			newText = newText.replace(/((\n+( {4}|\t).+)+)/g, function () {
				i += 1;
				mlCodeblocks[i] = arguments[1];
				return "~M" + i;
			});

		};

		restoreCodeblocks = function () {
			i = -1;
			newText = newText.replace(/~M\d{1,4}[~]?/g, function () {
				i += 1;
				return "    " + mlCodeblocks[i];
			});

			i = -1;
			newText = newText.replace(/~C\d{1,4}/g, function () {
				i += 1;
				return "`" + codeblocks[i] + "`";
			});

			newText = newText.replace(/~T/, "~");
		};

		document.title = ($docTitle.val() || $docTitle.text() || "<untitled>") +
			" - Soda";

		newText = $input.val();

		// Extract code blocks first, since we don't want smart quotes or <br>
		// tags in those.
		extractCodeblocks();

		if ($chkSmartQuotes.attr("checked")) {
			// Double quotes
			newText = newText.
				// Opening quotes
				replace(/"([\w'])/g, "&ldquo;$1").
				// All the rest
				replace(/"/g, "&rdquo;");

			// Single quotes/apostrophes
			newText = newText.
				// Apostrophes first
				replace(/\b'\b/g, "&rsquo;").
				// Opening quotes
				replace(/'\b/g, "&lsquo;").
				// All the rest
				replace(/'/g, "&rsquo;");
		}

		if ($chkSmartDashes.attr("checked")) {
			newText = newText
				.replace(/^-+$/gm, "~D")
				.replace(/---/g, "&mdash;")
				.replace(/--/g, "&ndash;")
				.replace(/~D/g, "----");
		}

		if ($chkLinebreaks.attr("checked")) {
			i = -1;
			newText = newText
				// Insert extra newline after a heading
				.replace(/^(#.+)$/gm, "$1\n")
				// Remove groups of 2 or more newlines
				.replace(/\n{2,}/g, "~N")
				.replace(
				/\n/g, HTMLView ? 
					'<br>\n' :
					'<span class="nonprinting-br"></span><br>\n')
				// Restore multi-newlines.
				.replace(/~N/g, "\n\n");

		}

		restoreCodeblocks();

		HTML = showdown.makeHtml(newText);

		if (HTMLView) {
			$pages.text(HTML);
		} else {
			$pages.html(HTML);
		}

		setTimeout(function () {
			updateSpeed = Date.now() - updateStart;
			$updateSpeed.text(updateSpeed);
		}, 0);

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
					$input.focus();

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

	$chkPageMargins.change(function () {
		$preview.toggleClass("no-margins", !$chkPageMargins.attr("checked"));
	});

	$chkLinebreaks.change(function () {
		changeState({ linebreaks: $chkLinebreaks.attr("checked") });
		updatePreview();
	});

	$chkSmartQuotes.change(function () {
		changeState({ smartQuotes: $chkSmartQuotes.attr("checked") });
		updatePreview();
	});

	$chkSmartDashes.change(function () {
		changeState({ smartDashes: $chkSmartDashes.attr("checked") });
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

		if (updateTimer) {
			clearTimeout(updateTimer);
		}

		// Throttle preview updates so that the user's typing is not affected.
		updateTimer = setTimeout(function () {
			updatePreview();
		}, updateSpeed + 200);

		prevText = newText;

	}).focus(function () {
		$(this).parent().parent().addClass("focus");
	}).blur(function () {
		$(this).parent().parent().removeClass("focus");
	});

	$btnSave.click(function () {
		saveDocument();
	});

	$syntaxGuide.click(function () {
		$editorBox.toggleClass("show-syntax");
		$syntaxGuide.scrollTop(0);
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

	//setTimeout(function () {
		//$("#app-loading-message").remove();
	//}, 2000);

	$("#app-loading-message").remove();

	if (docPath) {
		if (!$docTitle.val()) {
			$docTitle.focus();
		} else {
			$input.focus();
		}

		// Set up initial saved state, based on which checkboxes are initially
		// checked.
		savedState = {
			lastSaved: Date.now(),
			content: $input.val(),
			title: $docTitle.val(),
			linebreaks: $chkLinebreaks.attr("checked"),
			smartQuotes: $chkSmartQuotes.attr("checked"),
			smartDashes: $chkSmartDashes.attr("checked"),
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
