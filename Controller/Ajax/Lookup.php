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

class Lookup extends Action implements HttpPostActionInterface
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
            case 'lookup':
                $response = $this->fetchLookup($countryCode, $input);
                break;
            default:
                return $result->setData(['error' => true, 'message' => 'Invalid request type']);
        }

        return $result->setData($response);
    }

    /**
     * Execute the API call to fetch the lookup data
     *
     * @return array|bool
     */
    protected function fetchLookup($countryCode, $input)
    {
        $urlSuffix = 'lookup/v1/postalcode/' . $countryCode;
        $urlParams = [
            'postalcode' => $input['postalcode'],
            'number' => $input['number'],
        ];
        return $this->apiHelper->fetchApiData($urlSuffix, $urlParams);
    }
}
