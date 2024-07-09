define(['jquery', 'ko'], function ($, ko) {
    let errorEvent = $.Callbacks();

    return {
        errorEvent,

        emitError: function () {
            errorEvent.fire();
        }
    };
});
