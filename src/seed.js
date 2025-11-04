require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Service = require('./models/Service');
const Order = require('./models/Order');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry_db');
  console.log('MongoDB Connected');
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Customer.deleteMany({});
    await Service.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data');

    // Seed Customers
    const customers = await Customer.insertMany([
      {
        name: 'สมชาย ใจดี',
        phone: '0812345678',
        email: 'somchai@email.com',
        address: {
          street: '123 ถนนสุขุมวิท',
          city: 'กรุงเทพมหานคร',
          zipCode: '10110'
        },
        loyaltyPoints: 150,
        totalOrders: 5
      },
      {
        name: 'สมหญิง รักสะอาด',
        phone: '0823456789',
        email: 'somying@email.com',
        address: {
          street: '456 ถนนพระราม 4',
          city: 'กรุงเทพมหานคร',
          zipCode: '10120'
        },
        loyaltyPoints: 80,
        totalOrders: 3
      },
      {
        name: 'ประยุทธ์ สะอาดเนี้ยบ',
        phone: '0834567890',
        email: 'prayut@email.com',
        address: {
          street: '789 ถนนลาดพร้าว',
          city: 'กรุงเทพมหานคร',
          zipCode: '10230'
        },
        loyaltyPoints: 200,
        totalOrders: 8
      }
    ]);
    console.log('✅ Seeded customers');

    // Seed Services
    const services = await Service.insertMany([
      {
        name: 'ซักธรรมดา',
        description: 'ซักผ้าทั่วไป เสื้อผ้าประจำวัน',
        price: 40,
        duration: 24,
        category: 'wash'
      },
      {
        name: 'อบแห้ง',
        description: 'อบผ้าแห้ง ไม่รวมซัก',
        price: 30,
        duration: 2,
        category: 'dry'
      },
      {
        name: 'รีดผ้า',
        description: 'รีดผ้าเรียบร้อย พร้อมใส่',
        price: 35,
        duration: 12,
        category: 'iron'
      },
      {
        name: 'ซักรีด',
        description: 'ซักและรีด บริการครบวงจร',
        price: 60,
        duration: 48,
        category: 'wash-and-iron'
      },
      {
        name: 'ซักแห้ง',
        description: 'ซักแห้ง สำหรับผ้าพิเศษ',
        price: 120,
        duration: 72,
        category: 'dry-clean'
      },
      {
        name: 'ซักผ้าห่ม-ผ้านวม',
        description: 'ซักผ้าห่ม ผ้านวม ขนาดใหญ่',
        price: 150,
        duration: 48,
        category: 'special'
      },
      {
        name: 'ซักรองเท้าผ้าใบ',
        description: 'ทำความสะอาดรองเท้าผ้าใบ',
        price: 80,
        duration: 24,
        category: 'special'
      }
    ]);
    console.log('✅ Seeded services');

    // Seed Orders
    const orders = await Order.insertMany([
      {
        customer: customers[0]._id,
        items: [
          {
            service: services[3]._id, // ซักรีด
            quantity: 5,
            price: 60,
            notes: 'เสื้อเชิ้ต 5 ตัว'
          },
          {
            service: services[4]._id, // ซักแห้ง
            quantity: 1,
            price: 120,
            notes: 'สูท 1 ชุด'
          }
        ],
        totalAmount: 420,
        status: 'processing',
        paymentStatus: 'paid',
        pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        notes: 'เร่งด่วน'
      },
      {
        customer: customers[1]._id,
        items: [
          {
            service: services[0]._id, // ซักธรรมดา
            quantity: 10,
            price: 40,
            notes: 'เสื้อผ้าทั่วไป'
          }
        ],
        totalAmount: 400,
        status: 'ready',
        paymentStatus: 'unpaid',
        pickupDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      },
      {
        customer: customers[2]._id,
        items: [
          {
            service: services[5]._id, // ผ้าห่ม-ผ้านวม
            quantity: 2,
            price: 150,
            notes: 'ผ้านวม 2 ผืน'
          },
          {
            service: services[6]._id, // รองเท้าผ้าใบ
            quantity: 2,
            price: 80,
            notes: 'รองเท้าผ้าใบ 2 คู่'
          }
        ],
        totalAmount: 460,
        status: 'pending',
        paymentStatus: 'unpaid',
        pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('✅ Seeded orders');

    console.log('\n🎉 Seed completed successfully!');
    console.log(`📊 Created ${customers.length} customers`);
    console.log(`📊 Created ${services.length} services`);
    console.log(`📊 Created ${orders.length} orders`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
