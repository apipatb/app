# 🚂 Deploy บน Railway

คู่มือการ Deploy Laundry Management App บน Railway (Free tier)

## 📋 สิ่งที่ต้องเตรียม

1. **Railway Account** - สมัครฟรีที่ [railway.app](https://railway.app)
2. **GitHub Account** - สำหรับเชื่อม repository
3. **Railway CLI** (optional) - สำหรับ deploy ผ่าน command line

## 🚀 วิธีที่ 1: Deploy ผ่าน Railway Dashboard (แนะนำ)

### Step 1: สร้าง Project ใหม่

1. เข้า [railway.app](https://railway.app) และ Login
2. คลิก **"New Project"**
3. เลือก **"Deploy from GitHub repo"**
4. เลือก repository ของคุณ
5. Railway จะสร้าง Project ให้อัตโนมัติ

### Step 2: เพิ่ม MongoDB Service

1. ใน Project Dashboard คลิก **"+ New"**
2. เลือก **"Database"** > **"Add MongoDB"**
3. Railway จะสร้าง MongoDB instance ให้
4. คัดลอก **Connection String** (จาก Variables tab)

### Step 3: เพิ่ม Redis Service

1. คลิก **"+ New"** อีกครั้ง
2. เลือก **"Database"** > **"Add Redis"**
3. Railway จะสร้าง Redis instance ให้
4. คัดลอก **REDIS_URL** หรือ **REDIS_PRIVATE_URL**

### Step 4: ตั้งค่า Environment Variables สำหรับ App

1. คลิกที่ **App Service** (ชื่อ repo ของคุณ)
2. ไปที่ tab **"Variables"**
3. เพิ่ม environment variables ดังนี้:

```bash
# Port (Railway จะใช้ PORT variable อัตโนมัติ)
PORT=3000

# Node Environment
NODE_ENV=production

# MongoDB (ใช้ connection string จาก MongoDB service)
MONGODB_URI=mongodb://mongo:password@mongodb.railway.internal:27017/laundry_db

# Redis (ใช้จาก Redis service)
REDIS_HOST=redis.railway.internal
REDIS_PORT=6379

# Cache Settings
CACHE_TTL=3600
```

**💡 Tips:** Railway มี **Reference Variables** ให้ใช้:
- คลิก **"+ New Variable"** > **"Reference"**
- เลือก MongoDB service > เลือก `MONGO_URL`
- ตั้งชื่อว่า `MONGODB_URI`
- ทำเช่นเดียวกันกับ Redis

### Step 5: Deploy

1. Railway จะ **auto-deploy** ทุกครั้งที่ push code ไป GitHub
2. ดู Deployment Logs ใน tab **"Deployments"**
3. ถ้า deploy สำเร็จจะได้ URL เช่น `your-app.up.railway.app`

### Step 6: Generate Domain

1. ไปที่ App Service > tab **"Settings"**
2. ในส่วน **"Networking"** คลิก **"Generate Domain"**
3. คุณจะได้ URL แบบ `https://your-app-name.up.railway.app`

### Step 7: Seed ข้อมูล (Optional)

เนื่องจาก Railway เป็น production environment คุณอาจต้องการ seed ข้อมูล:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run seed command
railway run npm run seed
```

หรือเพิ่ม seed script ใน package.json postinstall (ไม่แนะนำใน production)

## 🚀 วิธีที่ 2: Deploy ผ่าน Railway CLI

### Step 1: ติดตั้ง Railway CLI

```bash
# ติดตั้ง CLI
npm i -g @railway/cli

# หรือใช้ brew (Mac)
brew install railway
```

### Step 2: Login และสร้าง Project

```bash
# Login
railway login

# สร้าง project ใหม่
railway init

# เลือก "Create new project"
# ตั้งชื่อ project เช่น "laundry-management"
```

### Step 3: เพิ่ม Services

```bash
# เพิ่ม MongoDB
railway add --database mongodb

# เพิ่ม Redis
railway add --database redis
```

### Step 4: ตั้งค่า Environment Variables

```bash
# ดู services ที่มี
railway service

# ตั้งค่าตัวแปร
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set CACHE_TTL=3600

# MongoDB และ Redis จะตั้งค่าอัตโนมัติจาก services
```

### Step 5: Deploy

```bash
# Deploy ครั้งแรก
railway up

# ดู logs
railway logs

# เปิด browser ดู project
railway open
```

## 📊 ตรวจสอบ Services

### ดู Logs

```bash
# ผ่าน CLI
railway logs

# หรือดูใน Dashboard > Deployments tab
```

### ทดสอบ API

```bash
# ดู URL ของ app
railway domain

# ทดสอบ
curl https://your-app.up.railway.app/health
curl https://your-app.up.railway.app/api/customers
```

## 🔧 โครงสร้าง Services บน Railway

```
Project: Laundry Management
│
├── App Service (Node.js)
│   ├── Dockerfile
│   ├── Environment Variables
│   └── Public URL: https://xxx.up.railway.app
│
├── MongoDB Service
│   ├── Internal URL: mongodb.railway.internal
│   └── Connection String (private)
│
└── Redis Service
    ├── Internal URL: redis.railway.internal:6379
    └── REDIS_URL (private)
```

## ⚙️ Environment Variables Reference

Railway จะสร้าง environment variables ให้อัตโนมัติ:

### MongoDB Service
```
MONGO_URL=mongodb://...
MONGOHOST=mongodb.railway.internal
MONGOPORT=27017
MONGOUSER=mongo
MONGOPASSWORD=xxx
```

### Redis Service
```
REDIS_URL=redis://...
REDIS_PRIVATE_URL=redis://redis.railway.internal:6379
REDISHOST=redis.railway.internal
REDISPORT=6379
REDISPASSWORD=xxx
```

### App Service (ต้องตั้งเอง)
```
MONGODB_URI=${{MongoDB.MONGO_URL}}
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
PORT=3000
NODE_ENV=production
CACHE_TTL=3600
```

**💡 ใช้ Reference Variables:** `${{ServiceName.VARIABLE_NAME}}`

## 🎯 Auto Deployment

Railway จะ auto-deploy ทุกครั้งที่:
- Push code ไปที่ main branch
- หรือ branch ที่กำหนดไว้

ตั้งค่าใน: **Settings** > **Service** > **Source** > **Branch**

## 💰 Free Tier Limits

Railway Free tier ให้:
- **$5 หรือ 500 ชั่วโมง/เดือน** (ฟรี)
- **1GB RAM** per service
- **1GB Storage**
- **100GB Network Bandwidth**

เพียงพอสำหรับ learning และ testing!

## 🔍 Troubleshooting

### ปัญหา: App ไม่เชื่อมต่อ MongoDB

**แก้ไข:**
1. ตรวจสอบ `MONGODB_URI` ว่าใช้ **Private URL** (`mongodb.railway.internal`)
2. ตรวจสอบว่า MongoDB service รันอยู่
3. ดู logs ของ MongoDB service

### ปัญหา: App crash หรือ timeout

**แก้ไข:**
1. เพิ่ม `PORT` variable = `3000`
2. ตรวจสอบว่า app listen บน `process.env.PORT`
3. ดู logs: `railway logs`

### ปัญหา: Redis connection error

**แก้ไข:**
1. ใช้ `REDIS_PRIVATE_URL` แทน public URL
2. ตรวจสอบว่า Redis service รันอยู่
3. ลอง restart app service

### ปัญหา: Build failed

**แก้ไข:**
1. ตรวจสอบ `package.json` มี `start` script
2. ตรวจสอบ Dockerfile syntax
3. ดู build logs ใน Deployments tab

## 📚 เพิ่มเติม

- [Railway Docs](https://docs.railway.app)
- [Railway Templates](https://railway.app/templates)
- [Railway Discord](https://discord.gg/railway)

## 🎉 สำเร็จ!

หลังจาก deploy แล้ว คุณจะได้:
- ✅ App URL: `https://your-app.up.railway.app`
- ✅ MongoDB instance (managed)
- ✅ Redis instance (managed)
- ✅ Auto-deployment จาก GitHub
- ✅ Monitoring & Logs

**ทดสอบ API:**
```bash
curl https://your-app.up.railway.app/health
curl https://your-app.up.railway.app/api/customers
curl https://your-app.up.railway.app/api/services
```

Happy coding! 🚀
