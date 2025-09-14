# 🚀 LLM Tracker Deployment Guide

## 🌐 **Domain Setup: `llmtracker.dev`**

### **DNS Configuration Required:**

```bash
# Main Domain (llmtracker.dev)
Type: A
Name: @
Value: [Vercel IP - provided after deployment]

# API Subdomain (api.llmtracker.dev)  
Type: CNAME
Name: api
Value: [Railway URL - provided after deployment]

# WWW Redirect
Type: CNAME  
Name: www
Value: llmtracker.dev
```

## 🚀 **Step-by-Step Deployment**

### **1. Deploy API to Railway**

1. **Sign up at [Railway.app](https://railway.app)**
2. **Create New Project** → "Deploy from GitHub repo"
3. **Connect your repository**
4. **Configure Environment Variables:**
   ```bash
   DATABASE_URL=postgresql://[Railway provides]
   PORT=4000
   NODE_ENV=production
   CORS_ORIGIN=https://llmtracker.dev
   DB_POOL_MAX=20
   DB_IDLE_TIMEOUT=30000
   DB_CONNECTION_TIMEOUT=2000
   ```
5. **Deploy** → Railway gives you: `https://api-production-xxxx.up.railway.app`

### **2. Configure API Custom Domain**

1. **In Railway Dashboard:**
   - Go to project settings → "Domains"
   - Add custom domain: `api.llmtracker.dev`
   - Railway provides DNS instructions

2. **Add DNS Record:**
   ```bash
   Type: CNAME
   Name: api  
   Value: [Railway provides this]
   ```

### **3. Deploy Web App to Vercel**

1. **Sign up at [Vercel.com](https://vercel.com)**
2. **Import Project** from GitHub
3. **Configure Environment Variables:**
   ```bash
   NEXT_PUBLIC_API_URL=https://api.llmtracker.dev
   NEXT_PUBLIC_API_KEY=[Generate secure key]
   NEXT_PUBLIC_APP_ENV=production
   ```
4. **Deploy** → Vercel gives you: `https://llm-tracker.vercel.app`

### **4. Configure Main Domain**

1. **In Vercel Dashboard:**
   - Go to project settings → "Domains"
   - Add custom domain: `llmtracker.dev`
   - Vercel provides DNS instructions

2. **Add DNS Record:**
   ```bash
   Type: A
   Name: @
   Value: [Vercel IP address]
   ```

## 🔐 **Security Setup**

### **Generate API Keys:**
```bash
# Generate secure API key
openssl rand -hex 32
# Use this as NEXT_PUBLIC_API_KEY
```

### **Database Security:**
- Railway PostgreSQL is secure by default
- Use strong passwords
- Enable SSL connections

## 📊 **Monitoring Setup**

### **Health Checks:**
- API: `https://api.llmtracker.dev/health`
- Web: Built-in Vercel health checks

### **Logs:**
- Railway: Built-in logging dashboard
- Vercel: Built-in analytics

## 🎯 **Testing Your Deployment**

### **1. Test API:**
```bash
curl https://api.llmtracker.dev/health
# Should return: {"ok": true}
```

### **2. Test Web App:**
- Visit: `https://llmtracker.dev`
- Should load landing page
- Test signup flow
- Test dashboard access

### **3. Test Extension:**
- Load unpacked extension
- Visit any website
- Check if events are captured

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **CORS Errors:**
   - Check `CORS_ORIGIN` in Railway environment
   - Ensure it matches your domain exactly

2. **API Key Issues:**
   - Verify `NEXT_PUBLIC_API_KEY` is set correctly
   - Check API key format in database

3. **Domain Not Working:**
   - Wait for DNS propagation (up to 24 hours)
   - Check DNS records are correct
   - Verify SSL certificate is issued

## 🎉 **Post-Deployment Checklist**

- [ ] API responds at `https://api.llmtracker.dev/health`
- [ ] Web app loads at `https://llmtracker.dev`
- [ ] Authentication flow works
- [ ] Extension captures events
- [ ] Dashboard displays data
- [ ] SSL certificates are valid
- [ ] Analytics are working

## 💰 **Cost Breakdown**

### **Railway (API):**
- Free tier: $5/month credit
- PostgreSQL: Included
- Custom domain: Free

### **Vercel (Web App):**
- Free tier: 100GB bandwidth
- Pro plan: $20/month (recommended for production)
- Custom domain: Free

### **Domain:**
- `llmtracker.dev`: Already owned
- DNS management: Usually included

**Total Cost: ~$20-25/month for production setup**

## 🚀 **Go Live Checklist**

- [ ] Deploy API to Railway
- [ ] Deploy web app to Vercel  
- [ ] Configure DNS records
- [ ] Test all functionality
- [ ] Set up monitoring
- [ ] Create first workspace
- [ ] Test extension
- [ ] Launch marketing campaign

**You're ready to go live! 🎉**
