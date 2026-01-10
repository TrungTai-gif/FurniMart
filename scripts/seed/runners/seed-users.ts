
import { User, Branch } from '../utils/models';
import { hashPassword } from '../utils/helpers';

export async function seedUsers() {
    console.log('👤 Seeding Users...');

    const branches = await Branch.find({});
    if (branches.length === 0) {
        throw new Error('Branches must be seeded before Users');
    }

    const branch1 = branches.find(b => b.code === 'B001');
    const branch2 = branches.find(b => b.code === 'B002');

    const commonPassword = await hashPassword('password123');
    const adminPassword = await hashPassword('admin123');

    const usersData = [
        // 1. Admin
        {
            email: 'admin@furnimart.com',
            password: adminPassword,
            name: 'Super Admin',
            role: 'admin',
            phone: '0909000000',
            isActive: true,
        },
        // 2. Branch Managers
        {
            email: 'manager_d1@furnimart.com',
            password: commonPassword,
            name: 'Manager District 1',
            role: 'branch_manager',
            branchId: branch1?._id,
            phone: '0909000001',
            isActive: true,
        },
        {
            email: 'manager_d7@furnimart.com',
            password: commonPassword,
            name: 'Manager District 7',
            role: 'branch_manager',
            branchId: branch2?._id,
            phone: '0909000002',
            isActive: true,
        },
        // 3. Employees
        {
            email: 'staff_d1@furnimart.com',
            password: commonPassword,
            name: 'Staff District 1',
            role: 'employee',
            branchId: branch1?._id,
            phone: '0909000003',
            isActive: true,
        },
        {
            email: 'staff_d7@furnimart.com',
            password: commonPassword,
            name: 'Staff District 7',
            role: 'employee',
            branchId: branch2?._id,
            phone: '0909000004',
            isActive: true,
        },
        // 4. Shippers
        {
            email: 'shipper_d1@furnimart.com',
            password: commonPassword,
            name: 'Shipper One',
            role: 'shipper',
            branchId: branch1?._id,
            phone: '0909000005',
            isActive: true,
        },
        {
            email: 'shipper_d7@furnimart.com',
            password: commonPassword,
            name: 'Shipper Two',
            role: 'shipper',
            branchId: branch2?._id,
            phone: '0909000006',
            isActive: true,
        },
        // 5. Customers
        {
            email: 'customer1@gmail.com',
            password: commonPassword,
            name: 'Alice Nguyen',
            role: 'customer',
            phone: '0909111222',
            isActive: true,
            addresses: [{
                name: 'Home',
                phone: '0909111222',
                street: '10 Le Loi',
                ward: 'Ben Nghe',
                district: 'District 1',
                city: 'Ho Chi Minh City',
                isDefault: true
            }]
        },
        {
            email: 'customer2@gmail.com',
            password: commonPassword,
            name: 'Bob Tran',
            role: 'customer',
            phone: '0909333444',
            isActive: true,
            addresses: [{
                name: 'Office',
                phone: '0909333444',
                street: '20 Nguyen Van Linh',
                ward: 'Tan Phong',
                district: 'District 7',
                city: 'Ho Chi Minh City',
                isDefault: true
            }]
        },
    ];

    const results = [];
    for (const user of usersData) {
        const u = await User.findOneAndUpdate(
            { email: user.email },
            user,
            { upsert: true, new: true }
        );
        results.push(u);
    }
    console.log(`✅ Seeded ${results.length} users.`);
    return results;
}
