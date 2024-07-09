define([
    'Magento_Ui/js/form/element/abstract',
    'ko',
    'mage/storage',
    'mage/url',
    'apicheck-config',
    'error-emitter',
    'jquery',
    'underscore',
    'uiRegistry',
    'country-observer'
], function (Abstract, ko, storage, urlBuilder, config, ErrorEmitter, $, _, registry, countryObserver) {
    'use strict';

    return Abstract.extend({
        defaults: {
            suggestions: ko.observableArray([]),
            hasInput: ko.observable(false),
            selectedStreet: ko.observable(''),
            selectedNumber: ko.observable(''),
            selectedNumberAddition: ko.observable(''),
            selectedPostalcode: ko.observable(''),
            selectedCity: ko.observable(''),
            selectedCountry: ko.observable(''),
            inputFieldValue: ko.observable(''),
            paymentMethods: ko.observableArray([]),
            scopeName: ko.observable('')
        },

        initialize() {
            this._super();

            this.shippingSelector = 'checkout.steps.shipping-step.shippingAddress.shipping-address-fieldset';
            this.handleInput = _.debounce(this.handleInput.bind(this), config.DEBOUNCE_DELAY);
            this.isSelectedStreetEmpty = ko.pureComputed(() => Object.keys(this.selectedStreet()).length === 0);

            this.hasSuggestions = ko.computed(() => {
                const suggestion = this.suggestions();
                // Check if there are any suggestions available in any of the categories
                return this.hasInput() && suggestion &&
                    ((Array.isArray(suggestion.Streets) && suggestion.Streets.length > 0) ||
                        (Array.isArray(suggestion.Cities) && suggestion.Cities.length > 0) ||
                        (Array.isArray(suggestion.Residences) && suggestion.Residences.length > 0));
            }),

            this.value.subscribe(newValue => {
                this.hasInput(newValue && newValue.trim().length > 0);
            });

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

        handleCountryChange(countryCode, selector) {
            this.selectedCountry(countryCode);
            this.clearSearch();
        },

        clearSearch() {
            this.hasInput(false);
            this.suggestions([]);
            this.selectedStreet('');
            this.selectedNumber('');
            this.selectedNumberAddition('');
            this.selectedPostalcode('');
            this.selectedCity('');
            $('.address-suggestion-container > input:visible').val(''); // Clear the input field

            const parentContainer = registry.get(this.containers[0]);
            this.clearFields(parentContainer);
        },

        clearFields(parentContainer) {
            if (parentContainer === undefined) {
                return;
            }

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
        },

        selectStreetSuggestion(suggestionJson) {
            const suggestion = JSON.parse(suggestionJson);
            this.selectedStreet(suggestion.data.street);
            this.selectedCity(suggestion.data.city);
            this.selectedPostalcode(suggestion.data.postalcode);

            const street_id = parseInt(suggestion.data.street_id);
            const postalcode_id = parseInt(suggestion.data.postalcode_id);
            const countryCode = $('[name="country_id"]:visible').val();
            const payload = JSON.stringify({ action: 'address', countryCode, postalcode_id, street_id });

            this.suggestions([]);
            this.fetchAddress(payload);
        },

        formatStreetSuggestion(suggestion) {
            return {
                text: `${suggestion.name}, ${suggestion.City.name}, ${suggestion.Postalcode.name}`,
                jsonData: JSON.stringify({
                    type: 'street',
                    data: {
                        street: suggestion.name,
                        street_id: suggestion.street_id,
                        city: suggestion.City.name,
                        city_id: suggestion.City.city_id,
                        postalcode: suggestion.Postalcode.name,
                        postalcode_id: suggestion.Postalcode.postalcode_id
                    }
                })
            };
        },

        formatCityStreetSuggestion(suggestion) {
            return {
                text: `${suggestion.City.name}, ${suggestion.name}`,
                jsonData: JSON.stringify({
                    type: 'street',
                    data: {
                        street: suggestion.name,
                        street_id: suggestion.street_id,
                        city: suggestion.City.name,
                        city_id: suggestion.City.city_id
                    }
                })
            };
        },

        selectCitySuggestion(suggestionJson) {
            const suggestion = JSON.parse(suggestionJson);

            this.selectedCity(suggestion.data.city);

            const input = $('.address-suggestion-container > input')
            input.val(`${suggestion.data.city}, `);

            const countryCode = $('[name="country_id"]:visible').val();

            const name = input.val().split(',').pop().trim();
            const payload = { action: 'street', countryCode };
            payload.city_id = this.selectedCity();
            payload.name = name;

            this.suggestions([]);

            input.focus();

            // Fetch streets based on the selected city
            this.fetchStreet(payload);
        },

        selectAddressSuggestion(suggestionJson) {
            const suggestion = JSON.parse(suggestionJson);
            const countryCode = $('[name="country_id"]:visible').val();
            const suggestionText = `${suggestion.data.street} ${suggestion.data.number}${suggestion.data.numberAddition}, ${suggestion.data.postalcode} ${suggestion.data.city}, ${countryCode}`;

            this.scopeName(this.parentName);
            this.selectedStreet(suggestion.data.street);
            this.selectedNumber(suggestion.data.number);
            this.selectedNumberAddition(suggestion.data.numberAddition);
            this.selectedPostalcode(suggestion.data.postalcode);
            this.selectedCity(suggestion.data.city);
            this.fillFields(suggestion);

            $('.address-suggestion-container > input').val(suggestionText);
        },

        fillFields(suggestion) {
            if (_.isEmpty(suggestion)) {
                return;
            }

            registry.async(this.scopeName())(parentContainer => {
                parentContainer._elems.forEach(elem => {
                    if (elem && typeof elem === 'object') {
                        if (elem.name.includes('street') && elem._elems && elem._elems[0]) {
                            this.updateElementValue(elem._elems[0], 'street', `${suggestion.data.street} ${suggestion.data.number}`);
                        } else {
                            this.updateElementValue(elem, 'number', suggestion.data.number);
                            this.updateElementValue(elem, 'numberAddition', suggestion.data.numberAddition);
                            this.updateElementValue(elem, 'postcode', suggestion.data.postalcode);
                            this.updateElementValue(elem, 'city', suggestion.data.city);
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

        formatAddressSuggestion(suggestion) {
            return {
                text: `${suggestion.city}, ${suggestion.street} ${suggestion.number}`,
                jsonData: JSON.stringify({
                    type: 'street',
                    data: {
                        street: suggestion.street,
                        street_id: suggestion.street_id,
                        city: suggestion.city,
                        city_id: suggestion.city_id,
                        postalcode: suggestion.postalcode,
                        postalcode_id: suggestion.postalcode_id,
                        number: suggestion.number,
                        numberAddition: suggestion.numberAddition || ''
                    }
                })
            };
        },

        formatCitySuggestion(suggestion) {
            return {
                text: `${suggestion.name}`,
                jsonData: JSON.stringify({
                    type: 'city',
                    data: {
                        city: suggestion.name,
                        city_id: suggestion.city_id,
                        name: suggestion.name ?? ''
                    }
                })
            };
        },

        handleInput(data, event) {
            const input = event.target.value.trim();
            const countryCode = $('[name="country_id"]:visible').val();
            const payload = { action: 'global', query: input, countryCode };

            if (!input) {
                this.clearSearch();
            }

            this.hasInput(!!input); // show suggestions if input is not empty

            // if city is selected, call fetchStreet
            if (this.selectedCity()) {
                const name = input.split(',').pop().trim();

                payload.action = 'street';
                payload.city_id = this.selectedCity();
                payload.name = name;

                this.fetchStreet(JSON.stringify(payload));
            } else {
                this.fetchGlobal(JSON.stringify(payload));
            }
        },

        fetchGlobal(payload) {
            this.fetchData(payload)
                .done(response => {
                    const Streets = (response.data) ? response.data.Results.Streets.map(this.formatStreetSuggestion.bind(this)) : [];
                    const Cities = (response.data) ? response.data.Results.Cities.map(this.formatCitySuggestion.bind(this)) : [];
                    const Residences = response.data ? response.data.Results.Residences.map(this.formatAddressSuggestion.bind(this)) : [];

                    this.suggestions({ Streets, Cities, Residences });
                }).fail(response => {
                    ErrorEmitter.emitError(response);
                    this.suggestions([]);
                });
        },

        fetchStreet(payload) {
            this.fetchData(payload)
                .done(response => {
                    const Streets = response.data ? response.data.Results.map(this.formatCityStreetSuggestion.bind(this)) : [];
                    this.suggestions({ Streets });
                }).fail(response => {
                    ErrorEmitter.emitError(response);
                    this.suggestions([]);
                });
        },

        fetchAddress(payload) {
            this.fetchData(payload)
                .done(response => {
                    const Residences = response.data ? response.data.Results.map(this.formatAddressSuggestion.bind(this)) : [];
                    this.suggestions({ Residences });
                }).fail(response => {
                    ErrorEmitter.emitError(response);
                    this.suggestions([]);
                });
        },

        fetchData(payload) {
            const url = urlBuilder.build('addressvalidation/ajax/autocomplete');
            return storage.post(
                url,
                payload,
                false,
                'application/json'
            );
        }
    });
});