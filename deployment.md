# Deployment Guide

This project is designed to be deployed on **Netlify** (for the frontend prototype) or **Railway** (for the full-stack platform).

## Option 1: Netlify (Recommended for Prototype)

Netlify is the easiest way to deploy the Next.js frontend.

1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository.
2. **Log in to Netlify**: Go to [netlify.com](https://www.netlify.com) and log in.
3. **Add New Site**: Click "Add new site" -> "Import an existing project".
4. **Connect GitHub**: Select GitHub and choose your repository.
5. **Configure Build**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `.next`
   - **Netlify Next.js Plugin**: Netlify should automatically detect Next.js and install the necessary plugin.
6. **Deploy**: Click "Deploy site".

## Option 2: Railway (Recommended for Full Platform)

Railway is better suited if you plan to add a Python backend, PostgreSQL database, or background workers later.

1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository.
2. **Log in to Railway**: Go to [railway.app](https://railway.app) and log in.
3. **New Project**: Click "New Project" -> "Deploy from GitHub repo".
4. **Select Repository**: Choose your repository.
5. **Configure**:
   - Railway will automatically detect the Next.js app.
   - Go to "Settings" -> "Generate Domain" to get a public URL.
6. **Environment Variables**:
   - If you add API keys later, go to the "Variables" tab to add them.

## Environment Variables

For both platforms, you may need to configure the following environment variables if you add real API integrations:

- `NEXT_PUBLIC_API_URL`: URL of your backend API (if separate).
- `LINKEDIN_API_KEY`: (Future)
- `INDEED_API_KEY`: (Future)
