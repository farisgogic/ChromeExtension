# Chrome Extension for Plain Text Parsing

## Overview

This project is a Google Chrome extension that extracts and displays plain text from web pages by removing JavaScript, advertisements, and images. It aims to improve readability and provide a clean, distraction-free experience for users by showing content in a side panel.

## Features
- **User Authentication via O365 (Office 365)**  
  Users must authenticate through Microsoft Office 365 to use the extension.

- **Content Parsing**  
  The extension extracts plain text from web pages, filtering out:
  - JavaScript
  - Advertisements
  - Images

- **Simple Side Panel Display:**  
  The parsed plain text is shown in a side panel, allowing users to view the clean content alongside the original page.

## Installation

1. Clone this repository:

   ```
    git clone https://github.com/farisgogic/ChromeExtension.git
   ```

2. Open Google Chrome and navigate to chrome://extensions/.
3. Enable Developer Mode (toggle in the top-right corner).
4. Click Load unpacked and select the folder where the extension files are located.

## Usage 
1. After installation, log in using your O365 credentials.
2. Navigate to any webpage.
3. The extension will automatically parse the page and display the plain text in a side panel, excluding JavaScript, advertisements, and images.
