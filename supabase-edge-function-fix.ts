// Copy this code to your Supabase Edge Function: super-service

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

    // Get API key from environment variable
    const apiKey = Deno.env.get('MAILERLITE_API_KEY')
    if (!apiKey) {
      console.error('MAILERLITE_API_KEY environment variable not set')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('API Key exists:', !!apiKey)
    console.log('API Key length:', apiKey.length)
    console.log('API Key starts with:', apiKey.substring(0, 20) + '...')

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
      
      return new Response(
        JSON.stringify({ 
          error: errorData.message || errorData.error || `MailerLite API error: ${mailerliteResponse.status}`,
          details: errorData
        }),
        { 
          status: mailerliteResponse.status, 
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

  } catch (error) {
    console.error('Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})