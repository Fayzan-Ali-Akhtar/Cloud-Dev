const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const express = require('express');
const session = require('express-session');
const { Issuer, generators } = require('openid-client');
const AWS = require('aws-sdk');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, // allow cookies if you need them
}));

// Setup session middleware
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

const userPoolId = 'us-east-1_xmPaRnnux';
const clientId = '5ra230t923688r1shanp65s8h0';
const clientSecret = 'kl6pfg7g608p1sksujji2vefm5e7va5pvs0omrqb913mpt0cbg5';

const dbURL = 'postgresql://dbadmin:your_db_password@terraform-20250406041446114300000002.cs9siyyky9qw.us-east-1.rds.amazonaws.com:5432/tododb';

// Helper function to generate Cognito SECRET_HASH
function generateSecretHash(username, clientId, clientSecret) {
    return crypto
        .createHmac('SHA256', clientSecret)
        .update(username + clientId)
        .digest('base64');
}

// Initialize Cognito OpenID Connect client (for browser flows)
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

// Create PostgreSQL pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || dbURL,
    ssl: {
        rejectUnauthorized: false
    }
});


// --- JWKS and token verification setup ---
// Set up a JWKS client to fetch keys from Cognito
const clientJwks = jwksClient({
    jwksUri: `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
    cache: true,
    rateLimit: true
});

// Function to get the signing key from JWKS
function getKey(header, callback) {
    clientJwks.getSigningKey(header.kid, function(err, key) {
        if (err) return callback(err);
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

// Middleware to verify JWT token using the fetched public keys
const authenticateToken = (req, res, next) => {
    console.log('Token verification middleware hit');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, getKey, {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`
    }, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token is invalid or expired', details: err.message });
        }
        req.user = decoded;
        next();
    });
};

// --- Routes ---

// Simple session-based auth checker (for browser-based flows)
const checkAuth = (req, res, next) => {
    req.isAuthenticated = !!req.session.userInfo;
    next();
};

// Home route – renders a view using EJS
app.get('/', checkAuth, (req, res) => {
    res.render('home', {
        isAuthenticated: req.isAuthenticated,
        userInfo: req.session.userInfo
    });
});

// Login route (for username/password auth via Cognito)
app.post('/login', async (req, res) => {
    console.log('Login route hit');
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

        // Step 2: Fetch user's group (role)
        const groupParams = { Username: email, UserPoolId: userPoolId };
        const groupData = await cognito.adminListGroupsForUser(groupParams).promise();
        let role = 'Unknown';
        if (groupData.Groups && groupData.Groups.length > 0) {
            role = groupData.Groups[0].GroupName;
        }

        // Step 3: Send response with authentication result and role
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

// Callback handler for browser-based login flows
app.get('/callback', async (req, res) => {
    console.log('Callback handler hit');
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
            { Name: 'email', Value: email },
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

// Confirm signup route and add user to a group
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

        // Add user to a group based on role
        const groupParams = {
            GroupName: role || 'SimpleUsers',
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

// --- Task Endpoints with RBAC and PostgreSQL ---

// GET /tasks: Admins see all tasks; SimpleUsers see only their own tasks.
app.get('/tasks', authenticateToken, async (req, res) => {
    console.log('GET /tasks route hit');
    const email = req.user['username'];
    const groups = req.user['cognito:groups'] || [];
    const role = groups.length > 0 ? groups[0] : 'SimpleUsers';

    const query = role === 'Admins'
        ? 'SELECT * FROM todos ORDER BY created_at DESC'
        : 'SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC';
    const values = role === 'Admins' ? [] : [email];

    try {
        const { rows } = await pool.query(query, values);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// POST /tasks: Only SimpleUsers can create tasks.
app.post('/tasks', authenticateToken, async (req, res) => {
    console.log('POST /tasks route hit');
    const user = req.user;
    const groups = user['cognito:groups'] || [];
    const role = groups.length > 0 ? groups[0] : 'SimpleUsers';

    if (role === 'Admins') {
        return res.status(403).json({ error: 'Admins are not allowed to create tasks.' });
    }

    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Task text is required.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO todos (task, user_id) VALUES ($1, $2) RETURNING *',
            [text, user.username]
        );
        res.status(201).json({ message: 'Task created', task: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create task' });
    }
});


// DELETE /tasks/:id: SimpleUsers can delete their own tasks; Admins can delete any.
app.delete('/tasks/:id', authenticateToken, async (req, res) => {
    console.log('DELETE /tasks/:id route hit');
    const { id } = req.params;
    const email = req.user['username'];
    const groups = req.user['cognito:groups'] || [];
    const role = groups.length > 0 ? groups[0] : 'SimpleUsers';

    try {
        const taskRes = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
        const task = taskRes.rows[0];

        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (role !== 'Admins' && task.user_id !== email)
            return res.status(403).json({ error: 'Not authorized to delete this task' });

        await pool.query('DELETE FROM todos WHERE id = $1', [id]);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// PUT /tasks/:id: Only Admins can update tasks.
app.put('/tasks/:id', authenticateToken, async (req, res) => {
    console.log('PUT /tasks/:id route hit');
    const { id } = req.params;
    const { task } = req.body;
    const groups = req.user['cognito:groups'] || [];
    const role = groups.length > 0 ? groups[0] : 'SimpleUsers';

    if (role !== 'Admins') return res.status(403).json({ error: 'Only admins can update tasks' });

    try {
        const query = 'UPDATE todos SET task = $1 WHERE id = $2 RETURNING *';
        const values = [task, id];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update task' });
    }

});
// PUT /tasks/:id: Only Admins can update tasks status.
app.put('/tasks/status/:id', authenticateToken, async (req, res) => {
    console.log('PUT /tasks/status/:id route hit');
    const { id } = req.params;
    const { is_complete } = req.body;
    const groups = req.user['cognito:groups'] || [];
    const role = groups.length > 0 ? groups[0] : 'SimpleUsers';

    if (role !== 'Admins') return res.status(403).json({ error: 'Only admins can update tasks' });

    try {
        const query = 'UPDATE todos SET is_complete = $1 WHERE id = $2 RETURNING *';
        const values = [is_complete, id];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

app.get('/profile', authenticateToken, (req, res) => {
    const username = req.user['username'];
    const groups = req.user['cognito:groups'];
    const role = groups && groups.length > 0 ? groups[0] : 'Unknown';

    res.status(200).json({
        message: 'Secure profile info',
        username: username,
        role: role
    });
});

// Function to initialize the database
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // Check if the 'todos' table exists
        const tableCheckQuery = `
            SELECT EXISTS (
                SELECT 1
                FROM   pg_catalog.pg_tables
                WHERE  schemaname = 'public'
                AND    tablename = 'todos'
            ) AS table_exists;
        `;
        const res = await client.query(tableCheckQuery);
        const tableExists = res.rows[0].table_exists;

        if (!tableExists) {
            console.log("Table 'todos' does not exist. Creating table...");

            // Create the 'todos' table
            const createTableQuery = `
                CREATE TABLE todos (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    task TEXT NOT NULL,
                    is_complete BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;
            await client.query(createTableQuery);
            console.log("Table 'todos' created successfully.");
        } else {
            console.log("Table 'todos' already exists.");
        }
    } catch (err) {
        console.error('Error initializing database:', err);
        throw err; // Rethrow the error to be handled by the caller
    } finally {
        client.release();
    }
}

// Initialize the database and start the application
initializeDatabase()
    .then(() => {
        console.log('Connected to PostgreSQL database successfully');
        app.listen(port, () => {
            console.log(`App running on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize the database:', err);
        process.exit(1);
    });