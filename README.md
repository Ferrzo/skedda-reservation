# Skedda Puppeteer Automation

This project automates the booking process on the Skedda platform using Puppeteer.

## Prerequisites

- Node.js
- npm (Node Package Manager)

## Setup

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd skedda-puppeteer
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add the following environment variables:
    ```env
    DOMAIN=actumdigital.skedda.com
    VERIFICATION_VALUE=<your_verification_cookie_value>
    APPLICATION_VALUE=<your_application_cookie_value>
    ```

## Running the Script

To run the script, use the following command:
```sh
node index.js
```

## Debugging

To debug the script using Visual Studio Code:

1. Open the project in Visual Studio Code.
2. Set breakpoints in the `index.ts` file.
3. Press `F5` to start debugging.

## License

This project is licensed under the MIT License.
