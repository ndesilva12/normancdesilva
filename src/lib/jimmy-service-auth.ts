// Jimmy's service account Gmail authentication
import { JWT } from 'google-auth-library';

// Service account credentials from environment
function getServiceAccountKey() {
  const key = process.env.JIMMY_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error('JIMMY_SERVICE_ACCOUNT_KEY environment variable not set');
  }
  
  try {
    return JSON.parse(key);
  } catch (error) {
    throw new Error('Invalid JSON in JIMMY_SERVICE_ACCOUNT_KEY environment variable');
  }
}

// Gmail scopes Jimmy needs
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/contacts.readonly',
];

// Target user email (Norman's email)
const SUBJECT_EMAIL = 'norman.desilva@gmail.com';

// Create JWT client for service account
function createJWTClient(): JWT {
  const serviceAccountKey = getServiceAccountKey();
  
  return new JWT({
    email: serviceAccountKey.client_email,
    key: serviceAccountKey.private_key,
    scopes: SCOPES,
    subject: SUBJECT_EMAIL, // Impersonate Norman's email
  });
}

// Get access token for Jimmy to use Gmail API
export async function getJimmyServiceToken(): Promise<string> {
  try {
    const jwtClient = createJWTClient();
    const tokens = await jwtClient.authorize();
    
    if (!tokens.access_token) {
      throw new Error('No access token received from service account');
    }
    
    return tokens.access_token;
  } catch (error) {
    console.error('Service account authentication error:', error);
    throw new Error(`Failed to authenticate Jimmy's service account: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Test authentication
export async function testJimmyServiceAuth(): Promise<{ success: boolean; email: string; message: string }> {
  try {
    const token = await getJimmyServiceToken();
    
    // Test with Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gmail API test failed: ${error}`);
    }
    
    const profile = await response.json();
    
    return {
      success: true,
      email: profile.emailAddress,
      message: 'Service account authentication successful!',
    };
  } catch (error) {
    return {
      success: false,
      email: '',
      message: error instanceof Error ? error.message : 'Authentication test failed',
    };
  }
}