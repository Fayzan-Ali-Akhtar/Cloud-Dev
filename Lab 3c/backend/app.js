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

const userPoolId = 'us-east-1_VzzfbUzd1';
const clientId = '3ij1thvkpeonf6nf75enumnv91';
const clientSecret = '12qqjkns84v6ve9p816siorgpfro7q6qn1gulik3kk1ui1kvdggp';

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

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    const logoutUrl = `https://lab-user-pool.auth.us-east-1.amazoncognito.com/logout?client_id=${clientId}&logout_uri=http://localhost:3000/`;
    res.redirect(logoutUrl);
});

app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});
