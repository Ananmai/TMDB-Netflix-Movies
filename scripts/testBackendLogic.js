const https = require('https');

const API_KEY = "1db87f7aa35339bc6e5c9491b5f99745";
const url = `https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}&language=en-US`;

console.log(`Testing connectivity to: ${url}`);

const req = https.get(url, (res) => {
    console.log('StatusCode:', res.statusCode);
    console.log('Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Body length:', data.length);
        console.log('First 100 chars contents:', data.substring(0, 100));
    });

});

req.on('error', (e) => {
    console.error('HTTPS Error Code:', e.code);
    console.error('HTTPS Error Message:', e.message);
});

// Set a timeout
req.setTimeout(5000, () => {
    console.error('Request timed out!');
    req.destroy();
});
