
import { Product, Category } from '../utils/models';

const productList = [
    // Sofa
    { name: 'Luxury Leather Sofa', slug: 'luxury-leather-sofa', category: 'sofa', price: 15000000, materials: ['Leather', 'Wood'], colors: ['Black', 'Brown'], stock: 100, dimensions: { length: 200, width: 90, height: 85, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80'], isFeatured: true },
    { name: 'Fabric Sectional Sofa', slug: 'fabric-sectional-sofa', category: 'sofa', price: 12000000, materials: ['Fabric', 'Wood'], colors: ['Gray', 'Beige'], stock: 100, dimensions: { length: 250, width: 150, height: 80, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Velvet Armchair', slug: 'velvet-armchair', category: 'sofa', price: 5000000, materials: ['Velvet', 'Wood'], colors: ['Blue', 'Pink', 'Gray'], stock: 100, dimensions: { length: 80, width: 80, height: 90, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=800&q=80'] },

    // Table
    { name: 'Oak Dining Table', slug: 'oak-dining-table', category: 'table', price: 8000000, materials: ['Oak Wood'], colors: ['Natural', 'Walnut'], stock: 100, dimensions: { length: 180, width: 90, height: 75, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80'], isFeatured: true },
    { name: 'Glass Coffee Table', slug: 'glass-coffee-table', category: 'table', price: 3000000, materials: ['Glass', 'Metal'], colors: ['Clear', 'Black'], stock: 100, dimensions: { length: 100, width: 60, height: 45, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Bedside Table', slug: 'bedside-table', category: 'table', price: 1500000, materials: ['Pine Wood'], colors: ['White', 'Natural'], stock: 100, dimensions: { length: 45, width: 45, height: 50, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80'] },

    // Chair
    { name: 'Modern Dining Chair', slug: 'modern-dining-chair', category: 'chair', price: 1200000, materials: ['Plastic', 'Wood'], colors: ['White', 'Black', 'Gray'], stock: 100, dimensions: { length: 45, width: 50, height: 85, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Ergonomic Office Chair', slug: 'ergonomic-office-chair', category: 'chair', price: 4500000, materials: ['Mesh', 'Metal'], colors: ['Black', 'Gray'], stock: 100, dimensions: { length: 65, width: 65, height: 120, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1505797115323-841db95b347e?auto=format&fit=crop&w=800&q=80'], isFeatured: true },
    { name: 'Bar Stool', slug: 'bar-stool', category: 'chair', price: 1800000, materials: ['Metal'], colors: ['Black', 'Silver'], stock: 100, dimensions: { length: 40, width: 40, height: 75, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80'] },

    // Bed
    { name: 'King Size Bed Frame', slug: 'king-size-bed-frame', category: 'bed', price: 18000000, materials: ['Walnut Wood'], colors: ['Walnut', 'Oak'], stock: 100, dimensions: { length: 210, width: 190, height: 100, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=800&q=80'], isFeatured: true },
    { name: 'Queen Upholstered Bed', slug: 'queen-upholstered-bed', category: 'bed', price: 14000000, materials: ['Fabric', 'Wood'], colors: ['Gray', 'Beige'], stock: 100, dimensions: { length: 210, width: 160, height: 110, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1616594039964-40891a909d93?auto=format&fit=crop&w=800&q=80'] },

    // Office
    { name: 'Standing Desk', slug: 'standing-desk', category: 'office', price: 7500000, materials: ['Metal', 'Wood'], colors: ['Black', 'White'], stock: 100, dimensions: { length: 140, width: 70, height: 120, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Filing Cabinet', slug: 'filing-cabinet', category: 'office', price: 2000000, materials: ['Steel'], colors: ['Gray', 'Black'], stock: 100, dimensions: { length: 40, width: 50, height: 60, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80'] },

    // Decor
    { name: 'Floor Lamp', slug: 'floor-lamp', category: 'decor', price: 1800000, materials: ['Metal'], colors: ['Black', 'Gold'], stock: 100, dimensions: { length: 30, width: 30, height: 160, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1513506003011-3b03777f9751?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Ceramic Vase', slug: 'ceramic-vase', category: 'decor', price: 500000, materials: ['Ceramic'], colors: ['White', 'Blue'], stock: 100, dimensions: { length: 15, width: 15, height: 30, unit: 'cm' }, images: ['https://images.unsplash.com/photo-1612152605347-f932c6b7260c?auto=format&fit=crop&w=800&q=80'] },
];

export async function seedProducts() {
    console.log('🛋️ Seeding Products...');

    const categories = await Category.find({});
    const results = [];

    for (const p of productList) {
        const cat = categories.find(c => c.slug === p.category);
        if (!cat) continue;

        const productData = {
            name: p.name,
            slug: p.slug,
            categoryId: cat._id,
            category: cat.name, // Denormalized name
            description: `High quality ${p.name.toLowerCase()} for your home. Made from premium ${p.materials.join(', ')}.`,
            price: p.price,
            images: p.images,
            materials: p.materials, // Array, matched schema
            colors: p.colors,
            dimensions: p.dimensions,
            // tags: [p.category, ...p.materials],
            stock: p.stock,
            isActive: true,
            isFeatured: p.isFeatured || false,
            rating: 4 + Math.random(),
            reviewCount: Math.floor(Math.random() * 50),
        };

        const product = await Product.findOneAndUpdate(
            { name: p.name }, // Use name as unique identifier
            productData,
            { upsert: true, new: true }
        );
        results.push(product);
    }
    console.log(`✅ Seeded ${results.length} products.`);
    return results;
}
