# Laundry Management System

ระบบจัดการร้านซักรีด (Laundry Management System) สำหรับการเรียนรู้การใช้งาน **Redis** และ **MongoDB** ร่วมกัน

## 🎯 คุณสมบัติ

- 📦 **MongoDB** - เก็บข้อมูลหลัก (Customers, Services, Orders)
- ⚡ **Redis** - Caching และ Queue Management
- 🚀 **Express.js** - RESTful API
- 🐳 **Docker** - Container สำหรับ Development

## 🏗️ สถาปัตยกรรม

### MongoDB (Persistent Storage)
- **Customers** - ข้อมูลลูกค้า
- **Services** - รายการบริการซักรีด
- **Orders** - คำสั่งซื้อ/รายการซัก

### Redis (Caching & Queue)
- **Caching** - Cache ข้อมูล Customer และ Service ลดการ query MongoDB
- **Order Status Tracking** - ติดตามสถานะ Order แบบ Real-time
- **Queue Management** - จัดการคิวงานตามสถานะ

## 📁 โครงสร้างโปรเจค

```
.
├── src/
│   ├── config/
│   │   ├── database.js      # MongoDB connection
│   │   └── redis.js         # Redis connection
│   ├── models/
│   │   ├── Customer.js      # Customer schema
│   │   ├── Service.js       # Service schema
│   │   └── Order.js         # Order schema
│   ├── controllers/
│   │   ├── customerController.js
│   │   ├── serviceController.js
│   │   └── orderController.js
│   ├── routes/
│   │   ├── customerRoutes.js
│   │   ├── serviceRoutes.js
│   │   └── orderRoutes.js
│   ├── utils/
│   │   └── cache.js         # Redis caching utilities
│   ├── index.js             # Main application
│   └── seed.js              # Seed data script
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## 🚀 การติดตั้งและรัน

### วิธีที่ 1: ใช้ Docker (แนะนำ)

```bash
# 1. Clone และเข้าโปรเจค
cd /path/to/project

# 2. สร้างไฟล์ .env
cp .env.example .env

# 3. รัน Docker Compose
docker-compose up -d

# 4. ตรวจสอบว่าทุก service ทำงาน
docker-compose ps

# 5. Seed ข้อมูลตัวอย่าง
docker-compose exec app npm run seed
```

### วิธีที่ 2: รันแบบ Local

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. เปิด MongoDB และ Redis (ต้องติดตั้งก่อน)
# MongoDB: mongodb://localhost:27017
# Redis: localhost:6379

# 3. สร้างไฟล์ .env
cp .env.example .env

# 4. แก้ไข .env ให้เชื่อมต่อกับ local
# MONGODB_URI=mongodb://localhost:27017/laundry_db
# REDIS_HOST=localhost
# REDIS_PORT=6379

# 5. Seed ข้อมูลตัวอย่าง
node src/seed.js

# 6. รัน server
npm run dev
```

## 📡 API Endpoints

### Customers

```bash
# Get all customers (with caching)
GET /api/customers

# Get customer by ID (with caching)
GET /api/customers/:id

# Search customer by phone
GET /api/customers/search?phone=0812345678

# Create new customer
POST /api/customers
Body: {
  "name": "สมชาย ใจดี",
  "phone": "0812345678",
  "email": "somchai@email.com",
  "address": {
    "street": "123 ถนนสุขุมวิท",
    "city": "กรุงเทพมหานคร",
    "zipCode": "10110"
  }
}

# Update customer
PUT /api/customers/:id

# Delete customer
DELETE /api/customers/:id
```

### Services

```bash
# Get all services (with caching)
GET /api/services

# Filter by category
GET /api/services?category=wash

# Get active services only
GET /api/services?active=true

# Get service by ID
GET /api/services/:id

# Create new service
POST /api/services
Body: {
  "name": "ซักรีด",
  "description": "ซักและรีด บริการครบวงจร",
  "price": 60,
  "duration": 48,
  "category": "wash-and-iron"
}

# Update service
PUT /api/services/:id

# Delete service
DELETE /api/services/:id
```

### Orders

