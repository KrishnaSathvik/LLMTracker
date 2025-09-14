# Deployment Guide

This guide covers deploying Agent Flight Recorder to production environments.

## Prerequisites

- Docker and Docker Compose
- Domain name with SSL certificate
- PostgreSQL database (or use the provided Docker setup)
- Reverse proxy (nginx/traefik) for SSL termination

## Environment Setup

### 1. Database Configuration

Create a secure PostgreSQL database:

```bash
# Using Docker
docker run -d \
  --name afr-postgres \
  -e POSTGRES_USER=afr \
  -e POSTGRES_PASSWORD=your-secure-password \
  -e POSTGRES_DB=afr \
  -p 5432:5432 \
  postgres:15-alpine
```

### 2. Environment Variables

Create production environment files:

**API (.env)**
```bash
DATABASE_URL=postgres://afr:your-secure-password@localhost:5432/afr
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
```

**Web App (.env.local)**
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_KEY=your-secure-api-key
NEXT_PUBLIC_APP_ENV=production
```

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. **Clone and configure:**
```bash
git clone <repository>
cd agent-flight-recorder
cp docker-compose.prod.yml docker-compose.yml
```

2. **Set environment variables:**
```bash
export POSTGRES_PASSWORD=your-secure-password
export NEXT_PUBLIC_API_KEY=your-api-key
export CORS_ORIGIN=https://yourdomain.com
```

3. **Deploy:**
```bash
docker-compose up -d
```

### Option 2: Manual Deployment

1. **Build API:**
```bash
cd services/api
pnpm install
pnpm build
pnpm start
```

2. **Build Web App:**
```bash
cd apps/web
pnpm install
pnpm build
pnpm start
```

### Option 3: Cloud Deployment

#### Vercel (Web App)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

#### Railway/Render (API)
1. Connect your repository
2. Set environment variables
3. Deploy with automatic builds

## Reverse Proxy Configuration

### Nginx Example

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Web app
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Security Checklist

- [ ] Use strong, unique passwords
- [ ] Enable SSL/TLS encryption
- [ ] Configure CORS for your domain only
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Backup database regularly

## Monitoring

### Health Checks

- API: `GET /health`
- Web: Built-in Next.js health checks

### Logging

Configure structured logging for production:

```bash
# API logs
docker logs afr-api

# Database logs
docker logs afr-postgres
```

## Backup Strategy

### Database Backup

```bash
# Daily backup script
pg_dump -h localhost -U afr afr > backup_$(date +%Y%m%d).sql
```

### Automated Backups

Set up cron job for automated backups:

```bash
0 2 * * * /path/to/backup-script.sh
```

## Scaling Considerations

### Horizontal Scaling

- Use load balancer for multiple API instances
- Database read replicas for analytics queries
- CDN for static assets

### Performance Optimization

- Enable database connection pooling
- Implement Redis caching for frequently accessed data
- Use database indexes for common queries

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify database is running
   - Check firewall rules

2. **CORS Errors**
   - Verify CORS_ORIGIN setting
   - Check domain configuration

3. **API Key Issues**
   - Ensure API key is set correctly
   - Check key format and permissions

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f web
```

## Maintenance

### Updates

1. Pull latest changes
2. Rebuild containers
3. Test in staging environment
4. Deploy to production

### Database Migrations

The application handles database schema creation automatically. For production:

1. Backup database before updates
2. Test migrations in staging
3. Apply during maintenance windows

## Support

For deployment issues:
1. Check logs for errors
2. Verify environment variables
3. Test connectivity between services
4. Review security configurations
