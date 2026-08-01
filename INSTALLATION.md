# Installation Guide

Welcome to the NotterPad installation guide. This document provides step-by-step instructions for setting up NotterPad in your local environment.

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- **Node.js**: v18.x or higher
- **Package Manager**: npm (v9+), pnpm, or yarn

## Step-by-Step Setup

### 1. Clone the Repository

Begin by cloning the NotterPad repository to your local machine:

```bash
git clone https://github.com/Unique-newbie/Notter.git
cd Notter
```

### 2. Install Dependencies

Install the project dependencies using your preferred package manager:

```bash
# Using npm
npm install

# Using pnpm
pnpm install

# Using yarn
yarn install
```

### 3. Environment Variables Setup

NotterPad uses a `.env.local` file for environment-specific configuration. Create this file in the project root:

```bash
cp .env.example .env.local
```

**Note:** NotterPad employs a Bring Your Own Key (BYOK) architecture. You can configure your AI API keys (OpenAI, Anthropic, Gemini, etc.) directly via the user interface (Settings -> AI). Alternatively, you can set them in `.env.local` for development convenience.

### 4. Running the Development Server

Start the development server with hot-reloading:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to see the application running.

### 5. Building for Production

To create an optimized production build:

```bash
npm run build
npm run start
```

## AI Provider Setup

NotterPad supports various AI providers for story extraction and generation features.

- **OpenAI / Claude / Gemini**: Obtain API keys from their respective developer consoles. Input these keys in the NotterPad UI under Settings.
- **Local LLMs (Ollama / LM Studio)**:
  - Ensure your local inference server is running and accessible (usually `http://localhost:11434` for Ollama).
  - Configure the local endpoint in NotterPad Settings.
  - **Crucial**: Ensure CORS is configured properly on your local server to accept requests from `http://localhost:3000`.

## Troubleshooting

- **IndexedDB Permissions**: Ensure your browser allows local storage/IndexedDB for `localhost`. Private browsing modes might restrict this.
- **Node Versions**: If you encounter build errors, verify you are running Node 18.x+. Use `nvm` or `fnm` to manage versions.
- **Local LLM CORS Headers**: For Ollama, set `OLLAMA_ORIGINS="*" ollama serve` if you face connection issues from the web app.
