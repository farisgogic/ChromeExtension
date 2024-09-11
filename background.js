
function decodeJwtToken(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(base64));
        return decoded;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

function exchangeAuthorizationCodeForToken(authorizationCode, codeVerifier) {
    const tokenEndpoint = "https://login.microsoftonline.com/683f310a-2d0a-463a-8652-e77fd54bb205/oauth2/v2.0/token";
    const clientId = "8e266622-ecbb-4c10-9a44-16413b45f16f";
    const redirectUri = chrome.identity.getRedirectURL();
    const scope = "openid profile offline_access";

    const params = new URLSearchParams({
        client_id: clientId,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: redirectUri,
        scope: scope
    });

    fetch(tokenEndpoint, {
        method: 'POST',
        body: params,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log("Token Exchange Response:", data);

            const decodedToken = decodeJwtToken(data.access_token);
            if (decodedToken) {
                const fullName = decodedToken.name || "Unknown User";
                const [firstName, lastName] = fullName.split(' ');

                console.log("First Name:", firstName);
                console.log("Last Name:", lastName);

                chrome.storage.local.set({
                    'accessToken': data.access_token,
                    'firstName': firstName,
                    'lastName': lastName,
                }, () => {
                    chrome.runtime.sendMessage({ action: "showWelcomeMessage", firstName, lastName });
                });
            } else {
                console.error("Unable to decode token or token doesn't contain name information.");
            }
        })
        .catch(error => console.error("Error exchanging authorization code for token:", error));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "exchangeToken") {
        exchangeAuthorizationCodeForToken(request.authorizationCode, request.codeVerifier);
    }
});