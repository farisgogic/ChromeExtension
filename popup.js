document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginButton');
    const parseButton = document.getElementById('parseButton');
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessage = document.getElementById('welcome-message');

    loginButton.addEventListener('click', () => {
        getCodeVerifierAndChallenge().then(({ codeVerifier, codeChallenge }) => {
            const clientId = "8e266622-ecbb-4c10-9a44-16413b45f16f";
            const redirectUri = chrome.identity.getRedirectURL();
            const authority = "https://login.microsoftonline.com/683f310a-2d0a-463a-8652-e77fd54bb205";
            const responseType = "code";
            const scope = "openid profile offline_access";
            const authUrl = `${authority}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=${responseType}&redirect_uri=${redirectUri}&scope=${scope}&prompt=select_account&code_challenge=${codeChallenge}&code_challenge_method=S256`;

            chrome.identity.launchWebAuthFlow({
                url: authUrl,
                interactive: true
            }, function (redirect_url) {
                if (chrome.runtime.lastError || redirect_url.includes("error")) {
                    console.error("Error during auth flow:", chrome.runtime.lastError);
                } else {
                    const authorizationCode = extractAuthorizationCode(redirect_url);
                    console.log("Authorization Code:", authorizationCode);
                    chrome.runtime.sendMessage({ action: "exchangeToken", authorizationCode, codeVerifier });
                }
            });
        }).catch(error => {
            console.error("Error getting codeVerifier and codeChallenge:", error);
        });
    });

    logoutButton.addEventListener('click', function () {
        chrome.storage.local.remove(['accessToken', 'firstName', 'lastName'], function () {
            console.log("User logged out.");
            logoutButton.style.display = 'none';
            loginButton.style.display = 'block';
            parseButton.style.display = 'none';

            // Reset welcome message
            welcomeMessage.textContent = 'Parse Text Extension';

            // Reset parsed text if needed
            const parsedTextElement = document.getElementById('parsed-text');
            if (parsedTextElement) {
                parsedTextElement.remove();
            }
        });
    });

    parseButton.addEventListener('click', parsePlainText);

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "showWelcomeMessage") {
            displayWelcomeMessage(message.firstName, message.lastName);
            parseButton.style.display = 'block';
        }
    });

    chrome.storage.local.get(['accessToken', 'firstName', 'lastName'], function (data) {
        if (data.accessToken && data.firstName && data.lastName) {
            displayWelcomeMessage(data.firstName, data.lastName);
            parseButton.style.display = 'block';
        }
    });
});

function displayParsedText(plainText) {
    const parsedTextElement = document.createElement('div');
    parsedTextElement.id = 'parsed-text';
    parsedTextElement.style.whiteSpace = 'pre-wrap';
    parsedTextElement.style.textAlign = 'left';
    parsedTextElement.textContent = plainText;

    const welcomeMessage = document.getElementById('welcome-message');
    welcomeMessage.parentNode.insertBefore(parsedTextElement, welcomeMessage.nextSibling);
}

function displayWelcomeMessage(firstName, lastName) {
    const welcomeElement = document.getElementById('welcome-message');
    if (welcomeElement) {
        welcomeElement.textContent = `Welcome, ${firstName} ${lastName}!`;
        document.getElementById('logoutButton').style.display = 'block';
        document.getElementById('loginButton').style.display = 'none';
    }
}

function generateRandomString() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let randomString = '';
    for (let i = 0; i < 64; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        randomString += charset[randomIndex];
    }
    return randomString;
}

async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return hash;
}

async function base64UrlEncode(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function extractAuthorizationCode(redirect_url) {
    return redirect_url.split('?code=')[1].split('&')[0];
}

async function getCodeVerifierAndChallenge() {
    const codeVerifier = generateRandomString();
    const codeChallengeBuffer = await sha256(codeVerifier);
    const codeChallenge = await base64UrlEncode(codeChallengeBuffer);
    return { codeVerifier, codeChallenge };
}

function parsePlainText() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
                return document.body.innerText;
            }
        }, (results) => {
            if (!results || results.length === 0 || !results[0].result) {
                console.error("Error parsing plain text: No valid result found.");

                // Clear previously displayed text
                const parsedTextElement = document.getElementById('parsed-text');
                if (parsedTextElement) {
                    parsedTextElement.remove();
                }

                // Display error message
                const errorElement = document.createElement('div');
                errorElement.id = 'error-message';
                errorElement.textContent = "No valid result found on the current page.";
                const welcomeMessage = document.getElementById('welcome-message');
                welcomeMessage.parentNode.insertBefore(errorElement, welcomeMessage.nextSibling);

                return;
            }

            const plainText = results[0].result;
            console.log("Parsed Plain Text:", plainText);

            // Clear any previous error message
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.remove();
            }

            displayParsedText(plainText);
        });
    });
}