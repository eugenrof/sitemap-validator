# Sitemap Link Validator

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-00C271?style=for-the-badge&logo=vercel)](https://sitemap-link-validator.vercel.app/)

## Overview

**Sitemap Link Validator** is a utility designed to automate the process of extracting endpoints from XML sitemaps and validating their HTTP response statuses in real time. The tool is designed to support the quality assurance phase of the software development lifecycle by ensuring that website content delivery paths remain accessible and functional.

---

## Structure

```text
SITEMAP-VALIDATOR/
├── images/
│ ├── favicon.png # Used for browser tab and logo
│ └── share-preview.png # Used for Open Graph/Social share meta tags
├── index.html # Main entry point (links to styles.css and script.js)
├── LICENSE # Project license file
├── README.md # Project documentation
├── script.js # Main application logic
└── style.css # Project stylesheet
```

---

## Key Features

- **Real-Time Validation**
  - Extracts URLs from XML sitemaps and validates their HTTP response codes.

- **Target Configuration**
  - Supports user-defined XML sitemap URLs for validation.

- **Operational Reporting**
  - Displays validation results in a centralized execution ledger, including:
    - `200` – Successful responses
    - `3xx` – Redirect responses
    - `4xx` – Client errors
    - `5xx` – Server errors

- **Export Capabilities**
  - Generates downloadable PDF reports based on scan results.

---

## Technical Overview

The application utilizes a split-pane layout that separates the sitemap configuration workspace from the execution and reporting interface.

Its architecture follows standard web automation practices, enabling efficient link auditing while eliminating the need for manual endpoint verification.

---

## Usage

1. Enter the URL of the target XML sitemap into the configuration field.
2. Select **Launch Scan** to begin validating all discovered endpoints.
3. Monitor the scan progress and review HTTP response statuses in the execution ledger.
4. Once the scan is complete, generate and download a PDF report containing the validation results.

---

## Documentation

For additional information or to view the source code, please refer to the project's GitHub repository.

---

## Project Status

This project is maintained for technical validation and automated link auditing purposes.

---

## License

# Sitemap Link Validator

## Overview

**Sitemap Link Validator** is a utility designed to automate the process of extracting endpoints from XML sitemaps and validating their HTTP response statuses in real time. The tool is designed to support the quality assurance phase of the software development lifecycle by ensuring that website content delivery paths remain accessible and functional.

---

## Key Features

- **Real-Time Validation**
  - Extracts URLs from XML sitemaps and validates their HTTP response codes.

- **Target Configuration**
  - Supports user-defined XML sitemap URLs for validation.

- **Operational Reporting**
  - Displays validation results in a centralized execution ledger, including:
    - `200` – Successful responses
    - `3xx` – Redirect responses
    - `4xx` – Client errors
    - `5xx` – Server errors

- **Export Capabilities**
  - Generates downloadable PDF reports based on scan results.

---

## Technical Overview

The application utilizes a split-pane layout that separates the sitemap configuration workspace from the execution and reporting interface.

Its architecture follows standard web automation practices, enabling efficient link auditing while eliminating the need for manual endpoint verification.

---

## Usage

1. Enter the URL of the target XML sitemap into the configuration field
2. Select **Launch Scan** to begin validating all discovered endpoints
3. Monitor the scan progress and review HTTP response statuses in the execution ledger
4. Once the scan is complete, generate and download a PDF report containing the validation results

---

## Documentation

For additional information or to view the source code, please refer to the project's GitHub repository.

---

## Project Status

This project is maintained for technical validation and automated link auditing purposes.

---

## License

This project was created by Eugen Rof and it is licensed under the terms of the license included in the repository. See the [LICENSE](LICENSE) file for details.
