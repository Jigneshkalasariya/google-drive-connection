# PRTV

Next.js project with shadcn/ui, TypeScript, Tailwind CSS, and Google Drive integration.

## Features

- ⚡ Next.js 15 with App Router
- 🎨 Tailwind CSS for styling
- 🧩 shadcn/ui components
- 📝 TypeScript for type safety
- 🔧 ESLint with auto-remove unused imports
- 📦 Auto-sort imports
- 💅 Prettier with Tailwind CSS plugin
- 🎯 Matter.js physics engine
- 📁 Google Drive image picker integration

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Setup Google Drive (Required)

Follow the detailed guide in [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md) to:

- Create a Google Cloud project
- Enable Google Drive API and Picker API
- Get your Client ID and API Key
- Configure `.env.local`

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click "Select from Google Drive" to pick images from your Google Drive
2. Or click "Select from Local Drive" to upload from your computer
3. Watch images drop with physics simulation
4. Drag images around with your mouse
5. Images bounce and interact with each other

## Adding shadcn/ui Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
# etc...
```

## Linting & Formatting

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

The project is configured to:

- Auto-remove unused imports
- Auto-sort imports by category
- Format Tailwind classes automatically
