<?php

namespace ApiCheck\AddressValidation\Plugin\Model\Checkout;

use ApiCheck\AddressValidation\Model\Config;
use Magento\Checkout\Block\Checkout\LayoutProcessor;
use Magento\Checkout\Model\Session as CheckoutSession;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Store\Model\ScopeInterface;

class LayoutProcessorPlugin
{
    /**
     * @var CheckoutSession
     */
    protected $checkoutSession;

    /**
     * @var ScopeConfigInterface
     */
    private $scopeConfig;

    /**
     * @var Config
     */
    protected $config;

    /**
     * Constructor
     *
     * @param CheckoutSession $checkoutSession
     */
    public function __construct(
        CheckoutSession $checkoutSession,
        ScopeConfigInterface $scopeConfig,
        Config $config
    ) {
        $this->checkoutSession = $checkoutSession;
        $this->scopeConfig = $scopeConfig;
        $this->config = $config;
    }

    /**
     * After Process Plugin for LayoutProcessor
     *
     * @param LayoutProcessor $subject
     * @param array $jsLayout
     * @return array
     */
    public function afterProcess(LayoutProcessor $subject, array $jsLayout)
    {
        if ($this->shouldModifyLayout() === false) {
            return $jsLayout;
        }

        // Get the quote
        $quote = $this->checkoutSession->getQuote();

        // Get the shipping address
        $shippingAddress = $quote->getShippingAddress();
        $shippingAddressCountry = $shippingAddress->getCountryId();

        // use shipping address country if set, otherwise use default country
        $countryId = strtolower($shippingAddressCountry ? $shippingAddressCountry : $this->getDefaultCountry());

        $autoCompleteCountries = $this->config->getConstant('AUTOCOMPLETE_COUNTRIES');

        $configuration = $jsLayout['components']['checkout']['children']['steps']['children']['billing-step']['children']['payment']['children']['payments-list']['children'];

        foreach ($configuration as $paymentGroup => $groupConfig) {
            if (isset($groupConfig['component']) and $groupConfig['component'] === 'Magento_Checkout/js/view/billing-address') {

                $scope = &$jsLayout['components']['checkout']['children']['steps']['children']['billing-step']['children']['payment']['children']['payments-list']['children'][$paymentGroup]['dataScopePrefix'];
                $fields = &$jsLayout['components']['checkout']['children']['steps']['children']['billing-step']['children']['payment']['children']['payments-list']['children'][$paymentGroup]['children']['form-fields']['children'];

                $fields['noaddressfoundmessage'] = [
                    'component' => 'Magento_Ui/js/form/element/abstract',
                    'config' => [
                        'customScope' => $scope,
                        'template' => 'ui/form/field',
                        'elementTmpl' => 'ApiCheck_AddressValidation/form/element/noaddressfoundmessage',
                        'visible' => false,
                    ],
                    'additionalClasses' => 'noaddressfoundmessage',
                    'dataScope' => $scope . '.noaddressfoundmessage',
                    'provider' => 'checkoutProvider',
                    'sortOrder' => 71
                ];

                $fields = $this->hideRegionField($fields);

                $fields['address-suggestion'] = [
                    'component' => 'address-suggestion',
                    'config' => [
                        'customScope' => $scope,
                        'elementTmpl' => 'ApiCheck_AddressValidation/form/element/address-suggestion',
                        'template' => 'ui/form/field',
                        'visible' => in_array($countryId, $autoCompleteCountries)
                    ],
                    'dataScope' => $scope . '.address_suggestion',
                    'label' => 'Address Suggestion',
                    'provider' => 'checkoutProvider',
                    'sortOrder' => 82,
                    'validation' => [
                        'required-entry' => false
                    ],
                ];

                $fields['number'] = [
                    'component' => 'Magento_Ui/js/form/element/abstract',
                    'config' => [
                        'customScope' => $scope,
                        'template' => 'ui/form/field',
                        'elementTmpl' => 'ui/form/element/input',
                    ],
                    'dataScope' => $scope . '.number',
                    'label' => 'House Number',
                    'provider' => 'checkoutProvider',
                    'visible' => true,
                    'sortOrder' => 84,
                    'validation' => [
                        'required-entry' => false
                    ],
                ];

                $fields['country_id']['sortOrder'] = 70;
                $fields['street']['sortOrder'] = 80;

                // set visible if in AUTOCOMPLETE_COUNTRIES array
                $fields['street']['config']['visible'] = in_array($countryId, $autoCompleteCountries);

                // For other countries, set the sortOrder to default
                $fields['street']['sortOrder'] = 110;
                $fields['postcode']['sortOrder'] = 83;
            }
        }

        // Check if the shipping address fields are set in the layout
        if (isset($jsLayout['components']['checkout']['children']['steps']['children']['shipping-step']['children']['shippingAddress']['children']['shipping-address-fieldset']['children'])) {
            $fields = &$jsLayout['components']['checkout']['children']['steps']['children']['shipping-step']['children']['shippingAddress']['children']['shipping-address-fieldset']['children'];
            $scope = 'shippingAddress';
            $fields = $this->hideRegionField($fields);

            $fields['noaddressfoundmessage'] = [
                'component' => 'Magento_Ui/js/form/element/abstract',
                'config' => [
                    'customScope' => $scope,
                    'template' => 'ui/form/field',
                    'elementTmpl' => 'ApiCheck_AddressValidation/form/element/noaddressfoundmessage',
                    'visible' => false,
                ],
                'additionalClasses' => 'noaddressfoundmessage',
                'dataScope' => $scope . '.noaddressfoundmessage',
                'provider' => 'checkoutProvider',
                'sortOrder' => 71
            ];

            $fields['address-control'] = [
                'component' => 'field-control',
                'provider' => 'checkoutProvider',
                'sortOrder' => 81,
            ];

            $fields['address-suggestion'] = [
                'component' => 'address-suggestion',
                'config' => [
                    'customScope' => 'shippingAddress',
                    'elementTmpl' => 'ApiCheck_AddressValidation/form/element/address-suggestion',
                    'template' => 'ui/form/field',
                    'visible' => in_array($countryId, $autoCompleteCountries)
                ],
                'dataScope' => 'shippingAddress.address_suggestion',
                'label' => 'Address Suggestion',
                'provider' => 'checkoutProvider',
                'sortOrder' => 82,
                'validation' => [
                    'required-entry' => false
                ],
            ];

            $fields['postcode']['sortOrder'] = 83;
            $fields['postcode']['component'] = 'address-lookup';

            $fields['number'] = [
                'component' => 'Magento_Ui/js/form/element/abstract',
                'config' => [
                    'customScope' => 'shippingAddress',
                    'template' => 'ui/form/field',
                    'elementTmpl' => 'ui/form/element/input',
                ],
                'dataScope' => 'shippingAddress.number',
                'label' => 'House Number',
                'provider' => 'checkoutProvider',
                'visible' => true,
                'sortOrder' => 84,
                'validation' => [
                    'required-entry' => false
                ],
            ];

            $fields['country_id']['sortOrder'] = 70;
            $fields['street']['sortOrder'] = 80;

            $fields['address-suggestion']['config']['visible'] = in_array($countryId, $autoCompleteCountries);

            // set visible if in AUTOCOMPLETE_COUNTRIES array
            $fields['street']['config']['visible'] = in_array($countryId, $autoCompleteCountries);

            // For other countries, set the sortOrder to default
            $fields['street']['sortOrder'] = 110;
            $fields['postcode']['sortOrder'] = 83;
        }

        return $jsLayout;
    }

    private function hideRegionField(&$fields)
    {
        unset($fields['region_id']);
        unset($fields['region']);

        return $fields;
    }

    private function getDefaultCountry()
    {
        return $this->scopeConfig->getValue(
            'general/country/default',
            ScopeInterface::SCOPE_STORE
        );
    }

    private function shouldModifyLayout()
    {
        $apiCheckEnabled = $this->scopeConfig->getValue(
            'apicheck_addressvalidation/settings/enable_api_check',
            ScopeInterface::SCOPE_STORE
        );

        $addressValidationEnabled = $this->scopeConfig->getValue(
            'apicheck_addressvalidation_section/addressvalidation_settings/enable_addressvalidation',
            ScopeInterface::SCOPE_STORE
        );

        return $apiCheckEnabled === '1' && $addressValidationEnabled === '1';
    }
}
