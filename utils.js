(function(Forms, $, undefined ) {

    Forms.clearErrors = function(form) {
        $('.has-error', form).removeClass('has-error');
        $('.messages ul', form).empty();
    }

    Forms.displayElementErrorMessages = function(form, elementName, messages) {

        var e = $('[name=' + elementName + ']', form);
        if (e === undefined) {
            console.log("Unable to find form element for " + elementName);
            return;
        }

        var formGroup = e.closest('.form-group');
        if (formGroup === undefined) {
            console.log("Unable to find form-group for " + elementName);
            return;
        }

        formGroup.addClass('has-error');

        var messagesArea = $('.messages', formGroup.closest('form'));
        if (messagesArea.length == 0) {
            console.log("No message area difined.");
            return;
        }
        messagesArea.show();

        var elementList = $('ul#'+elementName, messagesArea);
        if (elementList.length == 0) {
            elementList = $('<ul id="'+elementName+'"></ul>').appendTo(messagesArea);
        }

        $.each(messages, function(idx, message) {
            elementList.append($('<li>'+elementName+': '+message+'</li>'))
        });
    }

    Forms.displayErrors = function(form, errors) {
        Forms.clearErrors(form);

        $.each(errors, function(idx, value) {
            Forms.displayElementErrorMessages(form, value.name, value.messages);
        });
    }

}( window.Forms = window.Forms || {}, jQuery ));

(function(Utils, $, undefined ) {
    Utils.all = function(a, func) {
        if (func === undefined) {
            func = function(x) { return x; };
        }

        var total = a.length;
        var calc = 0;

        $.each(a, function(idx, e) {
            if (func(e))
                calc++;
        });

        return total == calc;
    }
}( window.Utils = window.Utils || {}, jQuery ));


(function(Validators, $, undefined ) {
    Validators.isString = function(s) {
        return $.type(s) === 'string';
    }

    Validators.isNonEmptyString = function(s) {
        return Validators.isString(s) && s != "";
    }

    Validators.isInt = function(x) {
        var i;

        try {
            i = parseInt(x);
        }
        catch (e) {
            return false;
        }

        if ("" + i != "" + x) {
            return false;
        }

        return true;
    }
}( window.Validators = window.Validators || {}, jQuery ));
