# GitHub Push Guide for UberTruck

## Quick Authentication Methods

### Method 1: Using Personal Access Token (Recommended)

1. **Generate a Personal Access Token**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Name: "UberTruck Deployment"
   - Select scopes: ✅ repo (full control)
   - Click "Generate token"
   - **COPY THE TOKEN NOW** (you won't see it again!)

2. **Push with Token**:
   ```bash
   # Replace YOUR_TOKEN with your actual token
   git push https://koansysinc:YOUR_TOKEN@github.com/koansysinc/ubertruck.git master
   ```

### Method 2: Using Git Credential Helper

```bash
# Set up credential storage
git config --global credential.helper store

# Try pushing (it will ask for credentials)
git push -u origin master

# When prompted:
# Username: koansysinc
# Password: [PASTE YOUR PERSONAL ACCESS TOKEN HERE]
```

### Method 3: Using SSH (If you have SSH keys set up)

```bash
# Change remote to SSH
git remote set-url origin git@github.com:koansysinc/ubertruck.git

# Push
git push -u origin master
```

## Current Repository Status

✅ **Local Git Status**:
- Repository initialized
- Initial commit created (309 files)
- Remote added: https://github.com/koansysinc/ubertruck.git

⏳ **Waiting for**:
- GitHub authentication to push

## After Successful Push

Once pushed, you can:
1. Visit https://github.com/koansysinc/ubertruck to see your code
2. Deploy backend to Render
3. Deploy frontend to Vercel

## Troubleshooting

If you get "repository not found":
- Make sure you've created the repository on GitHub
- Check the repository name is exactly: `ubertruck`
- Ensure it's under the account: `koansysinc`

If you get "authentication failed":
- Your token might have expired
- Generate a new token with `repo` scope
- Make sure you're copying the token correctly (no spaces)