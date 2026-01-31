# Google Drive Integration Setup

Follow these steps to enable Google Drive image selection:

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "Google-drive-connection Image Picker")
4. Click "Create"

## Step 2: Enable Required APIs

1. In your project, go to "APIs & Services" → "Library"
2. Search for and enable:
   - **Google Drive API**
   - **Google Picker API**

## Step 3: Create OAuth 2.0 Client ID

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: Google-drive-connection
   - User support email: your email
   - Developer contact: your email
   - Click "Save and Continue"
   - Scopes: Skip for now
   - Test users: Add your email
   - Click "Save and Continue"
4. Back to Create OAuth client ID:
   - Application type: **Web application**
   - Name: Google-drive-connection Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - Add your production domain later
   - Click "Create"
5. **Copy the Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

## Step 4: Create API Key

1. Still in "Credentials", click "Create Credentials" → "API key"
2. **Copy the API Key**
3. Click "Restrict Key" (recommended):
   - API restrictions: Select "Restrict key"
   - Check: **Google Picker API**
   - Click "Save"

## Step 5: Configure Your Project

1. Open `.env.local` in your project
2. Replace the placeholder values:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_API_KEY=your_actual_api_key
```

3. Save the file
4. Restart your development server:

```bash
npm run dev
```

## Step 6: Test It Out

1. Open http://localhost:3000
2. Click "Select from Google Drive"
3. Sign in with your Google account
4. Grant permissions to access your Drive
5. Select images and watch them fall!

## Troubleshooting

### "Google APIs are still loading"

- Wait a few seconds and try again
- Check browser console for errors

### "Access blocked: This app's request is invalid"

- Make sure you added `http://localhost:3000` to Authorized JavaScript origins
- Check that both APIs are enabled

### "Invalid API key"

- Verify the API key is correct in `.env.local`
- Make sure the API key is restricted to Google Picker API

### Images not loading

- Google Drive images need to be shared or have proper permissions
- Try with images you own in your Drive

## Production Deployment

When deploying to production:

1. Add your production domain to Authorized JavaScript origins
2. Update OAuth consent screen to "Published" status
3. Consider adding more security restrictions to your API key
