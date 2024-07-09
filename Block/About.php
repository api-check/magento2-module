<?php

namespace ApiCheck\AddressValidation\Block;

class About extends \Magento\Config\Block\System\Config\Form\Field
{
    protected $_template = 'ApiCheck_AddressValidation::about.phtml';

    public function render(\Magento\Framework\Data\Form\Element\AbstractElement $element)
    {
        return $this->toHtml();
    }

    public function getImageUrl()
    {
        return $this->_assetRepo->getUrl("ApiCheck_AddressValidation::images/APICHECK.png");
    }
}
