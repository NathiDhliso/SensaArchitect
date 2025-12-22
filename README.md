# Visual Master Chart Generator

AI-powered educational app that generates structured learning materials using Claude via AWS Bedrock. Built with Vite 6.0, React 19, and TypeScript 5.7+.

## Features

- **4-Pass Generation System**: Domain Analysis → Dependency Mapping → Content Generation → Quality Validation
- **Universal Lifecycle Enforcement**: 7 domains with 3-phase lifecycles (IT/Cloud, Coding/Dev, Law, Medicine, Accountancy, Project Management, Education)
- **AWS Bedrock Integration**: Uses Claude Sonnet 4 via AWS Bedrock Runtime with API key authentication
- **Real-time Streaming**: Progress updates during content generation
- **Quality Metrics**: Lifecycle consistency, positive framing, format consistency, and completeness scoring
- **Export Options**: PDF, Markdown, and TXT formats
- **Persistent Storage**: Bedrock API key and recent subjects stored locally

## Prerequisites

- Node.js 18+ and npm
- AWS Account with Bedrock access
- Bedrock API key (generated from AWS Bedrock console)
- Claude Sonnet 4 model access in your AWS region

## Installation

```bash
npm install
```

## Configuration

1. Start the development server:
```bash
npm run dev
```

2. Navigate to Settings and enter your Bedrock configuration:
   - **AWS Region**: Select the region where you have Bedrock access (e.g., us-east-1)
   - **Bedrock API Key**: Your Bedrock API key (format: `ABSKQnVkcm9ja...`)

Your configuration is stored locally in your browser using Zustand persist middleware.

## Usage

1. Enter a subject on the home page (e.g., "Azure Administrator", "MCAT Biology")
2. The app automatically detects the domain and applies the appropriate lifecycle
3. Watch the 4-pass generation process in real-time
4. View results with quality metrics
5. Export as PDF, Markdown, or TXT

## Project Structure

```
src/
├── pages/              # React pages (Home, Generate, Results, Settings)
├── lib/
│   ├── generation/     # AWS Bedrock client and multi-pass generator
│   ├── export/         # PDF, Markdown, TXT exporters
│   ├── system-prompt.ts # SYSTEM_PROMPT_V4 content
│   └── types.ts        # TypeScript types
├── store/              # Zustand state management
├── constants/          # Lifecycle registry and UI constants
└── App.tsx             # Router setup
```

## AWS Bedrock Model

The app uses `anthropic.claude-sonnet-4-20250514-v1:0` via AWS Bedrock Runtime. Ensure this model is available in your selected region.

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Technology Stack

- **Framework**: Vite 6.0 + React 19 + TypeScript 5.7+
- **Styling**: Modular CSS
- **State**: Zustand 5.0+ with persist middleware
- **Routing**: React Router 7
- **AI**: AWS Bedrock Runtime Client
- **Icons**: Lucide React
- **Export**: jsPDF, markdown-it, file-saver

## License

MIT
