(function($) {
$.fn.placeholder = function(settings) {
    var options = {
        key: "placeholderValue",
        attr: "placeholder",
        className: "placeholder"
    };
    if (typeof settings == "object") {
        $.extend(options, settings);
    }

    function focus() {
        // remove the placeholder class
        $(this).removeClass(options.className);
        // if the value is the value of the placeholder, make it blank
        if ($.trim($(this).val()) === $.data(this, options.key)) {
            $(this).val("");
        }
    }

    function blur() {
        // if the value is blank, add class placeholder
        // and set the value to the placeholder
        if ($.trim($(this).val()) === "") {
            $(this).addClass(options.className).val($.data(this, options.key));
        }
    }

    if (settings == "destroy") {
        this.unbind('focus', focus);
        this.unbind('blur', blur);
        // NOTE: This only works if you use class placeholder.
        // The problem with using the "method name in place of settings" hack
        // is that you now don't have settings anymore..
        this.filter('.placeholder').each(function() {
            $(this).val('');
            $(this).removeClass('placeholder');
        });
        return;
    }

    if (settings == "refresh") {
        $(this).each(function() {
            if (!$(this).attr('placeholder')) {
                return;
            }
            if ($.trim($(this).val()) === "") {
                $(this).addClass(options.className).val(
                    $.data(this, options.key));
            }
        });
        return;
    }

    return this.filter(":input").each(function(index) {
        if (!$(this).attr('placeholder')) {
            return;
        }
        // store the placeholder values as data
        $.data(this, options.key, $(this).attr(options.attr));
        var v = $.trim($(this).val());
        if (v === "") {
            // if the value is blank, add class placeholder
            // and set the value to the placeholder
            $(this).addClass(options.className).val($.data(this, options.key));
        } else if (v == $.data(this, options.key)) {
            // if the value is the same as the placeholder it is probably filled
            // in because the user pressed the back button. So just clear it.
            $(this).val('');
        }
        $(this).focus(focus).blur(blur)
    });
};
$.fn.serializeWithoutPlaceholders = function() {
    var $this = $(this);
    var dataArray = $this.serializeArray();

    var $inputs;
    if ($this.length == 1 && $this.find('input').length > 0) {
        // this looks like a form
        $inputs = $this.find('input[type=text]');
    } else {
        // this looks like a bunch of inputs
        $inputs = $this;
    }
    $inputs.each(function() {
        var $field = $(this);
        var placeholder = $.data(this, 'placeholderValue');
        if (!placeholder) {
            return;
        }
        if ($field.val() === placeholder) {
            for (var i in dataArray) {
                if (dataArray[i].name == $field.attr('name')) {
                    dataArray[i].value = '';
                    break;
                }
            }
        }
    });
    return $.param(dataArray);
};
})(jQuery);

