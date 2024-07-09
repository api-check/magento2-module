<?php

namespace ApiCheck\AddressValidation\Model;

class Config
{
    private $constants;

    public function __construct()
    {
        $this->constants = json_decode(file_get_contents(__DIR__ . '/../view/base/web/js/constants.json'), true);
    }

    public function getConstant($name)
    {
        return $this->constants[$name] ?? null;
    }
}
