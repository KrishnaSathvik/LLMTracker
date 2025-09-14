# LLM Tracker

A production-ready system for tracking and analyzing LLM interactions:
- **Extension (MV3)**: Track LLM network calls, clicks, DOM fingerprints + correlation
- **API (Fastify + Postgres)**: Ingest events, list runs, serve correlated timelines with analytics
- **Viewer (Next.js)**: List runs and view timeline with advanced inspectors and reporting

## Quick Start

### Prerequisites
- Node 18+
- pnpm or npm
- Docker (for Postgres via docker-compose)

### Development Setup

1. **Start Postgres**
```bash
docker compose up -d
```

2. **API Setup**
```bash
cd services/api
pnpm install
cp env.example .env  # Configure your environment variables
pnpm dev
# API runs on http://localhost:4000
```

3. **Web App Setup**
```bash
cd apps/web
pnpm install
cp env.local.example .env.local  # Configure API URL and key
pnpm dev
# Web app runs on http://localhost:3000
```

4. **Extension Setup**
- Open Chrome → `chrome://extensions` → enable **Developer mode**
- **Load unpacked** → select `apps/extension` folder
- Pin "LLM Tracker" extension for easy access
- Extension runs passively on all pages

### Production Deployment

#### Using Docker Compose
```bash
# Set environment variables
export POSTGRES_PASSWORD=your-secure-password
export NEXT_PUBLIC_API_KEY=your-api-key
export CORS_ORIGIN=https://llmtracker.dev

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

#### Manual Deployment
1. Build the applications:
```bash
# API
cd services/api
pnpm build
pnpm start

# Web
cd apps/web
pnpm build
pnpm start
```

2. Set up reverse proxy (nginx/traefik) for SSL termination
3. Configure environment variables for production

## Architecture

```
llm-tracker/
├── apps/
│   ├── extension/          # Chrome MV3 extension
│   └── web/               # Next.js viewer with analytics
├── services/
│   └── api/               # Fastify API + Postgres storage
├── Dockerfile.api         # Production API container
├── Dockerfile.web         # Production web container
├── docker-compose.yml     # Development environment
└── docker-compose.prod.yml # Production environment
```

## Features

### Core Functionality
- **Event Capture**: Network requests, user clicks, DOM fingerprints
- **LLM Detection**: Automatic identification of AI provider calls
- **Correlation**: Links user actions to AI responses
- **Timeline View**: Visual replay of user sessions
- **Analytics**: Performance metrics and usage statistics

### Production Features
- **Multi-tenant**: Workspace-based data isolation
- **API Authentication**: Secure API key management
- **Performance Optimized**: Pagination, connection pooling, caching
- **Security**: CORS, security headers, input validation
- **Monitoring**: Health checks, structured logging
- **Scalable**: Docker containers, database optimization

## Environment Variables

### API (.env)
```bash
DATABASE_URL=postgres://user:pass@localhost:5432/afr
PORT=4000
CORS_ORIGIN=https://llmtracker.dev
NODE_ENV=production
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
```

### Web App (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.llmtracker.dev
NEXT_PUBLIC_API_KEY=your-secure-api-key
NEXT_PUBLIC_APP_ENV=production
```

## Security Considerations

- API keys are required for all authenticated endpoints
- CORS is configured for specific origins
- Security headers are enforced
- Database connections use connection pooling
- Input validation with Zod schemas
- No sensitive data in client-side code

## Monitoring & Analytics

The system provides comprehensive analytics including:
- Session duration and event counts
- LLM provider usage statistics
- Response time metrics
- Correlation effectiveness rates
- Performance trends over time

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

---

**🌐 Live at: [llmtracker.dev](https://llmtracker.dev)**
