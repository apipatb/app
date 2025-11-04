# API Testing Examples

ตัวอย่างการเรียกใช้ API ด้วย curl

## Customers API

### Get all customers
```bash
curl http://localhost:3000/api/customers
```

### Get customer by ID
```bash
curl http://localhost:3000/api/customers/<customer_id>
```

### Search customer by phone
```bash
curl http://localhost:3000/api/customers/search?phone=0812345678
```

### Create new customer
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ทดสอบ ระบบ",
    "phone": "0899999999",
    "email": "test@email.com",
    "address": {
      "street": "999 ถนนทดสอบ",
      "city": "กรุงเทพมหานคร",
      "zipCode": "10000"
    }
  }'
```

### Update customer
```bash
curl -X PUT http://localhost:3000/api/customers/<customer_id> \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ทดสอบ ระบบ (แก้ไข)",
    "loyaltyPoints": 300
  }'
```

### Delete customer
```bash
curl -X DELETE http://localhost:3000/api/customers/<customer_id>
```

## Services API

### Get all services
```bash
curl http://localhost:3000/api/services
```

### Get services by category
```bash
curl http://localhost:3000/api/services?category=wash
```

### Get active services only
```bash
curl http://localhost:3000/api/services?active=true
```

### Create new service
```bash
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ซักด่วน",
    "description": "ซักเสร็จใน 12 ชั่วโมง",
    "price": 80,
    "duration": 12,
    "category": "wash"
  }'
```

## Orders API

### Get all orders
```bash
curl http://localhost:3000/api/orders
```

### Get orders by status
```bash
curl http://localhost:3000/api/orders?status=processing
```

### Get orders by customer
```bash
curl http://localhost:3000/api/orders?customer=<customer_id>
```

### Get order by order number
```bash
curl http://localhost:3000/api/orders/number/ORD2501000001
```

### Get orders in Redis queue
```bash
curl http://localhost:3000/api/orders/queue/pending
curl http://localhost:3000/api/orders/queue/processing
curl http://localhost:3000/api/orders/queue/ready
```

### Create new order
```bash
# ต้องใช้ customer_id และ service_id ที่มีอยู่จริง
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
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
    "notes": "ขอรับเย็นวันนี้"
  }'
```

### Update order status (tracked in Redis)
```bash
curl -X PATCH http://localhost:3000/api/orders/<order_id>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "processing"}'
```

Status values: `pending`, `processing`, `ready`, `completed`, `cancelled`

## Testing Cache

### Test customer caching
```bash
# First request - from MongoDB (slower)
time curl http://localhost:3000/api/customers

# Second request - from Redis cache (faster)
time curl http://localhost:3000/api/customers
```

### Check Redis cache
```bash
# Connect to Redis
docker-compose exec redis redis-cli

# See all cached keys
KEYS *

# Get cached customers
GET customers:all

# Check TTL (time to live)
TTL customers:all

# Delete cache
DEL customers:all

# Delete all customer-related cache
KEYS customers:*
```

### Monitor Redis in real-time
```bash
docker-compose exec redis redis-cli MONITOR
```

## Full Workflow Example

```bash
# 1. Create a customer
CUSTOMER_ID=$(curl -s -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ลูกค้าทดสอบ",
    "phone": "0888888888",
    "email": "test@test.com"
  }' | jq -r '.data._id')

echo "Created customer: $CUSTOMER_ID"

# 2. Get a service ID
SERVICE_ID=$(curl -s http://localhost:3000/api/services | jq -r '.data[0]._id')

echo "Using service: $SERVICE_ID"

# 3. Create an order
ORDER_ID=$(curl -s -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"customer\": \"$CUSTOMER_ID\",
    \"items\": [
      {
        \"service\": \"$SERVICE_ID\",
        \"quantity\": 3,
        \"price\": 60
      }
    ],
    \"totalAmount\": 180,
    \"status\": \"pending\"
  }" | jq -r '.data._id')

echo "Created order: $ORDER_ID"

# 4. Update order status to processing
curl -X PATCH http://localhost:3000/api/orders/$ORDER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "processing"}'

# 5. Check orders in processing queue
curl http://localhost:3000/api/orders/queue/processing

# 6. Mark as ready
curl -X PATCH http://localhost:3000/api/orders/$ORDER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "ready"}'

# 7. Get order details
curl http://localhost:3000/api/orders/$ORDER_ID
```
