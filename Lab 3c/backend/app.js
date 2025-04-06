const express = require('express');
const session = require('express-session');
const { Issuer, generators } = require('openid-client');
const AWS = require('aws-sdk');
const crypto = require('crypto');

const app = express();
const port = 3000;

// Setup session
app.use(session({
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: false
}));

// Parse JSON bodies
app.use(express.json());

// Setup EJS view engine
app.set('view engine', 'ejs');

// AWS Cognito configuration
AWS.config.update({ region: 'us-east-1' });
const cognito = new AWS.CognitoIdentityServiceProvider();

const userPoolId = 'us-east-1_Y1MsC2Ygv';
const clientId = 'm9jia3mrueerpjs1g57arvhmm';
const clientSecret = '108krbi4jfb2lj4gak4108ivd8h12gub5koeahom7lqgaf406v8d';

// Helper function to generate SECRET_HASH
function generateSecretHash(username, clientId, clientSecret) {
    return crypto
        .createHmac('SHA256', clientSecret)
        .update(username + clientId)
        .digest('base64');
}

// Initialize Cognito OpenID Connect client
let client;

async function initializeClient() {
    const issuer = await Issuer.discover(`https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`);
    client = new issuer.Client({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uris: ['http://localhost:3000/callback'],
        response_types: ['code']
    });
}
initializeClient().catch(console.error);

// Auth checker middleware
const checkAuth = (req, res, next) => {
    req.isAuthenticated = !!req.session.userInfo;
    next();
};

// Home route
app.get('/', checkAuth, (req, res) => {
    res.render('home', {
        isAuthenticated: req.isAuthenticated,
        userInfo: req.session.userInfo
    });
});

// Login route
app.get('/login', (req, res) => {
    const nonce = generators.nonce();
    const state = generators.state();
    req.session.nonce = nonce;
    req.session.state = state;

    const authUrl = client.authorizationUrl({
        scope: 'openid profile email',
        state,
        nonce
    });

    res.redirect(authUrl);
});

// Callback handler
app.get('/callback', async (req, res) => {
    try {
        const params = client.callbackParams(req);
        const tokenSet = await client.callback(
            'http://localhost:3000/callback',
            params,
            { nonce: req.session.nonce, state: req.session.state }
        );
        const userInfo = await client.userinfo(tokenSet.access_token);
        req.session.userInfo = userInfo;
        res.redirect('/');
    } catch (err) {
        console.error('Callback error:', err);
        res.redirect('/');
    }
});

// Signup route
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    const secretHash = generateSecretHash(email, clientId, clientSecret);

    const params = {
        ClientId: clientId,
        SecretHash: secretHash,
        Username: email,
        Password: password,
        UserAttributes: [
            { Name: 'email', Value: email }
        ]
    };

    try {
        const data = await cognito.signUp(params).promise();
        res.status(200).json({ message: 'Signup successful. Please confirm your email.', data });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(400).json({ error: err.message });
    }
});

app.post('/confirm', async (req, res) => {
    const { email, code } = req.body;

    const secretHash = generateSecretHash(email, clientId, clientSecret);

    const params = {
        ClientId: clientId,
        Username: email,
        ConfirmationCode: code,
        SecretHash: secretHash
    };

    try {
        await cognito.confirmSignUp(params).promise();
        res.status(200).json({ message: 'User confirmed successfully.' });
    } catch (err) {
        console.error('Confirmation error:', err);
        res.status(400).json({ error: err.message });
    }
});


// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    const logoutUrl = `https://${userPoolId}.auth.us-east-1.amazoncognito.com/logout?client_id=${clientId}&logout_uri=http://localhost:3000/`;
    res.redirect(logoutUrl);
});

app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});
