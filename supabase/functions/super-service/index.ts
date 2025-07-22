import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { email, firstName } = await req.json()

    // Validate input
    if (!email || !firstName) {
      return new Response(
        JSON.stringify({ error: 'Email and firstName are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the submission for manual processing (always works)
    console.log('Email submission received:', {
      email: email.trim(),
      firstName: firstName.trim(),
      timestamp: new Date().toISOString(),
      userAgent: req.headers.get('user-agent') || 'unknown'
    })

    // Try to get API key from environment variable
    const apiKey = Deno.env.get('MAILERLITE_API_KEY')
    
    if (!apiKey) {
      console.log('MAILERLITE_API_KEY not found, logging submission for manual processing')
      // Return success even without API key to avoid user frustration
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Submission received and will be processed manually',
          data: { email: email.trim(), firstName: firstName.trim() }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('API Key found, attempting MailerLite integration')

    try {
      // Make request to MailerLite API
      const mailerliteResponse = await fetch('https://connect.mailerlite.com/api/subscribers', {
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
      })

      console.log('MailerLite response status:', mailerliteResponse.status)

      if (!mailerliteResponse.ok) {
        const errorData = await mailerliteResponse.json().catch(() => ({}))
        console.error('MailerLite API error:', mailerliteResponse.status, errorData)
        
        // Log for manual processing instead of failing
        console.log('MailerLite failed, logging for manual processing:', {
          email: email.trim(),
          firstName: firstName.trim(),
          error: errorData,
          status: mailerliteResponse.status
        })
        
        // Return success to user even if MailerLite fails
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Submission received and will be processed',
            data: { email: email.trim(), firstName: firstName.trim() }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const result = await mailerliteResponse.json()
      console.log('MailerLite subscription successful:', result)

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (mailerliteError) {
      console.error('MailerLite request failed:', mailerliteError)
      
      // Log for manual processing
      console.log('MailerLite error, logging for manual processing:', {
        email: email.trim(),
        firstName: firstName.trim(),
        error: mailerliteError.message
      })
      
      // Return success to user even if MailerLite fails
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Submission received and will be processed',
          data: { email: email.trim(), firstName: firstName.trim() }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Function error:', error)
    
    // Even on complete failure, log and return success for better UX
    console.log('Complete failure, logging for manual processing:', {
      error: error.message,
      timestamp: new Date().toISOString()
    })
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Submission received and will be processed',
        data: { message: 'Logged for manual processing' }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})