
# ApiCheck Magento 2 Module

## Introduction
The ApiCheck Magento 2 module provides address validation functionality for Magento 2 stores. This module leverages ApiCheck's services to ensure accurate address information, improving the reliability and efficiency of your store's order processing.

## Installation

### Prerequisites
- Magento 2.3 or later
- Composer

### Installation via Composer
To install the ApiCheck module via Composer, follow these steps:

1. **Add the ApiCheck repository to your `composer.json`:**
   ```bash
   composer require api-check/magento2-module
   ```

2. **Update Magento 2 to load the new module:**
   ```bash
   bin/magento setup:upgrade
   bin/magento setup:di:compile
   bin/magento cache:flush
   bin/magento setup:static-content:deploy -f
   ```

## Configuration
After installation, you need to configure the ApiCheck module in your Magento 2 admin panel.

1. **Navigate to the ApiCheck configuration settings:**
   - Go to `Stores` > `Configuration` > `ApiCheck` > `Address Validation`.

2. **Enter your ApiCheck API key:**
   - If you do not have an API key, you can obtain one by signing up on the ApiCheck website.

3. **Configure additional settings:**
   - Adjust other settings as needed to suit your store's requirements.

## Usage
Once configured, the ApiCheck module will automatically validate addresses entered by your customers during checkout. Invalid addresses will prompt the user to correct them, ensuring accurate shipping information.

## Support
For any issues or questions regarding the ApiCheck module, please refer to the [ApiCheck support page](https://apicheck.com/support) or contact support via the Magento Marketplace.

## License
This module is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

---

Thank you for using the ApiCheck Magento 2 module. We hope it enhances the accuracy and efficiency of your store's operations!
