import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dtos/review.dto';
import { BaseService } from '@shared/common/base/base.service';

@Injectable()
export class ReviewsService extends BaseService<ReviewDocument> {
  protected model: Model<ReviewDocument>;

  private readonly ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3015';

  constructor(
    @InjectModel(Review.name) protected reviewModel: Model<ReviewDocument>,
    private httpService: HttpService,
  ) {
    super();
    this.model = reviewModel;
  }

  // Override create to match base signature but add custom logic
  async create(createDto: any): Promise<ReviewDocument> {
    // This method is not used, we use createReview instead
    return this.reviewModel.create(createDto);
  }

  async createReview(customerId: string, createReviewDto: CreateReviewDto): Promise<ReviewDocument> {
    // CUSTOMER constraint: Check if customer has purchased and order is completed
    // Check if customer has any completed order with this product
    try {
      // Use the my-orders endpoint with customerId filter (if available) or get all and filter
      const orderServiceUrl = `${this.ORDER_SERVICE_URL}/api/orders`;
      const ordersResponse = await firstValueFrom(
        this.httpService.get(orderServiceUrl, {
          params: { customerId, limit: 100 }, // Get up to 100 orders to check
        })
      );
      const orders = (ordersResponse.data as any)?.items || (ordersResponse.data as any) || [];
      
      // Filter to only this customer's orders
      const customerOrders = Array.isArray(orders) 
        ? orders.filter((order: any) => order.customerId === customerId || order.customerId?.toString() === customerId)
        : [];
      
      // 0.5: Find if customer has a DELIVERED or COMPLETED order containing this product
      const hasCompletedOrder = customerOrders.some((order: any) => {
        const orderStatus = order.status?.toUpperCase();
        // 0.5: Chỉ review nếu đơn DELIVERED hoặc COMPLETED (spec nói DELIVERED nhưng COMPLETED cũng hợp lệ)
        if (orderStatus !== 'DELIVERED' && orderStatus !== 'COMPLETED') {
          return false;
        }
        return order.items?.some((item: any) => {
          const itemProductId = item.productId?.toString() || item.productId;
          const reviewProductId = createReviewDto.productId?.toString() || createReviewDto.productId;
          return itemProductId === reviewProductId;
        });
      });

      if (!hasCompletedOrder) {
        throw new ForbiddenException(
          'Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận được hàng'
        );
      }

      // 0.5: 1 sản phẩm trong 1 đơn chỉ được review 1 lần
      // Check if customer already reviewed this product (one review per product per customer)
      const existingReview = await this.reviewModel.findOne({
        customerId,
        productId: createReviewDto.productId,
      }).exec();

      if (existingReview) {
        throw new BadRequestException('Bạn đã đánh giá sản phẩm này rồi');
      }
    } catch (error: any) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      // If order service is unavailable, log warning but allow review (graceful degradation)
      console.warn('Could not validate order completion for review:', error.message);
    }

    return this.reviewModel.create({
      ...createReviewDto,
      customerId,
    });
  }

  async findByProductId(productId: string): Promise<ReviewDocument[]> {
    if (!productId || productId === 'undefined' || productId === 'null') {
      return [];
    }
    return this.reviewModel.find({ productId }).sort({ createdAt: -1 });
  }

  async findByCustomerId(customerId: string): Promise<ReviewDocument[]> {
    return this.reviewModel.find({ customerId });
  }

  async update(id: string, updateData: any): Promise<ReviewDocument | null> {
    const updated = await this.reviewModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!updated) {
      throw new BadRequestException('Review not found');
    }
    return updated;
  }

  async delete(id: string): Promise<ReviewDocument | null> {
    return this.reviewModel.findByIdAndDelete(id).exec();
  }
}
