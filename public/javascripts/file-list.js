var SODA;

if (!SODA) {
    SODA = {};
}

SODA.fileList = (function () {
    "use strict";

    var opt = {}, by, humanSize, sortItems, setupSorting, renderTable;

    by = {
        name: function (a, b) {
            var x = a.name, y = b.name;
            //return x === y ? by.date(a, b) : x < y ? -1 : 1;
            return x === y ? 0 : x < y ? -1 : 1;
        },
        date: function (a, b) {
            var x = a.date, y = b.date;
            // Sort by name if dates are the same.
            return x === y ? by.name(a, b) : x < y ? -1 : 1;
        },
        size: function (a, b) {
            var x = a.size, y = b.size;
            return x === y ? by.name(a, b) : x < y ? -1 : 1;
        }
    };

    humanSize = function (size) {
        var KB = 1024,
            MB = KB * 1024,
            GB = MB * 1024,
            TB = GB * 1024,
            KiB = 1000,
            MiB = KiB * 1000,
            GiB = MiB * 1000,
            TiB = GiB * 1000;
        size = +size; // ensure number

        if (size < KB) {
            size = size + " B";
        } else if (size < MiB) {
            size = (size / KB).toPrecision(3) + " KB";
        } else if (size < GiB) {
            size = (size / MB).toPrecision(3) + " MB";
        } else if (size < TiB) {
            size = (size / GB).toPrecision(3) + " GB";
        } else {
            // Not very likely but you never know.
            size = Math.round(size / TB) + " TB";
        }

        return size;
    };

    sortItems = function () {
        var json;

        if (by.hasOwnProperty(opt.sort_by)) {
            opt.documents.sort(by[opt.sort_by]);
        } else {
            opt.documents.sort(by.name);
        }

        if (opt.desc) {
            opt.documents.reverse();
        }


        json = JSON.stringify({
            by: opt.sort_by,
            desc: opt.desc
        });

        window.localStorage.setItem("sorting", json);
    };

    setupSorting = function () {
        opt.$element.delegate("th", "click", function () {
            if (this.className === opt.sort_by) {
                opt.desc = !opt.desc;
            } else {
                opt.sort_by = this.className;
            }

            sortItems();
            renderTable();
        });
    };

    renderTable = function () {
        var view = { documents: opt.documents }, sort_by_name;

        if (!opt.element) {
            return;
        }

        sort_by_name = opt.sort_by === "name";

        opt.element.innerHTML = Mustache.to_html(opt.template, view);
        opt.$element.toggleClass("sort-name", sort_by_name);
        opt.$element.toggleClass("sort-date", !sort_by_name);
        opt.$element.toggleClass("desc", opt.desc);
    };


    return {
        init: function (options) {
            var i, l, d, sorting;

            options = options || {};

            sorting = JSON.parse(options.sorting) || {
                by: "name",
                desc: false
            };

            opt.documents = options.documents || [];
            opt.sort_by = sorting.by;
            opt.desc = !!sorting.desc;
            opt.element = options.element;
            opt.$element = $(opt.element);
            opt.template = options.template || "";

            for (i = 0, l = opt.documents.length; i < l; i += 1) {
                d = opt.documents[i];
                d.date_str = d.date;
                d.date = new Date(d.date);
            }

            sortItems();

            if (!opt.element) {
                return;
            }

            opt.element.className += " sortable sort-" + opt.sort_by;

            setupSorting();
            renderTable();
        },

        render: function () {
            renderTable();
        }
    };
}());

SODA.fileList.init({
    documents: SODA.doc_list,
    sorting: window.localStorage && window.localStorage.getItem("sorting"),
    element: document.getElementById("docs"),
    template: document.getElementById("docs-template").innerHTML
});