```bash
# Get all orders
GET /api/orders

# Filter by status
GET /api/orders?status=processing

# Filter by customer
GET /api/orders?customer=<customer_id>

# Get order by ID
GET /api/orders/:id

# Get order by order number
GET /api/orders/number/ORD2501000001

# Get orders in Redis queue by status
GET /api/orders/queue/processing

# Create new order
POST /api/orders
Body: {
  "customer": "<customer_id>",
  "items": [
    {
      "service": "<service_id>",
      "quantity": 5,
      "price": 60,
      "notes": "เสื้อเชิ้ต 5 ตัว"
    }
  ],
  "totalAmount": 300,
  "status": "pending",
  "paymentStatus": "unpaid",
  "pickupDate": "2025-11-06T10:00:00Z",
  "notes": "เร่งด่วน"
}

# Update order
PUT /api/orders/:id

# Update order status only (tracked in Redis)
PATCH /api/orders/:id/status
Body: {
  "status": "processing"
}

# Delete order
DELETE /api/orders/:id
```

### Health Check

```bash
GET /health
GET /
```

## 🎓 สิ่งที่จะได้เรียนรู้

### 1. MongoDB
- Schema design ด้วย Mongoose
- Relationships (ref และ populate)
- Indexing สำหรับ performance
- Pre-save hooks
- Query optimization

### 2. Redis
- **Caching Pattern** - Cache-aside (Lazy Loading)
  - ลด database load
  - เพิ่มความเร็วในการ query
  - TTL (Time To Live) management

- **Queue Management**
  - ใช้ Redis Lists เป็น Queue
  - Track order status real-time
  - Process orders by status

### 3. Integration
- ใช้ MongoDB เก็บข้อมูลถาวร
- ใช้ Redis caching เพื่อลดการ query
- Cache invalidation เมื่อข้อมูลเปลี่ยน
- Real-time tracking ด้วย Redis

## 🧪 ทดสอบการทำงาน

### ทดสอบ Caching

```bash
# 1. Query customer ครั้งแรก (จาก MongoDB)
curl http://localhost:3000/api/customers

# 2. Query อีกครั้ง (จาก Redis cache) - เร็วกว่า
curl http://localhost:3000/api/customers

# 3. ดูข้อมูลใน Redis
docker-compose exec redis redis-cli
> KEYS customers:*
> GET customers:all
```

### ทดสอบ Order Tracking

```bash
# 1. สร้าง order ใหม่
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{...}'

# 2. Update status
curl -X PATCH http://localhost:3000/api/orders/<order_id>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "processing"}'

# 3. ดู order ใน Redis queue
curl http://localhost:3000/api/orders/queue/processing

# 4. ตรวจสอบใน Redis
docker-compose exec redis redis-cli
> KEYS order:*
> LRANGE queue:orders:processing 0 -1
```

## 🔧 คำสั่งที่มีประโยชน์

### Docker

```bash
# ดู logs
docker-compose logs -f app

# เข้า MongoDB shell
docker-compose exec mongodb mongosh -u admin -p password123

# เข้า Redis CLI
docker-compose exec redis redis-cli

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Remove volumes (ลบข้อมูลทั้งหมด)
docker-compose down -v
```

### MongoDB Commands

```bash
# ใน MongoDB shell
use laundry_db
db.customers.find().pretty()
db.orders.find().pretty()
db.services.find().pretty()

# Count documents
db.orders.countDocuments({ status: "processing" })

# Aggregate
db.orders.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

### Redis Commands

```bash
# ใน Redis CLI
KEYS *                    # ดู keys ทั้งหมด
GET <key>                 # ดูค่าของ key
TTL <key>                 # ดูเวลาหมดอายุ
DEL <key>                 # ลบ key
FLUSHALL                  # ลบทุกอย่าง (ระวัง!)

# Queue commands
LRANGE queue:orders:pending 0 -1     # ดู pending orders
LLEN queue:orders:processing         # จำนวน processing orders
```

## 📚 เอกสารเพิ่มเติม

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [Mongoose Guide](https://mongoosejs.com/docs/guide.html)
- [Node Redis](https://github.com/redis/node-redis)

## 🤝 Contributing

สามารถ fork และส่ง pull request ได้เลย!

## 📄 License

MIT License
