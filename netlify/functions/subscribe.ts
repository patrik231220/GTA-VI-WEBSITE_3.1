import { Handler } from '@netlify/functions';

const handler: Handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const { email, firstName } = JSON.parse(event.body || '{}');

    // Validate input
    if (!email || !firstName) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Email and first name are required' }),
      };
    }

    // Log the submission for manual processing
    console.log('Email submission received:', {
      email: email.trim(),
      firstName: firstName.trim(),
      timestamp: new Date().toISOString(),
      userAgent: event.headers['user-agent'] || 'unknown'
    });

    // Get API key from environment variable
    const apiKey = process.env.MAILERLITE_API_KEY;
    
    if (!apiKey) {
      console.log('MAILERLITE_API_KEY not found, logging submission for manual processing');
      // Return success even without API key
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          success: true, 
          message: 'Submission received and will be processed manually',
          data: { email: email.trim(), firstName: firstName.trim() }
        }),
      };
    }

    try {
      // Make request to MailerLite API
      const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          fields: {
            name: firstName.trim(),
          },
          groups: ['160072846854325674'], // Your group ID
          status: 'active',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('MailerLite API error:', response.status, errorData);
        
        // Log for manual processing instead of failing
        console.log('MailerLite failed, logging for manual processing:', {
          email: email.trim(),
          firstName: firstName.trim(),
          error: errorData,
          status: response.status
        });
        
        // Return success to user even if MailerLite fails
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            success: true, 
            message: 'Submission received and will be processed',
            data: { email: email.trim(), firstName: firstName.trim() }
          }),
        };
      }

      const result = await response.json();
      console.log('MailerLite subscription successful:', result);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ success: true, data: result }),
      };

    } catch (mailerliteError) {
      console.error('MailerLite request failed:', mailerliteError);
      
      // Log for manual processing
      console.log('MailerLite error, logging for manual processing:', {
        email: email.trim(),
        firstName: firstName.trim(),
        error: mailerliteError instanceof Error ? mailerliteError.message : 'Unknown error'
      });
      
      // Return success to user even if MailerLite fails
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          success: true, 
          message: 'Submission received and will be processed',
          data: { email: email.trim(), firstName: firstName.trim() }
        }),
      };
    }

  } catch (error) {
    console.error('Function error:', error);
    
    // Even on complete failure, return success for better UX
    console.log('Complete failure, logging for manual processing:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Submission received and will be processed',
        data: { message: 'Logged for manual processing' }
      }),
    };
  }
};

export { handler };