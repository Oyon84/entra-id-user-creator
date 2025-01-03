// Import necessary modules
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());

// Configuration
const PORT = 3000;
const CLIENT_ID = 'your-client-id'; // Replace with your Azure App Client ID
const CLIENT_SECRET = 'your-client-secret'; // Replace with your Azure App Client Secret
const TENANT_ID = 'your-tenant-id'; // Replace with your Azure Tenant ID
const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

// Function to get access token from Microsoft
async function getAccessToken() {
    const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    const data = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
    });

    try {
        const response = await axios.post(tokenUrl, data.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error.response.data);
        throw new Error('Failed to fetch access token');
    }
}

// Route to create a new user
app.post('/api/create-user', async (req, res) => {
    const { displayName, mailNickname, userPrincipalName, password } = req.body;

    if (!displayName || !mailNickname || !userPrincipalName || !password) {
        return res.status(400).json({ error: 'All fields are required: displayName, mailNickname, userPrincipalName, password.' });
    }

    try {
        const accessToken = await getAccessToken();

        const userPayload = {
            accountEnabled: true,
            displayName,
            mailNickname,
            userPrincipalName,
            passwordProfile: {
                forceChangePasswordNextSignIn: true,
                password,
            },
        };

        const response = await axios.post(`${GRAPH_API_URL}/users`, userPayload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        return res.status(201).json({ message: 'User created successfully', data: response.data });
    } catch (error) {
        console.error('Error creating user:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Failed to create user', details: error.response?.data || error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
