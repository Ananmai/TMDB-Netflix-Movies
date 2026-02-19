const axios = require('axios');

const API_KEY = "1db87f7aa35339bc6e5c9491b5f99745";
const url = `https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}&language=en-US`;

async function test() {
    try {
        console.log(`Testing URL: ${url}`);
        const response = await axios.get(url);
        console.log('Status:', response.status);
        console.log('Results count:', response.data.results.length);
        console.log('First result:', response.data.results[0].title || response.data.results[0].name);
    } catch (error) {
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received');
        } else {
            console.error('Error setup:', error.message);
        }
    }
}

test();
