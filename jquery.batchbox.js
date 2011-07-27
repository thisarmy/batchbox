(function($) {
/*
TODO:
* support for images
* navigate up/down arrow key support for spreadsheet-like behaviour
* add, delete events
*/
$.fn.batchbox = function(options, data) {
    if (options == 'dump') {
        var settings = $(this).data('settings');
        if (!settings) {
            return;
        }

        var rows = [];
        var $tbody = $('#'+settings.name+' tbody');
        $tbody.find('tr').each(function() {
            var row = {}
            var $columns = $(this).children();
            for (var i in settings.fields) {
                var field = settings.fields[i];
                var $input = $columns.eq(i).find('input');
                // jquery.placeholder.js support
                var placeholder = $.data($input.get(0), 'placeholderValue');
                var value = $input.val();
                if (placeholder && placeholder === value) {
                    row[field.name] = '';
                } else {
                    row[field.name] = value;
                }
            }
            rows.push(row);
        });
        return rows;
    }
    if (options == 'serialize') {
        return JSON.stringify($(this).batchbox('dump'));
    }

    var settings = {
        name: 'batchbox',      // becomes the id as well as field name prefix
        'class': 'batchbox',   // added to the table that's generated
        fields: null,          // required array of objects (see below)
        addLabel: 'Add',       // for the single add button
        handleLabel: '&nbsp;', // for the <span class="handle"></span> contents
        deleteLabel: 'delete', // for the <span class="delete"></span> contents
        headings: false,       // also add a thead at the start
        sortable: true,        // add handles and invoke .sortable() on tbody
        validate: null         // see defaultValidate() below
    };
    if (options) {
        $.extend(settings, options);
    }

    // fields are required
    if (!settings.fields || !settings.fields.length) {
        return this;
    }
    for (var i in settings.fields) {
        var field = settings.fields[i];
        // for each field, the name is required.
        if (!field.name) {
            return this;
        }
        // placeholder, class and heading defaults to the field name
        if (!field.placeholder) {
            field.placeholder = field.name;
        }
        if (!field['class']) {
            field['class'] = field.name;
        }
        if (!field['heading']) {
            field['heading'] = field.name;
        }
    }

    // normalise missing data to null
    if (!data || !data.length) {
        data = null;
    }

    // sanity check: This only works on one container element at a time.
    if (this.length > 1) {
        return this;
    }

    /*
    The row number will be added to the field names so that they are unique.
    It is incremented whenever we use it.
    */
    var rowNumber = 0;

    /*
    Adding a row is shared code between adding the row originally
    and adding it via user action.
    */
    function addRow(row) {
        var $tr = $('<tr></tr>');
        for (var j in settings.fields) {
            var field = settings.fields[j];
            var value = row[field.name];
            var $td = $('<td></td>');
            var $input = $('<input type="text">');
            $input
                .attr('name', settings.name+'-'+field.name+'-'+rowNumber)
                .attr('placeholder', field.placeholder)
                .attr('class', field['class'])
                .val(value);
            $td.append($input);
            $tr.append($td);
        }
        var $td = $('<td class="controls"></td>');
        /*
        td.controls contains div.inner so that you can set position: relative;
        which in turn allows you to absolutely position the delete button.
        (A design assumption, but you obviously don't have to use it like that.)
        */
        var $inner = $('<div class="inner"></div>');
        $td.append($inner);
        var $del = $('<span class="delete" title="delete"></span>');
        $del.html(settings.deleteLabel);
        $inner.append($del);
        if (settings.sortable) {
            var $handle = $('<span class="handle" title="drag"></span>');
            $handle.html(settings.handleLabel);
            $inner.append($handle);
        }
        $tr.append($td);
        $tbody.append($tr);

        // jquery.placeholder.js support
        $tbody.find('tr:last-child input[type=text]').placeholder();

        rowNumber += 1;

        return $tr;
    }

    var $container = $(this);
    var $table = $('<table></table>');
    $table.attr('id', settings.name);
    $table.attr('class', settings['class']);
    var $thead = null;
    if (settings.headings) {
        $table.addClass(settings.name+'-with-headings');
        $thead = $('<thead></thead>');
        $table.append($thead);
        var $tr = $('<tr></tr>');
        for (var j in settings.fields) {
            var field = settings.fields[j];
            var $th = $('<th></th>');
            $th.attr('class', field['class']);
            $th.html(field.heading);
            $tr.append($th);
        }
        var $th = $('<th class="controls"></th>');
        $tr.append($th);
        $thead.append($tr);
    }
    var $tbody = $('<tbody></tbody>');
    $table.append($tbody);
    var $tfoot = $('<tfoot></tfoot>');
    $table.append($tfoot);

    function toggleEmpty() {
        /*
        add/remove a class to assist in styling tables with empty bodies
        (useful for doing border styling tricks)
        */
        if ($tbody.find('tr').length) {
            $table.removeClass('empty-'+settings['class']);
        } else {
            $table.addClass('empty-'+settings['class']);
        }
    }

    // add existing data (if any) to the tbody
    if (data) {
        for (var i in data) {
            var row = data[i];
            addRow(row);
        }
    }
    toggleEmpty();

    // add the fields for adding a new row to the footer.
    var $tr = $('<tr></tr>');
    for (var j in settings.fields) {
        var field = settings.fields[j];
        var $td = $('<td></td>');
        var $input = $('<input type="text">');
        $input
            .attr('name', settings.name+'-'+field.name)
            .attr('placeholder', field.placeholder)
            .attr('class', field['class']);
        $td.append($input);
        $tr.append($td);
    }
    var $td = $('<td></td>');
    var $add = $('<input type="button" class="add">');
    $add.val(settings.addLabel);
    $td.append($add);
    $tr.append($td);
    $tfoot.append($tr);
    $container.append($table);

    $container.find('tfoot input[type=text]').placeholder();

    if (settings.sortable) {
        /*
        Return a helper with identically sized cells.
        We hard-code the helper's cells' widths to the current
        "automatic" widths of the original's cells.
        */
        var makeHelper = function(e, original) {
            var clone = original.clone();
            var oc = original.children();
            var cc = clone.children();
            var amount = oc.length;
            for (var i=0; i<amount; i++) {
                cc.eq(i).width(oc.eq(i).width());
            }
            return clone;
        };
        $tbody.sortable({
            helper: makeHelper,
            forceHelperSize: true,
            handle: '.handle'
        });
    }

    /*
    Make the add button's table cell the same size as the button.
    hopefully the other cells in that column will then all take on
    the same size.
    (This is a bit of a hack and a design assumption.)
    */
    $add.parent().width($add.outerWidth());

    /*
    Validate gets called when you add a row, but what about editing cells?
    It is probably best to validate things when you try and submit the form,
    otherwise you'll end up with a tangled .blur() mess.
    It would be more in line with the batched nature of this widget anyway.

    However, if you want to proceed:
    The validate function gets a map of {fieldname: $field} and must return
    a map of {fieldname: value} OR false. You are responsible for
    adding/clearing your own error messages:
    If add() receives false it just does nothing.
    */
    function defaultValidate(map) {
        var row = {};
        for (var name in map) {
            if (map.hasOwnProperty(name)) {
                var value = map[name].val();
                var fld = map[name].get(0);
                // jquery.placeholder.js serialization support
                if (value == $.data(fld, 'placeholderValue')) {
                    value = '';
                }
                row[name] = value;
                // you would check row[name] here and possibly return false
            }
        }
        return row;
    }

    var validate = defaultValidate;
    if (settings.validate) {
        validate = settings.validate;
    }
    function add() {
        var map = {};
        // collect and validate
        for (var j in settings.fields) {
            var field = settings.fields[j];
            var fieldname = settings.name+'-'+field.name;
            var $input = $table.find('input[name='+fieldname+']');
            map[field.name] = $input;
        }

        var row = validate(map);
        if (row === false) {
            return false;
        }

        // add
        var $tr = addRow(row);
        $table.trigger('batchbox:add', [$tr, row]);

        // clear
        $tfoot.find('input[type=text]').val('');

        // jquery.placeholder.js support
        // (is this absolutely necessary?)
        $tfoot.find('input[type=text]').placeholder('refresh');

        toggleEmpty();

        return false;
    }
    $add.click(add);
    $tfoot.find('input[type=text]').keypress(function(event) {
        if (event.keyCode == 13) {
            add();
            return false;
        }
        return true;
    });
    $('#'+settings.name+' span.delete').live('click', function() {
        var $tr = $(this).parents('tr')
        $tr.remove();
        $table.trigger('batchbox:delete', [$tr]);
        toggleEmpty();
    });

    $table.data('settings', settings);

    return this;
};
})(jQuery);
