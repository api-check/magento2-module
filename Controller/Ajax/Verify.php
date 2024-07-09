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

class Verify extends Action implements HttpPostActionInterface
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

        switch ($input['action']) {
            case 'email':
                $response = $this->fetchValidateEmail($input);
                break;
            case 'phone':
                $response = $this->fetchValidatePhone($input);
                break;
            default:
                return $result->setData(['error' => true, 'message' => 'Invalid request type']);
        }

        return $result->setData($response);
    }

    /**
     * Execute the API call to validate email address
     *
     * @return array|bool
     */
    protected function fetchValidateEmail($input)
    {
        $urlSuffix = 'verify/v1/email/';
        $urlParams = [
            'email' => $input['email'],
        ];
        return $this->apiHelper->fetchApiData($urlSuffix, $urlParams);
    }

    /**
     * Execute the API call to validate email address
     *
     * @return array|bool
     */
    protected function fetchValidatePhone($input)
    {
        $urlSuffix = 'verify/v1/phone/';
        $urlParams = [
            'number' => $input['number'],
        ];
        return $this->apiHelper->fetchApiData($urlSuffix, $urlParams);
    }
}
