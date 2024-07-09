<?php

namespace ApiCheck\AddressValidation\Block;

use Magento\Config\Block\System\Config\Form\Field;

class ApiKeyComment extends Field
{
    /**
     * Render field comment as HTML.
     *
     * @param \Magento\Framework\Data\Form\Element\AbstractElement $element
     * @return string
     */
    protected function _getElementHtml(\Magento\Framework\Data\Form\Element\AbstractElement $element)
    {
        $comment = $element->getComment();
        
        // Add an anchor tag to the comment
        $comment .= '<br/>Je kunt je API-key <a target="_blank" href="https://app.apicheck.nl/api-keys">hier</a> ophalen.';
        
        // Set the modified comment back to the element
        $element->setComment($comment);
        
        return parent::_getElementHtml($element);
    }
}
