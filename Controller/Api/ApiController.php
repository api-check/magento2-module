<?php

namespace ApiCheck\AddressValidation\Controller\Api;

use ApiCheck\AddressValidation\Model\Config;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\Module\ModuleListInterface;
use Magento\Framework\Controller\Result\JsonFactory;

class ApiController
{
    protected $config;
    protected $scopeConfig;
    protected $moduleList;
    protected $apiHelper;
    protected $resultJsonFactory;

    public function __construct(
        Config $config,
        ScopeConfigInterface $scopeConfig,
        ModuleListInterface $moduleList,
        JsonFactory $resultJsonFactory
    ) {
        $this->config = $config;
        $this->scopeConfig = $scopeConfig;
        $this->moduleList = $moduleList;
        $this->resultJsonFactory = $resultJsonFactory;
    }

    /**
     * Execute the API call to fetch suggestions or addresses
     *
     * @param string $urlSuffix The URL suffix specific to the API endpoint
     * @param array $urlParams An associative array of URL parameters
     * @return string|bool
     */
    public function fetchApiData($urlSuffix, $urlParams)
    {
        $base_url = $this->config->getConstant('BASE_URL');
        $url = $base_url . $urlSuffix . '?' . http_build_query($urlParams);
        $curl = curl_init($url);

        // Create headers array
        $headers = [
            'X-Api-Key: ' . $this->getApiKey(),
            'X-Application-Info: magento2-' . $this->getModuleVersion(),
        ];

        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTPHEADER => $headers,
        ]);

        $response = curl_exec($curl);

        if ($response !== false) {
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            if ($httpCode === 200) {
                $decodedResponse = json_decode($response, true);
                return $decodedResponse;
            }
        }

        return false;
    }

    /**
     * Get the API key from configuration
     *
     * @return string|null
     */
    private function getApiKey()
    {
        return $this->scopeConfig->getValue('apicheck_addressvalidation/settings/api_key', \Magento\Store\Model\ScopeInterface::SCOPE_STORE);
    }

    /**
     * Get the module version
     *
     * @return string
     */
    private function getModuleVersion()
    {
        $moduleInfo = $this->moduleList->getOne('ApiCheck_AddressValidation');
        return $moduleInfo['setup_version'];
    }
}
