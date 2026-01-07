import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto } from './dtos/product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

  async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Product Service] Creating product with data:', JSON.stringify(createProductDto, null, 2));
    }
    try {
      const product = await this.productModel.create(createProductDto);
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Product Service] Product created:', product.id);
      }
      return product;
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Product Service] Error creating product:', error);
        console.error('[Product Service] Error name:', error.name);
        console.error('[Product Service] Error message:', error.message);
      }
      throw error;
    }
  }

  async findAll(filters?: any): Promise<{
    items: ProductDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = {};

    if (!filters?.includeDeleted) {
      query.deletedAt = { $exists: false };
    }

    if (filters?.status) {
      if (filters.status === 'active') {
        query.isActive = true;
      } else if (filters.status === 'inactive') {
        query.isActive = false;
      }
    } else if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive === 'true' || filters.isActive === true;
    } else {
      query.isActive = true;
    }

    if (filters?.category) query.category = filters.category;
    if (filters?.categoryId) query.categoryId = filters.categoryId;
    if (filters?.isFeatured !== undefined) query.isFeatured = filters.isFeatured === 'true' || filters.isFeatured === true;

    if (filters?.search) {
      query.$or = [
        { name: new RegExp(filters.search, 'i') },
        { description: new RegExp(filters.search, 'i') },
      ];
    }

    if (filters?.minPrice || filters?.minPrice === 0) {
      query.price = { $gte: filters.minPrice };
    }

    if (filters?.maxPrice) {
      query.price = { ...query.price, $lte: filters.maxPrice };
    }

    if (filters?.materials && Array.isArray(filters.materials)) {
      query.materials = { $in: filters.materials };
    } else if (filters?.material) {
      query.materials = filters.material;
    }

    if (filters?.colors && Array.isArray(filters.colors)) {
      query.colors = { $in: filters.colors };
    } else if (filters?.color) {
      query.colors = filters.color;
    }

    let sort: any = {};
    if (filters?.sortBy === 'price_asc') sort = { price: 1 };
    else if (filters?.sortBy === 'price_desc') sort = { price: -1 };
    else if (filters?.sortBy === 'newest') sort = { createdAt: -1 };
    else if (filters?.sortBy === 'rating') sort = { rating: -1 };
    else sort = { createdAt: -1 };

    const limit = Math.min(parseInt(filters?.limit) || 20, 100);
    const page = Math.max(parseInt(filters?.page) || 1, 1);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.productModel.find(query).sort(sort).limit(limit).skip(skip).exec(),
      this.productModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      totalPages,
    };
  }

  async findById(id: string): Promise<ProductDocument> {
    if (!id || id === 'undefined' || id === 'null') {
      throw new NotFoundException('ID sản phẩm không hợp lệ');
    }
    const product = await this.productModel.findOne({
      _id: id,
      deletedAt: { $exists: false },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.productModel.findByIdAndUpdate(id, updateProductDto, { new: true });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }
    return product;
  }

  async delete(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findByIdAndUpdate(
      id,
      {
        deletedAt: new Date(),
        isActive: false,
      },
      { new: true }
    );
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }
    return product;
  }

  async decreaseStock(id: string, quantity: number): Promise<ProductDocument> {
    const product = await this.productModel.findByIdAndUpdate(
      id,
      { $inc: { stock: -quantity } },
      { new: true },
    );
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }
    return product;
  }
}
