const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: body ? JSON.parse(body) : {} });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body }); // Return raw body if not JSON
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function test() {
    try {
        console.log('Testing /api/health...');
        const health = await makeRequest('/api/health');
        console.log('Health:', health);

        console.log('Creating user...');
        const newUser = await makeRequest('/api/users', 'POST', {
            username: 'testuser_' + Date.now(),
            password: 'password123',
            email: 'test@example.com',
            phone: '1234567890'
        });
        console.log('Created User:', newUser);

        console.log('Listing users...');
        const users = await makeRequest('/api/users');
        console.log('Users:', users);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
