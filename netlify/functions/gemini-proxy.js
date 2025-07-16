// netlify/functions/gemini-proxy.js

// This function acts as a proxy to securely call the Gemini API
// It retrieves the API key from Netlify Environment Variables,
// preventing it from being exposed on the client-side.

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    // Get the Gemini API key from Netlify Environment Variables
    // Make sure you set this variable in your Netlify site settings!
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY environment variable is not set.');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: API key missing.' }),
        };
    }

    try {
        const { prompt } = JSON.parse(event.body); // Get the prompt from the frontend request body

        // Construct the payload for the Gemini API
        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }]
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        // Check if the Gemini API returned a valid response
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            return {
                statusCode: 200,
                body: JSON.stringify({ text: text }), // Send back only the text
            };
        } else {
            console.error('Unexpected Gemini API response structure:', result);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to get valid response from Gemini API', details: result }),
            };
        }

    } catch (error) {
        console.error('Error in Netlify Function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
        };
    }
};
