# OpenAI API Key Setup Guide

## Overview

The Clarity extension supports two methods for configuring your OpenAI API key:
1. **Environment Variable** (Recommended)
2. **VS Code Settings**

## Method 1: Environment Variable (Recommended)

### **Step 1: Get Your API Key**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the generated API key

### **Step 2: Set Environment Variable**

#### **On macOS/Linux:**
```bash
# Add to your shell profile (~/.zshrc, ~/.bashrc, etc.)
export OPENAI_API_KEY="your_api_key_here"

# Or set for current session
export OPENAI_API_KEY="sk-your-actual-api-key-here"
```

#### **On Windows:**
```cmd
# Command Prompt
set OPENAI_API_KEY=your_api_key_here

# PowerShell
$env:OPENAI_API_KEY="your_api_key_here"

# Or set permanently in System Properties > Environment Variables
```

#### **For VS Code Development:**
Create a `.env` file in your project root:
```bash
# .env file
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### **Step 3: Restart VS Code**
After setting the environment variable, restart VS Code to ensure it picks up the new environment.

## Method 2: VS Code Settings

### **Step 1: Open Settings**
- Press `Cmd/Ctrl + ,` to open settings
- Or go to `File > Preferences > Settings`

### **Step 2: Search for Clarity**
- Type "clarity" in the search box
- Find "Clarity: Openai Api Key"

### **Step 3: Enter API Key**
- Paste your OpenAI API key in the field
- The setting will be saved automatically

## Verification

### **Check if API Key is Working:**
1. Open a Clarity project with `.clar` files
2. Open the Clarity sidebar
3. Click "Generate Tests"
4. If configured correctly, you'll see "Found X contract(s). Generating tests..."
5. If not configured, you'll see an error message

### **Debug Information:**
Check the VS Code Developer Console (`Help > Toggle Developer Tools`) for:
- `OpenAI initialized with API key` - Success
- `OpenAI API key not found...` - Configuration issue

## Security Best Practices

### **Environment Variable Security:**
- Never commit API keys to version control
- Use `.env` files and add them to `.gitignore`
- Rotate API keys regularly
- Use different keys for development/production

### **VS Code Settings Security:**
- Settings are stored locally on your machine
- Don't share your `settings.json` file
- Consider using VS Code's secret storage for sensitive data

## Troubleshooting

### **Common Issues:**

#### **"API key not configured" Error:**
- Check if environment variable is set: `echo $OPENAI_API_KEY`
- Restart VS Code after setting environment variable
- Verify API key is valid and active

#### **"Invalid API key" Error:**
- Verify the API key is correct
- Check if the key has expired
- Ensure you have sufficient credits in your OpenAI account

#### **"Rate limit exceeded" Error:**
- Wait a few minutes before trying again
- Check your OpenAI usage limits
- Consider upgrading your OpenAI plan

### **Testing API Key:**
```bash
# Test if environment variable is set
echo $OPENAI_API_KEY

# Test API key with curl
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

## File Structure

```
clarity-extension/
├── .env                    # Your API key (create this)
├── env.example            # Template file
├── .gitignore             # Should include .env
└── ...
```

## Example .env File

```bash
# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# Optional: Custom Clarinet path
CLARINET_PATH=/usr/local/bin/clarinet
```

## Priority Order

The extension checks for API key in this order:
1. **Environment Variable** (`OPENAI_API_KEY`)
2. **VS Code Setting** (`clarity.openaiApiKey`)

If both are set, the environment variable takes priority.

## Status: ✅ Ready

Your OpenAI API key is now configured and ready for AI-powered test generation! 🚀
