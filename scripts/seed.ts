import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/furnimart?authSource=admin';

// Schemas
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: String,
  role: { type: String, enum: ['customer', 'employee', 'manager', 'shipper', 'admin'], default: 'customer' },
  address: String,
  addresses: [{
    name: String,
    phone: String,
    street: String,
    ward: String,
    district: String,
    city: String,
    isDefault: { type: Boolean, default: false },
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true },
  description: String,
  image: String,
  parentId: String,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  images: [String],
  model3d: String,
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  category: { type: String, required: true },
  materials: [String],
  colors: [String],
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    unit: String,
  },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

const BranchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  address: {
    street: String,
    ward: String,
    district: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  phone: { type: String, required: true },
  email: String,
  managerId: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'active', 'inactive'], default: 'pending' },
  registrationData: {
    businessLicense: String,
    taxCode: String,
    ownerName: String,
    ownerPhone: String,
    ownerEmail: String,
    documents: [String],
  },
  approvedBy: String,
  approvedAt: Date,
  rejectedReason: String,
  isActive: { type: Boolean, default: true },
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Category = mongoose.model('Category', CategorySchema);
const Product = mongoose.model('Product', ProductSchema);
const Branch = mongoose.model('Branch', BranchSchema);

async function seed() {
  try {
    console.log('🌱 Bắt đầu seed dữ liệu...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB\n');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // await Category.deleteMany({});
    // await Product.deleteMany({});
    // await Branch.deleteMany({});

    // 1. Seed Users
    console.log('📝 Đang tạo users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      {
        email: 'admin@furnimart.com',
        password: hashedPassword,
        name: 'Administrator',
        phone: '0901234567',
        role: 'admin',
        isActive: true,
      },
      {
        email: 'manager@furnimart.com',
        password: hashedPassword,
        name: 'Branch Manager',
        phone: '0901234568',
        role: 'manager',
        isActive: true,
      },
      {
        email: 'employee@furnimart.com',
        password: hashedPassword,
        name: 'Employee User',
        phone: '0901234569',
        role: 'employee',
        isActive: true,
      },
      {
        email: 'shipper@furnimart.com',
        password: hashedPassword,
        name: 'Shipper User',
        phone: '0901234570',
        role: 'shipper',
        isActive: true,
      },
      {
        email: 'customer@furnimart.com',
        password: hashedPassword,
        name: 'Customer User',
        phone: '0901234571',
        role: 'customer',
        isActive: true,
        addresses: [{
          name: 'Nhà riêng',
          phone: '0901234571',
          street: '123 Nguyễn Văn Linh',
          ward: 'Phường Tân Phong',
          district: 'Quận 7',
          city: 'Hồ Chí Minh',
          isDefault: true,
        }],
      },
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create(userData);
        console.log(`  ✅ Đã tạo user: ${userData.email} (${userData.role})`);
      } else {
        console.log(`  ⏭️  User đã tồn tại: ${userData.email}`);
      }
    }
    console.log('');

    // 2. Seed Categories
    console.log('📝 Đang tạo categories...');
    const categories = [
      {
        name: 'Ghế',
        slug: 'ghe',
        description: 'Ghế sofa, ghế văn phòng, ghế ăn',
        sortOrder: 1,
        isActive: true,
      },
      {
        name: 'Bàn',
        slug: 'ban',
        description: 'Bàn ăn, bàn làm việc, bàn trà',
        sortOrder: 2,
        isActive: true,
      },
      {
        name: 'Tủ',
        slug: 'tu',
        description: 'Tủ quần áo, tủ kệ, tủ bếp',
        sortOrder: 3,
        isActive: true,
      },
      {
        name: 'Giường',
        slug: 'giuong',
        description: 'Giường ngủ, giường tầng, nệm',
        sortOrder: 4,
        isActive: true,
      },
      {
        name: 'Kệ',
        slug: 'ke',
        description: 'Kệ tivi, kệ sách, kệ trang trí',
        sortOrder: 5,
        isActive: true,
      },
    ];

    const createdCategories = [];
    for (const catData of categories) {
      const existingCat = await Category.findOne({ slug: catData.slug });
      if (!existingCat) {
        const cat = await Category.create(catData);
        createdCategories.push(cat);
        console.log(`  ✅ Đã tạo category: ${catData.name}`);
      } else {
        createdCategories.push(existingCat);
        console.log(`  ⏭️  Category đã tồn tại: ${catData.name}`);
      }
    }
    console.log('');

    // 3. Seed Products
    console.log('📝 Đang tạo products...');
    const products = [
      {
        name: 'Ghế Sofa Da Cao Cấp',
        description: 'Ghế sofa da bò nhập khẩu, thiết kế hiện đại, màu nâu sang trọng. Phù hợp cho phòng khách rộng rãi.',
        price: 15000000,
        discount: 10,
        stock: 20,
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
        categoryId: createdCategories[0]._id,
        category: 'Ghế',
        materials: ['Da', 'Gỗ'],
        colors: ['Nâu', 'Đen'],
        dimensions: { length: 220, width: 95, height: 85, weight: 80, unit: 'cm' },
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Bàn Ăn Gỗ Sồi 6 Người',
        description: 'Bàn ăn gỗ sồi tự nhiên, chân chữ X, có thể mở rộng thành 8 người. Thiết kế cổ điển, bền đẹp.',
        price: 8000000,
        discount: 5,
        stock: 15,
        images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],
        categoryId: createdCategories[1]._id,
        category: 'Bàn',
        materials: ['Gỗ Sồi'],
        colors: ['Nâu', 'Vàng'],
        dimensions: { length: 180, width: 90, height: 75, weight: 45, unit: 'cm' },
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Tủ Quần Áo 4 Cánh',
        description: 'Tủ quần áo 4 cánh, ngăn kéo lớn, kệ treo. Màu trắng sáng, phù hợp mọi không gian phòng ngủ.',
        price: 12000000,
        discount: 0,
        stock: 25,
        images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'],
        categoryId: createdCategories[2]._id,
        category: 'Tủ',
        materials: ['MDF', 'Laminate'],
        colors: ['Trắng', 'Xám'],
        dimensions: { length: 200, width: 60, height: 220, weight: 120, unit: 'cm' },
        isFeatured: false,
        isActive: true,
      },
      {
        name: 'Giường Ngủ Gỗ Tự Nhiên',
        description: 'Giường ngủ gỗ tự nhiên, đầu giường có họa tiết chạm khắc tinh xảo. Size 1m6, phù hợp cặp đôi.',
        price: 10000000,
        discount: 15,
        stock: 12,
        images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'],
        categoryId: createdCategories[3]._id,
        category: 'Giường',
        materials: ['Gỗ Tự Nhiên'],
        colors: ['Nâu', 'Vàng'],
        dimensions: { length: 200, width: 160, height: 100, weight: 80, unit: 'cm' },
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Kệ Tivi Hiện Đại',
        description: 'Kệ tivi phong cách hiện đại, nhiều ngăn kệ để đồ. Màu đen bóng, chân kim loại chắc chắn.',
        price: 3500000,
        discount: 0,
        stock: 30,
        images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'],
        categoryId: createdCategories[4]._id,
        category: 'Kệ',
        materials: ['MDF', 'Kim loại'],
        colors: ['Đen', 'Trắng'],
        dimensions: { length: 180, width: 40, height: 50, weight: 35, unit: 'cm' },
        isFeatured: false,
        isActive: true,
      },
      {
        name: 'Ghế Văn Phòng Ergonomic',
        description: 'Ghế văn phòng ergonomic, tựa lưng cao, điều chỉnh độ cao. Màu xám, phù hợp môi trường làm việc.',
        price: 2500000,
        discount: 10,
        stock: 50,
        images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800'],
        categoryId: createdCategories[0]._id,
        category: 'Ghế',
        materials: ['Nhựa', 'Vải', 'Kim loại'],
        colors: ['Xám', 'Đen'],
        dimensions: { length: 65, width: 60, height: 120, weight: 15, unit: 'cm' },
        isFeatured: false,
        isActive: true,
      },
      {
        name: 'Bàn Làm Việc Gỗ MDF',
        description: 'Bàn làm việc hiện đại, ngăn kéo tiện lợi, chân kim loại. Kích thước lớn, phù hợp làm việc tại nhà.',
        price: 4500000,
        discount: 5,
        stock: 20,
        images: ['https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800'],
        categoryId: createdCategories[1]._id,
        category: 'Bàn',
        materials: ['MDF', 'Laminate'],
        colors: ['Trắng', 'Xám'],
        dimensions: { length: 150, width: 70, height: 75, weight: 30, unit: 'cm' },
        isFeatured: false,
        isActive: true,
      },
      {
        name: 'Kệ Sách 5 Tầng',
        description: 'Kệ sách 5 tầng, thiết kế mở, dễ dàng sắp xếp. Màu nâu, phù hợp phòng khách và phòng làm việc.',
        price: 2800000,
        discount: 0,
        stock: 40,
        images: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800'],
        categoryId: createdCategories[4]._id,
        category: 'Kệ',
        materials: ['Gỗ', 'MDF'],
        colors: ['Nâu', 'Trắng'],
        dimensions: { length: 80, width: 30, height: 180, weight: 25, unit: 'cm' },
        isFeatured: false,
        isActive: true,
      },
    ];

    for (const prodData of products) {
      const existingProd = await Product.findOne({ name: prodData.name });
      if (!existingProd) {
        await Product.create(prodData);
        console.log(`  ✅ Đã tạo product: ${prodData.name}`);
      } else {
        console.log(`  ⏭️  Product đã tồn tại: ${prodData.name}`);
      }
    }
    console.log('');

    // 4. Seed Branches
    console.log('📝 Đang tạo branches...');
    const manager = await User.findOne({ role: 'manager' });
    const branches = [
      {
        name: 'Chi Nhánh Quận 1',
        description: 'Showroom chính tại trung tâm TP.HCM',
        address: {
          street: '123 Nguyễn Huệ',
          ward: 'Phường Bến Nghé',
          district: 'Quận 1',
          city: 'Hồ Chí Minh',
          coordinates: { lat: 10.7769, lng: 106.7009 },
        },
        phone: '02838291234',
        email: 'quan1@furnimart.com',
        managerId: manager?._id.toString(),
        status: 'active',
        isActive: true,
        totalOrders: 0,
        totalRevenue: 0,
      },
      {
        name: 'Chi Nhánh Quận 7',
        description: 'Showroom tại khu đô thị mới',
        address: {
          street: '456 Nguyễn Thị Thập',
          ward: 'Phường Tân Phong',
          district: 'Quận 7',
          city: 'Hồ Chí Minh',
          coordinates: { lat: 10.7314, lng: 106.7214 },
        },
        phone: '02838785678',
        email: 'quan7@furnimart.com',
        status: 'active',
        isActive: true,
        totalOrders: 0,
        totalRevenue: 0,
      },
      {
        name: 'Chi Nhánh Quận 2',
        description: 'Showroom tại Thủ Đức',
        address: {
          street: '789 Võ Văn Ngân',
          ward: 'Phường Linh Chiểu',
          district: 'Thủ Đức',
          city: 'Hồ Chí Minh',
          coordinates: { lat: 10.8604, lng: 106.7578 },
        },
        phone: '02838901234',
        email: 'thuduc@furnimart.com',
        status: 'active',
        isActive: true,
        totalOrders: 0,
        totalRevenue: 0,
      },
    ];

    for (const branchData of branches) {
      const existingBranch = await Branch.findOne({ name: branchData.name });
      if (!existingBranch) {
        await Branch.create(branchData);
        console.log(`  ✅ Đã tạo branch: ${branchData.name}`);
      } else {
        console.log(`  ⏭️  Branch đã tồn tại: ${branchData.name}`);
      }
    }
    console.log('');

    console.log('✨ Seed dữ liệu hoàn tất!\n');
    console.log('📊 Tổng kết:');
    console.log(`  - Users: ${await User.countDocuments()}`);
    console.log(`  - Categories: ${await Category.countDocuments()}`);
    console.log(`  - Products: ${await Product.countDocuments()}`);
    console.log(`  - Branches: ${await Branch.countDocuments()}\n`);

    await mongoose.disconnect();
    console.log('✅ Đã ngắt kết nối MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
