# Google Cloud Vision API Setup Guide

The OCR server requires the Google Cloud Vision API to be properly configured. Here's how to set it up:

## Step 1: Enable the Cloud Vision API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Library"
3. Search for "Cloud Vision API"
4. Click on "Cloud Vision API" and then click "ENABLE"

## Step 2: Create a Service Account and Download Key

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "CREATE SERVICE ACCOUNT"
3. Fill in the service account details and click "CREATE AND CONTINUE"
4. Assign the "Cloud Vision API User" role (or a custom role with Vision API permissions)
5. Click "DONE"
6. Click on your new service account, go to "KEYS" tab, and click "ADD KEY" > "Create new key"
7. Select JSON format and click "CREATE" - this will download your service account key file

## Step 3: Set Up Environment Variables

1. Rename the downloaded key file to something like `vision-api-key.json`
2. Place it in your project directory or a secure location
3. Set the environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/vision-api-key.json"
```

## Step 4: Add to .env file

Add this line to your `.env` file:

```env
GOOGLE_APPLICATION_CREDENTIALS=./path/to/your/vision-api-key.json
```

## Common Issues and Solutions

### Error: "Cloud Vision API has not been used in project before or it is disabled"

**Solution:**
1. Make sure you've enabled the Cloud Vision API as described in Step 1
2. Wait a few minutes for the changes to propagate
3. Check that you're using the correct Google Cloud project

### Error: "PERMISSION_DENIED"

**Solution:**
1. Verify your service account has the correct permissions
2. Check that the `GOOGLE_APPLICATION_CREDENTIALS` environment variable points to the correct key file
3. Ensure the key file is valid and not expired
4. Make sure you're authenticated with the correct Google Cloud account: `gcloud auth application-default login`

## Verification

To verify your setup is working:

```bash
# Install Google Cloud SDK if not already installed
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Test authentication
gcloud auth application-default login

# Test Vision API access
node -e "const {ImageAnnotatorClient} = require('@google-cloud/vision'); const client = new ImageAnnotatorClient(); client.textDetection({image: {content: Buffer.from('test')}}).catch(err => console.log('Vision API test error:', err.message));"
```

If you see a permission error, follow the solutions above. If you see other errors, the API is working but there may be issues with your request format.
