const https = require('https');

// A known valid image path on TMDB
const url = "https://image.tmdb.org/t/p/original/wwemzKWzjKYJFfCeiB57q3r4Bcm.png";

console.log(`Testing connectivity to: ${url}`);

const req = https.get(url, (res) => {
    console.log('StatusCode:', res.statusCode);

    if (res.statusCode === 200) {
        console.log('✅ Image server is REACHABLE.');
    } else {
        console.log('❌ Image server returned status:', res.statusCode);
    }
});

req.on('error', (e) => {
    console.error('HTTPS Error Code:', e.code);
    console.error('HTTPS Error Message:', e.message);
    console.error('❌ Image server is UNREACHABLE.');
});

// Set a timeout
req.setTimeout(5000, () => {
    console.error('Request timed out!');
    req.destroy();
});
