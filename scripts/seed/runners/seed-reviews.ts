
import { Review, Product, User } from '../utils/models';

export async function seedReviews() {
    console.log('⭐ Seeding Reviews...');

    const alice = await User.findOne({ email: 'customer1@gmail.com' });
    const bob = await User.findOne({ email: 'customer2@gmail.com' });
    const products = await Product.find({}).limit(5);

    if (!alice || !bob || products.length === 0) {
        console.warn('⚠️ Skipping Reviews seed: Missing users or products.');
        return;
    }

    const reviewsData = [
        {
            productId: products[0]._id,
            customerId: alice._id,
            customerName: alice.name,
            rating: 5,
            comment: 'Amazing product! Delivered fast and quality is excellent.',
            images: [],
            isVerified: true,
        },
        {
            productId: products[0]._id,
            customerId: bob._id,
            customerName: bob.name,
            rating: 4,
            comment: 'Good quality but a bit expensive.',
            images: [],
            isVerified: true,
        },
        {
            productId: products[1]._id,
            customerId: alice._id,
            customerName: alice.name,
            rating: 5,
            comment: 'Perfect for my living room!',
            images: [],
            isVerified: true,
        },
    ];

    const results = [];
    for (const review of reviewsData) {
        const r = await Review.findOneAndUpdate(
            { productId: review.productId, customerId: review.customerId },
            review,
            { upsert: true, new: true }
        );
        results.push(r);
    }

    console.log(`✅ Seeded ${results.length} reviews.`);
    return results;
}
