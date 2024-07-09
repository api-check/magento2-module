<?php

namespace ApiCheck\AddressValidation\CustomerData;

use Magento\Customer\CustomerData\SectionSourceInterface;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Store\Model\ScopeInterface;

class AddressValidationConfig implements SectionSourceInterface
{
    protected $scopeConfig;

    const XML_PATH_ENABLE = 'apicheck_addressvalidation_section/addressvalidation_settings/enable_addressvalidation';

    public function __construct(ScopeConfigInterface $scopeConfig) {
        $this->scopeConfig = $scopeConfig;
    }

    public function getSectionData()
    {
        return [
            'enable_addressvalidation' => $this->scopeConfig->isSetFlag(
                self::XML_PATH_ENABLE,
                ScopeInterface::SCOPE_STORE
            )
        ];
    }
}
