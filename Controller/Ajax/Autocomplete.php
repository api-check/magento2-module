<?php

namespace ApiCheck\AddressValidation\Controller\Ajax;

use ApiCheck\AddressValidation\Controller\Api\ApiController;
use ApiCheck\AddressValidation\Model\Config;
use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Checkout\Model\Session as CheckoutSession;
use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\Module\ModuleListInterface;

class Autocomplete extends Action implements HttpPostActionInterface
{
    protected $resultJsonFactory;
    protected $checkoutSession;
    protected $config;
    protected $scopeConfig;
    protected $moduleList;
    protected $apiHelper;

    public function __construct(
        Context $context,
        JsonFactory $resultJsonFactory,
        CheckoutSession $checkoutSession,
        Config $config,
        ScopeConfigInterface $scopeConfig,
        ModuleListInterface $moduleList,
        ApiController $apiHelper
    ) {
        $this->resultJsonFactory = $resultJsonFactory;
        $this->checkoutSession = $checkoutSession;
        $this->config = $config;
        $this->scopeConfig = $scopeConfig;
        $this->moduleList = $moduleList;
        $this->apiHelper = $apiHelper;
        parent::__construct($context);
    }

    /**
     * Execute the API request to fetch suggestions based on input data.
     *
     * @return \Magento\Framework\Controller\Result\Json
     */
    public function execute()
    {
        $result = $this->resultJsonFactory->create();
        $rawData = $this->getRequest()->getContent();
        $input = json_decode($rawData, true);

        if (!isset($input['action'], $input['countryCode'])) {
            return $result->setData(['error' => true, 'message' => 'Invalid input data']);
        }

        $countryCode = $input['countryCode'];

        switch ($input['action']) {
            case 'global':
                $response = $this->fetchGlobalSuggestions($countryCode, $input);
                break;
            case 'address':
                $response = $this->fetchAddressSuggestions($countryCode, $input);
                break;
            case 'street':
                $response = $this->fetchStreetSuggestions($countryCode, $input);
                break;
            default:
                return $result->setData(['error' => true, 'message' => 'Invalid request type']);
        }

        return $result->setData($response);
    }

    /**
     * Execute the API call to fetch suggestions
     *
     * @return array|bool
     */
    protected function fetchGlobalSuggestions($countryCode, $input)
    {
        $urlSuffix = 'search/v1/global/' . $countryCode;
        $urlParams = [
            'query' => $input['query'],
        ];
        return $this->apiHelper->fetchApiData($urlSuffix, $urlParams);
    }

    /**
     * Execute the API call to fetch addresses
     *
     * @return array|bool
     */
    protected function fetchAddressSuggestions($countryCode, $input)
    {
        $urlSuffix = 'search/v1/address/' . $countryCode;
        $urlParams = [
            'street_id' => $input['street_id'],
            'postalcode_id' => $input['postalcode_id'],
        ];
        return $this->apiHelper->fetchApiData($urlSuffix, $urlParams);
    }

    /**
     * Execute the API call to fetch streets
     *
     * @return array|bool
     */
    protected function fetchStreetSuggestions($countryCode, $input)
    {
        $urlSuffix = 'search/v1/street/' . $countryCode . '?name=' . $input['name'] . '&city_id=' . $input['city_id'];
        $urlParams = [
            'name' => $input['name'] ?? '',
            'city_id' => $input['city_id']
        ];
        return $this->apiHelper->fetchApiData($urlSuffix, $urlParams);
    }
}
