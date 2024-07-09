define([
    'Magento_Ui/js/form/element/abstract',
    'ko',
    'mage/storage',
    'mage/url',
    'apicheck-config',
    'error-emitter',
    'jquery',
    'underscore',
    'uiRegistry'
], function (Abstract, ko, storage, urlBuilder, config, ErrorEmitter, $, _, registry) {
    'use strict';

    return Abstract.extend({
        defaults: {
            selectedPostalcode: ko.observable(''),
            selectedNumber: ko.observable(''),
            storedRequestData: ko.observable(''),
            paymentMethods: ko.observableArray([]),
            scopeName: ko.observable(''),
        },

        initialize() {
            this._super();

            this.shippingSelector = 'checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset';

            this.observePostalcodeSelectPerPaymentMethod('checkout.steps.billing-step.payment.payments-list', this.paymentMethods());
            this.observeNumberSelectPerPaymentMethod('checkout.steps.billing-step.payment.payments-list', this.paymentMethods());

            // Shipping form observers
            this.observePostalcodeSelect(this.shippingSelector, 'shipping.postcode');
            this.observeNumberSelect(this.shippingSelector, 'shipping.number');

            this.fetchData = _.debounce(this.fetchData.bind(this), config.DEBOUNCE_DELAY);

            return this;
        },

        observePostalcodeSelectPerPaymentMethod(componentPath, paymentMethods) {
            $.when(this.getComponent(componentPath)).done(payments => {
                payments.elems.subscribe(newList => {
                    newList.forEach(paymentMethod => {
                        if (paymentMethod.item !== undefined && !paymentMethods.includes(paymentMethod.name + 'postcode')) {
                            const selector = `${componentPath}.${paymentMethod.index}-form.form-fields`;
                            this.observePostalcodeSelect(selector, paymentMethod.index);
                        }
                    });
                });
            });
        },

        observeNumberSelectPerPaymentMethod(componentPath, paymentMethods) {
            $.when(this.getComponent(componentPath)).done(payments => {
                payments.elems.subscribe(newList => {
                    newList.forEach(paymentMethod => {
                        if (paymentMethod.item !== undefined && !paymentMethods.includes(paymentMethod.name + 'number')) {
                            const selector = `${componentPath}.${paymentMethod.index}-form.form-fields`;
                            this.observeNumberSelect(selector, paymentMethod.index);
                        }
                    });
                });
            });
        },

        observePostalcodeSelect(selector, group) {
            if (!this.paymentMethods().includes(group + 'postcode')) {
                this.paymentMethods.push(group);
                registry.async(`${selector}.postcode`)(postalCodeField => {
                    postalCodeField.on('value', postalCode => {
                        this.selectedPostalcode(postalCode);
                        const houseNumber = this.selectedNumber();
                        const customScope = postalCodeField.customScope;
                        const scopeName = postalCodeField.parentName;
                        const countryCode = $('div[name="' + customScope + '.country_id"] select').val();

                        this.scopeName(scopeName);

                        if (countryCode && config.LOOKUP_COUNTRIES.includes(countryCode.toLowerCase()) === true) {
                            this.fetchData(postalCode, houseNumber, countryCode, selector);
                        }
                    });
                });
            }
        },

        observeNumberSelect(selector, group) {
            if (!this.paymentMethods().includes(group + 'number')) {
                registry.async(`${selector}.number`)(numberField => {
                    numberField.on('value', houseNumber => {
                        this.selectedNumber(houseNumber);
                        const postalCode = this.selectedPostalcode();
                        const customScope = numberField.customScope;
                        const scopeName = numberField.parentName;
                        const countryCode = $('div[name="' + customScope + '.country_id"] select').val();

                        this.scopeName(scopeName);
                        if (countryCode && config.LOOKUP_COUNTRIES.includes(countryCode.toLowerCase()) === true) {
                            this.fetchData(postalCode, houseNumber, countryCode, selector);
                        }
                    });
                });
            }
        },

        clearFields() {
            const parentContainer = registry.get(this.containers[0]); // containers 0 is incorrect
            if (parentContainer) {
                parentContainer._elems.forEach(elem => {
                    if (elem && typeof elem === 'object') {
                        if (elem.name.includes('street') && elem._elems && elem._elems[0]) {
                            this.updateElementValue(elem._elems[0], 'street', '');
                        } else {
                            this.updateElementValue(elem, 'number', '');
                            this.updateElementValue(elem, 'numberAddition', '');
                            this.updateElementValue(elem, 'postcode', '');
                            this.updateElementValue(elem, 'city', '');
                        }
                    }
                });
            }
        },

        fillFields(suggestion) {
            if (_.isEmpty(suggestion)) {
                return;
            }

            registry.async(this.scopeName())(parentContainer => {
                parentContainer._elems.forEach(elem => {
                    if (elem && typeof elem === 'object') {
                        if (elem.name.includes('street') && elem._elems && elem._elems[0]) {
                            this.updateElementValue(elem._elems[0], 'street', `${suggestion.street} ${suggestion.number}`);
                        } else {
                            this.updateElementValue(elem, 'city', suggestion.city);
                            this.updateElementValue(elem, 'postcode', suggestion.postalcode);
                        }
                    }
                });
            });
        },

        updateElementValue(elem, field, value) {
            if (elem.name && elem.name.includes(field) && elem.value) {
                elem.value(value);
            }
        },

        fetchData(postalCode, houseNumber, countryCode, selector) {
            const currentRequestData = `${postalCode}${houseNumber}${countryCode}`;

            // Prevent empty requests
            if (postalCode === '' || houseNumber === '' || countryCode === '') {
                return;
            }

            // Prevent duplicate requests
            if (currentRequestData !== this.storedRequestData()) {
                this.storedRequestData(currentRequestData);
                const url = urlBuilder.build('addressvalidation/ajax/lookup');
                const payload = JSON.stringify({ countryCode: countryCode, postalcode: postalCode, number: houseNumber, action: 'lookup' });

                storage.post(url, payload, false, 'application/json')
                    .done(response => this.handleSuccess(response, selector))
                    .fail(response => this.handleError(response));
            }
        },

        handleSuccess(response, selector) {
            const resultData = response.data ? response.data : {};

            this.hideError(selector);
            if (_.isEmpty(resultData)) {
                const errorMessage = 'Er is geen adres gevonden met deze gegevens. Vul handmatig het juiste adres in.';
                this.displayError(errorMessage, selector);
                return;
            }

            this.fillFields(resultData);
        },

        handleError(response) {
            console.error('Error occurred:', response);
            ErrorEmitter.emitError(response);
        },

        getComponent(componentName) {
            let deferred = $.Deferred();
            registry.async(componentName)(component => {
                deferred.resolve(component);
            });

            return deferred.promise();
        },

        displayError(message, selector) {
            $.when(this.getComponent(`${selector}.noaddressfoundmessage`)).done(noaddressfoundmessage => {
                const noaddressfoundmessageElement = $('div[name="' + noaddressfoundmessage.dataScope + '"]');
                noaddressfoundmessageElement.find('span').html(message);
                noaddressfoundmessage.visible(true);
            });
        },

        hideError(selector) {
            $.when(this.getComponent(`${selector}.noaddressfoundmessage`)).done(noaddressfoundmessage => {
                const noaddressfoundmessageElement = $('div[name="' + noaddressfoundmessage.dataScope + '"]');
                noaddressfoundmessageElement.find('span').html('');
                noaddressfoundmessage.visible(false);
            });
        }
    });
});