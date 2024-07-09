define([
    'uiComponent',
    'jquery',
    'ko',
    'uiRegistry',
    'apicheck-config',
    'error-emitter',
    'country-observer'
], function (Component, $, ko, registry, config, ErrorEmitter, countryObserver) {
    'use strict';

    return Component.extend({
        defaults: {
            paymentMethods: ko.observableArray([]),
            countryCode: ko.observable(null)
        },

        initialize() {
            this._super();

            this.shippingSelector = 'checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset';
            this.subscribeToErrorEvent();

            // Observing without an onChangeCallback
            countryObserver.observeCountrySelect(
                this.shippingSelector,
                'shipping',
                this.paymentMethods(),
                this.handleCountryChange.bind(this)
            );

            countryObserver.observeCountrySelectPerPaymentMethod(
                'checkout.steps.billing-step.payment.payments-list',
                this.paymentMethods(),
                this.handleCountryChange.bind(this)
            );

            return this;
        },

        subscribeToErrorEvent() {
            ErrorEmitter.errorEvent.add(() => this.handleCountryChange(this.countryCode(), true));
        },

        getComponent(componentName) {
            const deferred = $.Deferred();
            registry.async(componentName)(component => {
                deferred.resolve(component);
            });

            return deferred.promise();
        },

        handleCountryChange(countryCode, selector, isFallback = false) {
            this.countryCode(countryCode);

            $.when(
                this.getComponent(`${selector}.noaddressfoundmessage`),
                this.getComponent(`${selector}.postcode`),
                this.getComponent(`${selector}.city`),
                this.getComponent(`${selector}.street.0`),
                this.getComponent(`${selector}.country_id`),
                this.getComponent(`${selector}.address-suggestion`),
                this.getComponent(`${selector}.number`),
            ).done((noaddressfoundmessage, postcodeField, cityField, streetFieldGroup, countryField, addressSuggestionField, houseNumberField) => {

                // Get the field elements by their UI component names
                const noaddressfoundmessageElement = $('div[name="' + noaddressfoundmessage.dataScope + '"]');
                const postcodeElement = $('div[name="' + postcodeField.dataScope + '"]');
                const cityElement = $('div[name="' + cityField.dataScope + '"]');
                const streetFieldset = $('div[name="' + streetFieldGroup.dataScope + '"]').closest('fieldset');
                const countryElement = $('div[name="' + countryField.dataScope + '"]');
                const addressSuggestionElement = $('div[name="' + addressSuggestionField.dataScope + '"]');
                const houseNumberFieldElement = $('div[name="' + houseNumberField.dataScope + '"]');

                if (config.LOOKUP_COUNTRIES.includes(countryCode.toLowerCase()) || isFallback) {
                    // Move no address found message after country
                    noaddressfoundmessageElement.insertAfter(countryElement);

                    // Move postcode after no address found message
                    postcodeElement.insertAfter(noaddressfoundmessageElement);

                    // Move number after postcode
                    houseNumberFieldElement.insertAfter(postcodeElement);

                    // Move street after number
                    streetFieldset.insertAfter(houseNumberFieldElement);

                    // Move city after street
                    cityElement.insertAfter(streetFieldset);

                    // Show postcode and city fields
                    postcodeField.visible(true);
                    cityField.visible(true);
                    addressSuggestionField.visible(false);
                    noaddressfoundmessage.visible(false);
                    if (isFallback) { // In case of fallback, keep the autocomplete field in place
                        // move autocomplete field after country
                        addressSuggestionElement.insertAfter(countryElement);
                    }
                } else if (config.AUTOCOMPLETE_COUNTRIES.includes(countryCode.toLowerCase()) || isFallback) {
                    // Move autocomplete field after country
                    addressSuggestionElement.insertAfter(countryElement);

                    // Move postcode after autocomplete field
                    postcodeElement.insertAfter(addressSuggestionElement);

                    // Move street after postcode
                    streetFieldset.insertAfter(postcodeElement);

                    // Move number after street
                    houseNumberFieldElement.insertAfter(streetFieldset);

                    // Move city after number
                    cityElement.insertAfter(houseNumberFieldElement);

                    // Hide postcode and city fields
                    postcodeField.visible(true);
                    cityField.visible(true);
                    addressSuggestionField.visible(true);
                    noaddressfoundmessage.visible(false);
                } else {
                    postcodeField.visible(true);
                    cityField.visible(true);
                    addressSuggestionField.visible(false);
                    noaddressfoundmessage.visible(false);
                }
            });
        }
    });
});
