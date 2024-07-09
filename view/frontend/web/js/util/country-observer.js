define([
    'jquery',
    'uiRegistry'
], function ($, registry) {
    'use strict';

    return {
        observeCountrySelect(selector, group, paymentMethods, callback, onChangeCallback) {
            if (!paymentMethods.includes(group)) {
                paymentMethods.push(group);
                registry.async(`${selector}.country_id`)(countryField => {
                    // Initial callback with the current value
                    callback(countryField.value(), selector);

                    // Listen for changes
                    countryField.on('value', input => {
                        callback(input, selector);
                        if (typeof onChangeCallback === 'function') {
                            onChangeCallback(input);
                        }
                    });
                });
            }
        },

        observeCountrySelectPerPaymentMethod(componentPath, paymentMethods, callback, onChangeCallback) {
            $.when(this.getComponent(componentPath)).done(payments => {
                payments.elems.subscribe(newList => {
                    newList.forEach(paymentMethod => {
                        if (paymentMethod.item !== undefined && !paymentMethods.includes(paymentMethod.name)) {
                            const selector = `${componentPath}.${paymentMethod.index}-form.form-fields`;
                            this.observeCountrySelect(selector, paymentMethod.index, paymentMethods, callback, onChangeCallback);
                        }
                    });
                });
            });
        },

        getComponent(componentName) {
            const deferred = $.Deferred();
            registry.async(componentName)(component => {
                deferred.resolve(component);
            });
            return deferred.promise();
        }
    };
});
