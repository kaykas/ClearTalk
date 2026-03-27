# ClearTalk AI Server - Deployment Guide

Complete deployment guide for production environments.

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [Railway Deployment](#railway-deployment)
3. [Render Deployment](#render-deployment)
4. [Vercel Deployment](#vercel-deployment)
5. [AWS/DigitalOcean/VPS](#vps-deployment)
6. [Environment Variables](#environment-variables)
7. [Production Checklist](#production-checklist)

---

## Docker Deployment

### Quick Start

```bash
# Build image
docker build -t cleartalk-server .

# Run container
docker run -d \
  --name cleartalk-server \
  -p 3000:3000 \
  --env-file .env \
  cleartalk-server
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Docker Hub

```bash
# Tag image
docker tag cleartalk-server yourusername/cleartalk-server:1.0.0

# Push to Docker Hub
docker push yourusername/cleartalk-server:1.0.0

# Pull and run
docker pull yourusername/cleartalk-server:1.0.0
docker run -d -p 3000:3000 --env-file .env yourusername/cleartalk-server:1.0.0
```

---

## Railway Deployment

Railway offers the easiest deployment with auto-scaling and zero config.

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Step 2: Initialize Project

```bash
cd server
railway init
```

### Step 3: Set Environment Variables

```bash
railway variables set CLAUDE_API_KEY=sk-ant-...
railway variables set SUPABASE_URL=https://xxx.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=...
railway variables set NODE_ENV=production
railway variables set ALLOWED_ORIGINS=https://yourdomain.com
```

### Step 4: Deploy

```bash
railway up
```

Railway will:
- Auto-detect Node.js project
- Install dependencies
- Build TypeScript
- Deploy to production URL
- Provide SSL certificate
- Auto-scale based on traffic

### Get URL

```bash
railway domain
```

### View Logs

```bash
railway logs
```

### Cost
- Free tier: $5/month credit
- Pro: Pay for what you use (~$10-30/month)

---

## Render Deployment

### Step 1: Connect GitHub

1. Go to [render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect your repository

### Step 2: Configure Service

**Settings:**
- Name: `cleartalk-server`
- Environment: `Node`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Instance Type: `Starter` ($7/month)

### Step 3: Environment Variables

Add in Render dashboard:
```
CLAUDE_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://yourdomain.com
```

### Step 4: Deploy

Click "Create Web Service" - Render will auto-deploy on every push to main.

### Custom Domain

1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS records as shown

### Cost
- Starter: $7/month (512MB RAM)
- Standard: $25/month (2GB RAM)

---

## Vercel Deployment

**Note:** Vercel is serverless - some features may need adjustment.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
vercel login
```

### Step 2: Configure vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ]
}
```

### Step 3: Deploy

```bash
npm run build
vercel --prod
```

### Environment Variables

```bash
vercel env add CLAUDE_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### Cost
- Hobby: Free (100GB bandwidth)
- Pro: $20/month (1TB bandwidth)

---

## VPS Deployment

Deploy to AWS, DigitalOcean, Linode, or any VPS.

### Prerequisites

- Ubuntu 22.04 LTS
- Root or sudo access
- Domain name (optional)

### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Clone and Build

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/cleartalk.git
cd cleartalk/server

# Install dependencies
sudo npm install

# Build
sudo npm run build

# Create .env file
sudo nano .env
# Paste environment variables
```

### Step 3: Set Up PM2

```bash
# Start server with PM2
sudo pm2 start dist/index.js --name cleartalk-server

# Enable startup on boot
sudo pm2 startup
sudo pm2 save

# Monitor
pm2 status
pm2 logs cleartalk-server
```

### Step 4: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/cleartalk
```

Paste:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/cleartalk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Enable SSL

```bash
sudo certbot --nginx -d yourdomain.com
```

### Step 6: Set Up Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Maintenance

```bash
# Update code
cd /var/www/cleartalk
sudo git pull
cd server
sudo npm install
sudo npm run build
sudo pm2 restart cleartalk-server

# View logs
pm2 logs cleartalk-server

# Monitor CPU/Memory
pm2 monit
```

### Cost
- DigitalOcean: $6/month (1GB RAM)
- AWS Lightsail: $5/month (1GB RAM)
- Linode: $5/month (1GB RAM)

---

## Environment Variables

### Required

```env
CLAUDE_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

### Optional

```env
PORT=3000                          # Server port (default: 3000)
NODE_ENV=production                # Environment (development|production)
ALLOWED_ORIGINS=https://app.com    # Comma-separated CORS origins
```

### Security Best Practices

1. **Never commit .env to git**
2. **Use secrets management** (Railway Secrets, Render Environment Variables, AWS Secrets Manager)
3. **Rotate API keys** regularly
4. **Use service role keys** (not anon keys) for Supabase

---

## Production Checklist

### Before Deployment

- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` for CORS
- [ ] Enable HTTPS/SSL
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure rate limiting
- [ ] Set up backups (Supabase auto-backups)
- [ ] Test all endpoints
- [ ] Review API costs and set budget alerts

### After Deployment

- [ ] Verify health check: `curl https://yourapi.com/health`
- [ ] Test key endpoints with production credentials
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure log aggregation (Datadog, LogDNA)
- [ ] Set up alerts for errors/downtime
- [ ] Document API URL for frontend team
- [ ] Load test with expected traffic

### Monitoring

**Essential Metrics:**
- Response time by endpoint
- Error rate
- Claude API latency
- Memory/CPU usage
- Request rate

**Recommended Tools:**
- **Application Monitoring**: New Relic, Datadog
- **Error Tracking**: Sentry
- **Uptime**: UptimeRobot (free)
- **Logs**: Papertrail, LogDNA

---

## Scaling Considerations

### Vertical Scaling (Single Server)

- Start with 1GB RAM instance
- Monitor memory usage
- Upgrade to 2GB if >80% usage
- Node.js handles concurrency well (single-threaded event loop)

### Horizontal Scaling (Multiple Servers)

For >1000 concurrent users:

1. **Load Balancer**: Nginx, AWS ALB, Cloudflare
2. **Multiple Server Instances**: 2-4 servers behind load balancer
3. **Session Management**: Stateless JWT tokens (no server-side sessions)
4. **Database**: Supabase scales automatically
5. **Caching**: Redis for BIFF score caching

### Cost Optimization

**Current setup (single server):**
- Server: $7-25/month
- Claude API: $4.65/user/month
- Supabase: Free (up to 500MB, 2GB bandwidth)

**At 1000 users:**
- Server: $25-50/month (2-4 instances)
- Claude API: $4,650/month
- Supabase: $25/month (Pro plan)
- Total: ~$4,700/month

**Optimization strategies:**
1. Cache BIFF scores for duplicate messages (50% savings)
2. Use Haiku for all operations (vs Sonnet) (40% cost reduction)
3. Batch operations where possible
4. Implement rate limiting per user

---

## Rollback Procedure

### Railway/Render
```bash
# Revert to previous deployment in dashboard
# Or: deploy specific commit
railway up --commit abc123
```

### Docker
```bash
# Pull previous version
docker pull yourusername/cleartalk-server:0.9.0

# Stop current container
docker stop cleartalk-server
docker rm cleartalk-server

# Run previous version
docker run -d --name cleartalk-server -p 3000:3000 --env-file .env \
  yourusername/cleartalk-server:0.9.0
```

### VPS (PM2)
```bash
cd /var/www/cleartalk
git checkout <previous-commit>
cd server
npm install
npm run build
pm2 restart cleartalk-server
```

---

## Troubleshooting

### Server Won't Start

```bash
# Check logs
pm2 logs cleartalk-server
# or
docker logs cleartalk-server

# Common issues:
# - Missing environment variables
# - Port already in use
# - Build errors
```

### High Memory Usage

```bash
# Check memory
free -h
# or
pm2 monit

# Solutions:
# - Restart server: pm2 restart cleartalk-server
# - Increase instance size
# - Investigate memory leaks
```

### Slow Response Times

```bash
# Check Claude API latency
curl -w "@curl-format.txt" https://yourapi.com/api/messages/score

# Solutions:
# - Use Haiku instead of Sonnet
# - Enable caching
# - Add CDN (Cloudflare)
```

### Database Connection Errors

```bash
# Verify Supabase credentials
curl https://YOUR-PROJECT.supabase.co/rest/v1/
-H "apikey: YOUR-SERVICE-ROLE-KEY"

# Check Supabase dashboard for:
# - Project paused (free tier inactivity)
# - Network restrictions
# - Invalid credentials
```

---

## Support

- **Documentation**: See `README.md`
- **Issues**: [GitHub Issues]
- **Email**: support@cleartalk.app
- **Status Page**: [status.cleartalk.app]

---

## Security Updates

Subscribe to security advisories:
- Node.js security releases
- Anthropic API changes
- Supabase security updates

Update dependencies regularly:
```bash
npm audit
npm audit fix
npm update
```

---

**You're now ready for production!** 🚀

Choose your deployment platform and follow the steps above. For most teams, Railway or Render offer the best balance of ease and performance.
