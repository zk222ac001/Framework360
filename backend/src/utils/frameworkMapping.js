function getFrameworksFromSector(sector) {
  switch (sector) {
    case 'FINANCE':
    case 'BANKING':
    case 'INSURANCE':
      return ['DORA', 'GDPR', 'ISO27001'];

    case 'HEALTHCARE':
    case 'PHARMA':
      return ['NIS2', 'GDPR', 'ISO27001'];

    case 'UTILITIES':
    case 'WATER':
      return ['NIS2', 'ISO27001'];

    case 'TRANSPORT':
    case 'LOGISTICS':
      return ['NIS2', 'ISO27001'];

    case 'IT':
    case 'TELECOM':
    case 'DIGITAL_INFRASTRUCTURE':
    case 'CLOUD':
      return ['NIS2', 'GDPR', 'ISO27001', 'SOC2'];

    case 'PUBLIC':
    case 'GOVERNMENT':
    case 'MUNICIPAL':
      return ['NIS2', 'GDPR', 'ISO27001'];

    case 'EDUCATION':
      return ['GDPR', 'ISO27001'];

    case 'RETAIL':
    case 'ECOMMERCE':
      return ['GDPR', 'ISO27001'];

    case 'MANUFACTURING':
    case 'INDUSTRIAL':
      return ['ISO27001'];

    case 'MEDIA':
      return ['GDPR'];

    case 'FOOD':
      return ['ISO27001'];

    default:
      return ['GDPR', 'ISO27001'];
  }
}

module.exports = { getFrameworksFromSector };