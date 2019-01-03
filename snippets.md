> This is a markdown file showing the code snippets to include in the blogpost for the PKCE grant in the browser.

## Start the login with a redirection

This is the logic needed for triggering the login process:

```javascript
document.getElementById('login').addEventListener('click', (e) => {
  e.preventDefault();

  const config = await getConfig();
  const state = randomString(32);
  const codeVerifier = randomString(32);
  const codeChallenge = await sha256(codeVerifier).then(bufferToBase64UrlEncoded);

  // we need to store the state to validate the callback
  // and also the code verifier to send later
  sessionStorage.setItem(`login-code-verifier-${state}`, codeVerifier);

  const authorizationEndpointUrl = new URL(config.authorization_endpoint);

  // here we encode the authorization request
  authorizationEndpointUrl.search = new URLSearchParams({
    audience: API_AUDIENCE,
    redirect_uri: REDIRECT_URI,
    client_id: AUTH0_CLIENT_ID,
    response_type: 'code',
    scope: 'openid profile email read:appointments',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state
  });

  window.location.assign(authorizationEndpointUrl);
});
```

## Handle the callback of a redirection

To handle the callback we need to do this:

```javascript
async function handleCallback() {
  const search = new URLSearchParams(window.location.search);
  if(!search.has('code')) { return; }
  const code = search.get('code');
  const state = search.get('state');
  const code_verifier = sessionStorage.getItem(`login-code-verifier-${state}`);

  if (!code_verifier) {
    console.error('unexpected state parameter');
    return;
  }

  sessionStorage.has
  const config = await getConfig();

  // exchange the authorization code for a tokenset
  const tokenSet = await fetch(config.token_endpoint, {
    method: 'POST',
    body: new URLSearchParams({
      audience: API_AUDIENCE,
      client_id: AUTH0_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier,
      code,
    }),
    headers: new Headers({
      'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
    })
  }).then(r => r.json());

  //this has access_token, id_token, expires_in, scope, token_type.
  console.dir(tokenSet);

  window.tokenSet = tokenSet;
  window.verifier = code_verifier

  //remove the querystring from the url in the address bar
  const url = new URL(window.location);
  url.search = '';
  window.history.pushState('', document.title, url);
}
```
## Get a token silently

To get a token silently:

```javascript
refreshBtn.addEventListener('click', async function(event) {
  event.preventDefault();
  const config = await getConfig();

  const state = randomString(32);
  const codeVerifier = randomString(32);
  const codeChallenge = await sha256(codeVerifier).then(bufferToBase64UrlEncoded);
  const authorizationEndpointUrl = new URL(config.authorization_endpoint);

  // here we encode the authorization request
  authorizationEndpointUrl.search = new URLSearchParams({
    audience: API_AUDIENCE,
    redirect_uri: REDIRECT_URI,
    client_id: AUTH0_CLIENT_ID,
    response_type: 'code',
    response_mode: 'web_message',
    prompt: 'none',
    scope: 'openid profile email read:appointments',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state
  });

  //load the url in an iframe and wait for the response
  const authorizeResponse = await new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';

    const timeoutSetTimeoutId = setTimeout(() => {
      reject(new Error('timed out'));
      window.document.body.removeChild(iframe);
    }, 60 * 1000);

    function responseHandler(e) {
      if (e.origin !== authorizationEndpointUrl.origin ||
          e.data.type !== 'authorization_response') {
        return;
      }
      e.source.close();
      clearTimeout(timeoutSetTimeoutId);
      window.removeEventListener('message', responseHandler, false);
      window.document.body.removeChild(iframe);
      const response = e.data.response;
      if(response.error) {
        return reject(response)
      }
      if (response.state !== state) {
        return reject(new Error("State does not match."));
      }
      resolve(response);
    };

    window.addEventListener('message', responseHandler);
    window.document.body.appendChild(iframe);
    iframe.setAttribute('src', authorizationEndpointUrl);
  });

    // exchange the authorization code for a tokenset
  const tokenSet = await fetch(config.token_endpoint, {
    method: 'POST',
    body: new URLSearchParams({
      audience: API_AUDIENCE,
      client_id: AUTH0_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
      code: authorizeResponse.code,
    }),
    headers: new Headers({
      'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
    })
  }).then(r => r.json());

  console.dir(tokenSet);
});
```


This example uses some primitives found in moderm browsers and some utility methods availables in [util.js](public/util.js).
