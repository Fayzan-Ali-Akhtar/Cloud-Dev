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
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const secretHash = generateSecretHash(email, clientId, clientSecret);

    const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
            SECRET_HASH: secretHash
        }
    };

    try {
        // Step 1: Authenticate user
        const data = await cognito.initiateAuth(params).promise();

        // Step 2: Fetch the user's group (role)
        const groupParams = {
            Username: email,
            UserPoolId: userPoolId
        };

        const groupData = await cognito.adminListGroupsForUser(groupParams).promise();

        let role = 'Unknown';
        if (groupData.Groups && groupData.Groups.length > 0) {
            // Assuming the user only belongs to one group (e.g., Admins or SimpleUsers)
            role = groupData.Groups[0].GroupName;
        }

        // Step 3: Send response
        res.status(200).json({
            message: 'Login successful',
            role: role,
            data
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(400).json({ error: err.message });
    }
});



// Callback handler
app.get('/callback', async (req, res) => {
    try {
        console.log('Callback route hit');
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
    console.log('Signup route hit');
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
    console.log('Confirm route hit');
    const { email, code, role } = req.body;

    const secretHash = generateSecretHash(email, clientId, clientSecret);

    const confirmParams = {
        ClientId: clientId,
        Username: email,
        ConfirmationCode: code,
        SecretHash: secretHash
    };

    try {
        await cognito.confirmSignUp(confirmParams).promise();

        // Add to Cognito group
        const groupParams = {
            GroupName: role || "SimpleUsers",
            UserPoolId: userPoolId,
            Username: email
        };

        await cognito.adminAddUserToGroup(groupParams).promise();

        res.status(200).json({ message: `User confirmed and added to ${groupParams.GroupName} group.` });
    } catch (err) {
        console.error('Confirmation error:', err);
        res.status(400).json({ error: err.message });
    }
});



// Logout route
app.get('/logout', (req, res) => {
    console.log('Logout route hit');
    req.session.destroy();
    const logoutUrl = `https://${userPoolId}.auth.us-east-1.amazoncognito.com/logout?client_id=${clientId}&logout_uri=http://localhost:3000/`;
    res.redirect(logoutUrl);
});

app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});
