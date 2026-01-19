import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { Order, OrderDocument, OrderItem } from './schemas/order.schema';
import { CreateOrderDto, UpdateOrderStatusDto } from './dtos/order.dto';
import { AuditLogService } from './audit-log.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly BRANCH_SERVICE_URL = process.env.BRANCH_SERVICE_URL || 'http://branch-service:3017';
  private readonly WAREHOUSE_SERVICE_URL = process.env.WAREHOUSE_SERVICE_URL || 'http://warehouse-service:3009';
  private readonly USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3003';
  private readonly PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3004';
  private readonly ROUTING_SERVICE_URL = process.env.ROUTING_SERVICE_URL || 'https://router.project-osrm.org/route/v1/driving';

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private httpService: HttpService,
    private auditLogService: AuditLogService,
    private emailService: EmailService,
  ) {}

  async create(customerId: string, createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng không được để trống');
    }

    let totalPrice = 0;
    let totalDiscount = 0;

    // Validate items and check stock availability
    // CUSTOMER constraint: Stock validation before order creation
    for (const item of createOrderDto.items) {
      if (item.quantity <= 0) {
        throw new BadRequestException(`Số lượng sản phẩm phải lớn hơn 0`);
      }

      // Check stock availability via warehouse service (without branchId - check globally)
      // The actual branch assignment and stock reservation will happen later with branchId
      // This is just a preliminary check to ensure product exists and has stock somewhere
      try {
        // Use internal endpoint that doesn't require authentication
        const warehouseUrl = `${this.WAREHOUSE_SERVICE_URL}/api/warehouse/internal/inventory?productId=${item.productId}`;
        const warehouseResponse = await firstValueFrom(this.httpService.get(warehouseUrl));
        // Handle both direct array and wrapped response
        const responseData = warehouseResponse.data?.data || warehouseResponse.data;
        const warehouses = Array.isArray(responseData) ? responseData : [responseData];
        
        if (!warehouses || warehouses.length === 0) {
          throw new BadRequestException(`Sản phẩm ${(item as any).productName || item.productId} không có trong kho`);
        }

        // Sum available quantity across all branches
        // Calculate availableQuantity if not provided
        const totalAvailable = warehouses.reduce((sum: number, w: any) => {
          const availableQty = w?.availableQuantity !== undefined && w?.availableQuantity !== null
            ? w.availableQuantity
            : Math.max(0, (w?.quantity || 0) - (w?.reservedQuantity || 0));
          return sum + availableQty;
        }, 0);
        
        this.logger.debug(`Preliminary stock check for product ${item.productId}: totalAvailable=${totalAvailable}, required=${item.quantity}`);
        
        if (totalAvailable < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm ${(item as any).productName || item.productId} không đủ hàng. Tổng còn ${totalAvailable} sản phẩm`
          );
        }
      } catch (error: any) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        // If warehouse service is unavailable, log warning but continue (graceful degradation)
        this.logger.warn(`Could not check stock for product ${item.productId}:`, error?.message || error);
      }

      // Calculate price from item data (assuming price is included in item)
      const itemPrice = (item as any).price || 0;
      const itemDiscountValue = (item as any).discount || 0;
      const itemTotal = itemPrice * item.quantity;
      const itemDiscount = itemDiscountValue * item.quantity;
      totalPrice += itemTotal;
      totalDiscount += itemDiscount;
    }

    // Apply promotion discount if provided
    let finalTotalPrice = totalPrice;
    if (createOrderDto.discount && createOrderDto.discount > 0) {
      totalDiscount += createOrderDto.discount;
      finalTotalPrice = totalPrice - createOrderDto.discount;
    }

    const rawPaymentMethod = createOrderDto.paymentMethod || 'cod';
    const normalizedPaymentMethod = rawPaymentMethod.toLowerCase();
    const allowedPaymentMethods = new Set(['cod', 'stripe', 'momo', 'vnpay', 'wallet']);
    if (!allowedPaymentMethods.has(normalizedPaymentMethod)) {
      throw new BadRequestException('Phương thức thanh toán không hợp lệ');
    }

    // 0.1: Order bắt buộc có branch_id - Tìm chi nhánh có đủ hàng
    let selectedBranchId: string | undefined;
    
    // Strategy 1: Nếu có tọa độ, quét 2 chi nhánh gần nhất theo đường chim bay
    // rồi call API định tuyến để chọn chi nhánh gần nhất theo đường đi thực tế
    if (createOrderDto.shippingCoordinates?.lat && createOrderDto.shippingCoordinates?.lng) {
      try {
        const branchServiceUrl = `${this.BRANCH_SERVICE_URL}/api/branches/nearest`;
        const response = await firstValueFrom(
          this.httpService.get(branchServiceUrl, {
            params: {
              lat: createOrderDto.shippingCoordinates.lat,
              lng: createOrderDto.shippingCoordinates.lng,
            },
          }),
        );

        const candidateBranches = (response.data?.data || response.data || []) as any[];
        const branchesWithCoords = candidateBranches.filter((branch) =>
          branch?.address?.coordinates?.lat && branch?.address?.coordinates?.lng
        );

        const routedCandidates: Array<{ branch: any; distanceKm: number | null }> = [];
        for (const branch of branchesWithCoords) {
          const distanceKm = await this.getRouteDistanceKm(
            createOrderDto.shippingCoordinates.lat,
            createOrderDto.shippingCoordinates.lng,
            branch.address.coordinates.lat,
            branch.address.coordinates.lng,
          );
          routedCandidates.push({ branch, distanceKm });
        }

        const sortedCandidates = routedCandidates
          .filter((candidate) => candidate.distanceKm !== null)
          .sort((a, b) => (a.distanceKm as number) - (b.distanceKm as number))
          .map((candidate) => candidate.branch);

        const fallbackCandidates = sortedCandidates.length > 0 ? sortedCandidates : branchesWithCoords;

        for (const branch of fallbackCandidates) {
          const candidateBranchId = branch._id || branch.id;
          if (!candidateBranchId) {
            continue;
          }
          // Verify branch has enough stock for all items
          let hasEnoughStock = true;
          for (const item of createOrderDto.items) {
            try {
              // Use internal endpoint that doesn't require authentication
              const warehouseUrl = `${this.WAREHOUSE_SERVICE_URL}/api/warehouse/internal/inventory?branchId=${candidateBranchId}&productId=${item.productId}`;
              const invResponse = await firstValueFrom(this.httpService.get(warehouseUrl));
              // Handle both direct array and wrapped response
              const responseData = invResponse.data?.data || invResponse.data;
              const inventoryArray = Array.isArray(responseData) ? responseData : [responseData];
              const inventory = inventoryArray.length > 0 ? inventoryArray[0] : null;
              
              // Calculate availableQuantity if not provided
              const availableQty = inventory?.availableQuantity !== undefined && inventory?.availableQuantity !== null
                ? inventory.availableQuantity
                : Math.max(0, (inventory?.quantity || 0) - (inventory?.reservedQuantity || 0));
              
              this.logger.debug(`Checking stock for product ${item.productId} in branch ${candidateBranchId}: available=${availableQty}, required=${item.quantity}`);
              
              if (!inventory || availableQty < item.quantity) {
                this.logger.warn(`Insufficient stock for product ${item.productId} in branch ${candidateBranchId}: available=${availableQty}, required=${item.quantity}`);
                hasEnoughStock = false;
                break;
              }
            } catch (error: any) {
              this.logger.error(`Could not verify stock for product ${item.productId} in branch ${candidateBranchId}:`, error?.message || error);
              hasEnoughStock = false;
              break;
            }
          }
          if (hasEnoughStock) {
            selectedBranchId = candidateBranchId;
            this.logger.log(`Đã chọn chi nhánh gần nhất có đủ hàng: ${selectedBranchId}`);
            break;
          }
        }
      } catch (error) {
        this.logger.warn('Không thể tìm chi nhánh gần nhất', error);
      }
    }
    
    // Strategy 2: Nếu chưa có, tìm bất kỳ chi nhánh nào có đủ hàng
    if (!selectedBranchId) {
      try {
        const branchesUrl = `${this.BRANCH_SERVICE_URL}/api/branches/active`;
        const branchesResponse = await firstValueFrom(this.httpService.get(branchesUrl));
        const branches = branchesResponse.data?.data || branchesResponse.data || [];
        
        for (const branch of branches) {
          const branchId = branch._id || branch.id;
          if (!branchId) continue;
          
          let hasEnoughStock = true;
          for (const item of createOrderDto.items) {
            try {
              // Use internal endpoint that doesn't require authentication
              const warehouseUrl = `${this.WAREHOUSE_SERVICE_URL}/api/warehouse/internal/inventory?branchId=${branchId}&productId=${item.productId}`;
              const invResponse = await firstValueFrom(this.httpService.get(warehouseUrl));
              // Handle both direct array and wrapped response
              const responseData = invResponse.data?.data || invResponse.data;
              const inventoryArray = Array.isArray(responseData) ? responseData : [responseData];
              const inventory = inventoryArray.length > 0 ? inventoryArray[0] : null;
              
              // Calculate availableQuantity if not provided
              const availableQty = inventory?.availableQuantity !== undefined && inventory?.availableQuantity !== null
                ? inventory.availableQuantity
                : Math.max(0, (inventory?.quantity || 0) - (inventory?.reservedQuantity || 0));
              
              this.logger.debug(`Checking stock for product ${item.productId} in branch ${branchId}: available=${availableQty}, required=${item.quantity}`);
              
              if (!inventory || availableQty < item.quantity) {
                this.logger.warn(`Insufficient stock for product ${item.productId} in branch ${branchId}: available=${availableQty}, required=${item.quantity}`);
                hasEnoughStock = false;
                break;
              }
            } catch (error: any) {
              this.logger.error(`Could not verify stock for product ${item.productId} in branch ${branchId}:`, error?.message || error);
              hasEnoughStock = false;
              break;
            }
          }
          
          if (hasEnoughStock) {
            selectedBranchId = branchId;
            this.logger.log(`Đã chọn chi nhánh có đủ hàng: ${selectedBranchId}`);
            break;
          }
        }
      } catch (error) {
        this.logger.warn('Không thể tìm chi nhánh có đủ hàng', error);
      }
    }
    
    // 0.1: BẮT BUỘC có branch_id - Reject nếu không tìm được
    if (!selectedBranchId) {
      throw new BadRequestException(
        'Không tìm được chi nhánh có đủ hàng để xử lý đơn hàng. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.'
      );
    }

    // 0.1: Reserve stock với branchId - Chống oversell
    const reservedStocks: Array<{ productId: string; quantity: number; branchId: string }> = [];
    try {
      for (const item of createOrderDto.items) {
        try {
          // Use internal endpoint that doesn't require authentication
          const reserveUrl = `${this.WAREHOUSE_SERVICE_URL}/api/warehouse/internal/reserve/${item.productId}`;
          await firstValueFrom(
            this.httpService.post(reserveUrl, { 
              quantity: item.quantity,
              branchId: selectedBranchId, // Reserve từ chi nhánh đã chọn
            })
          );
          reservedStocks.push({ productId: item.productId, quantity: item.quantity, branchId: selectedBranchId });
          this.logger.log(`Reserved ${item.quantity} units of product ${item.productId} from branch ${selectedBranchId}`);
        } catch (error: any) {
          // If reservation fails, release already reserved stocks
          this.logger.error(`Failed to reserve stock for product ${item.productId}:`, error.message);
          for (const reserved of reservedStocks) {
            try {
              // Use internal endpoint that doesn't require authentication
              const releaseUrl = `${this.WAREHOUSE_SERVICE_URL}/api/warehouse/internal/release/${reserved.productId}`;
              await firstValueFrom(this.httpService.post(releaseUrl, { 
                quantity: reserved.quantity,
                branchId: reserved.branchId,
              }));
            } catch (releaseError) {
              this.logger.error(`Failed to release reserved stock for product ${reserved.productId}`, releaseError);
            }
          }
          throw new BadRequestException(
            error.response?.data?.message || `Không thể đặt trước hàng cho sản phẩm ${(item as any).productName || item.productId}`
          );
        }
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      // If warehouse service is unavailable, log warning but continue (graceful degradation)
      this.logger.warn('Warehouse service unavailable, skipping stock reservation:', error.message);
    }

    const order = await this.orderModel.create({
      customerId,
      items: createOrderDto.items,
      totalPrice: finalTotalPrice,
      totalDiscount,
      shippingAddress: createOrderDto.shippingAddress,
      phone: createOrderDto.phone,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: 'UNPAID', // 0.3: Payment status
      notes: createOrderDto.notes,
      promotionId: createOrderDto.promotionId,
      promotionCode: createOrderDto.promotionCode,
      branchId: selectedBranchId!, // 0.1: BẮT BUỘC có branch_id
      status: 'PENDING_CONFIRMATION', // 0.2: Status flow chuẩn
      isPaid: false,
      confirmedAt: undefined, // Sẽ được set khi manager confirm
    });

    // Create audit log for order creation
    try {
      await this.auditLogService.createOrderCreatedLog(order._id.toString(), {
        id: customerId,
        name: 'Customer',
        role: 'customer',
      });
    } catch (error) {
      this.logger.warn('Failed to create audit log for order creation', error);
    }

    // Populate order before returning
    const populatedOrder = await this.findById(order._id.toString());
    
    // Send order confirmation email
    try {
      this.logger.log(`Attempting to send order confirmation email for order ${order._id.toString()}`);
      const userUrl = `${this.USER_SERVICE_URL}/api/users/internal/${customerId}`;
      const userResponse = await firstValueFrom(this.httpService.get(userUrl));
      const user = userResponse.data?.data || userResponse.data;
      
      if (user?.email) {
        const orderItems = createOrderDto.items.map((item: any) => ({
          name: item.productName || 'Sản phẩm',
          quantity: item.quantity,
          price: item.price * item.quantity,
        }));
        
        await this.emailService.sendOrderConfirmationEmail(
          user.email,
          order._id.toString(),
          orderItems,
          finalTotalPrice,
          createOrderDto.shippingAddress,
        );
        this.logger.log(`✅ Order confirmation email sent successfully to ${user.email} for order ${order._id.toString()}`);
      } else {
        this.logger.warn(`User ${customerId} does not have an email address`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send order confirmation email for order ${order._id.toString()}:`, error);
      this.logger.error('Error details:', error instanceof Error ? error.message : String(error));
      // Don't fail order creation if email fails
    }
    
    return populatedOrder;
  }

  private async getRouteDistanceKm(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<number | null> {
    try {
      const url = `${this.ROUTING_SERVICE_URL}/${originLng},${originLat};${destLng},${destLat}`;
      const response = await firstValueFrom(
        this.httpService.get(url, { params: { overview: 'false' } }),
      );
      const distanceMeters = response.data?.routes?.[0]?.distance;
      if (typeof distanceMeters !== 'number') {
        return null;
      }
      return distanceMeters / 1000;
    } catch (error: any) {
      this.logger.warn('Không thể lấy khoảng cách định tuyến', error?.message || error);
      return null;
    }
  }

  async findByCustomerId(customerId: string): Promise<any[]> {
    const orders = await this.orderModel.find({ customerId }).sort({ createdAt: -1 }).lean();
    
    // Populate branch for each order
    return Promise.all(
      orders.map(async (order: any) => {
        const populated: any = { ...order, id: order._id.toString() };
        
        // Fetch branch
        if (order.branchId) {
          try {
            const branchUrl = `${this.BRANCH_SERVICE_URL}/api/branches/${order.branchId}`;
            const branchResponse = await firstValueFrom(this.httpService.get(branchUrl));
            populated.branch = branchResponse.data?.data || branchResponse.data;
          } catch (error) {
            // Silent fail
          }
        }
        
        return populated;
      })
    );
  }

  async findAll(filters?: any, userRole?: string, userBranchId?: string, userId?: string): Promise<{ items: OrderDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const query: any = {};
    
    // Role-based filtering
    if (userRole === 'admin') {
      // Admin sees all orders - no branch filter
    } else if (userRole === 'branch_manager') {
      // Manager sees all orders from their branch
      if (!userBranchId) {
        throw new BadRequestException('Manager phải được gán cho một chi nhánh. Vui lòng liên hệ admin để được gán chi nhánh.');
      }
      
      // Validate branchId format
      if (typeof userBranchId !== 'string') {
        throw new BadRequestException('Branch ID không hợp lệ');
      }
      
      query.branchId = userBranchId;
    } else if (userRole === 'employee') {
      // EMPLOYEE constraint: Only see assigned orders from their branch
      if (!userBranchId) {
        throw new BadRequestException('Nhân viên phải được gán cho một chi nhánh. Vui lòng liên hệ admin để được gán chi nhánh.');
      }
      
      // Validate branchId format
      if (typeof userBranchId !== 'string') {
        throw new BadRequestException('Branch ID không hợp lệ');
      }
      
      query.branchId = userBranchId;
      // 5: Filter by assigned employee
      if (userId) {
        query.$or = [
          { assignedEmployeeId: userId },
          { assignedEmployeeId: { $exists: false } },
          { assignedEmployeeId: null },
        ];
      }
    } else if (userRole === 'shipper') {
      // SHIPPER constraint: Only see assigned deliveries
      if (!userBranchId) {
        throw new BadRequestException('User must be assigned to a branch');
      }
      query.branchId = userBranchId;
      if (userId) {
        // Only show orders assigned to this shipper or unassigned orders
        query.$or = [
          { shipperId: userId },
          { shipperId: { $exists: false } },
          { shipperId: null },
        ];
      }
    } else if (userRole === 'customer') {
      // Customers only see their own orders
      if (filters?.customerId) {
        query.customerId = filters.customerId;
      }
    }
    
    // Additional filters
    if (filters?.status) query.status = filters.status.toUpperCase();
    if (filters?.customerId && userRole === 'admin') query.customerId = filters.customerId;
    if (filters?.shipperId) query.shipperId = filters.shipperId;
    if (filters?.branchId && userRole === 'admin') query.branchId = filters.branchId;

    // Pagination with validation
    let page = 1;
    let limit = 10;
    
    if (filters?.page) {
      const parsedPage = parseInt(String(filters.page), 10);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage;
      }
    }
    
    if (filters?.limit) {
      const parsedLimit = parseInt(String(filters.limit), 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
        limit = parsedLimit;
      }
    }
    
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.orderModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.orderModel.countDocuments(query),
    ]);

    // Populate user, branch, shipper for each order
    const populatedItems = await Promise.all(
      items.map(async (order: any) => {
        const populated: any = { ...order, id: order._id.toString() };
        
        // Fetch user (customer)
        if (order.customerId) {
          try {
            const userUrl = `${this.USER_SERVICE_URL}/api/users/internal/${order.customerId}`;
            const userResponse = await firstValueFrom(this.httpService.get(userUrl));
            populated.user = userResponse.data?.data || userResponse.data;
          } catch (error) {
            // Silent fail - user might not exist
          }
        }
        
        // Fetch branch
        if (order.branchId) {
          try {
            const branchUrl = `${this.BRANCH_SERVICE_URL}/api/branches/${order.branchId}`;
            const branchResponse = await firstValueFrom(this.httpService.get(branchUrl));
            populated.branch = branchResponse.data?.data || branchResponse.data;
          } catch (error) {
            // Silent fail - branch might not exist
          }
        }
        
        // Fetch shipper
        if (order.shipperId) {
          try {
            const shipperUrl = `${this.USER_SERVICE_URL}/api/users/internal/${order.shipperId}`;
            const shipperResponse = await firstValueFrom(this.httpService.get(shipperUrl));
            populated.shipper = shipperResponse.data?.data || shipperResponse.data;
          } catch (error) {
            // Silent fail - shipper might not exist
          }
        }
        
        return populated;
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      items: populatedItems,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Lấy đơn hàng cho shipper - chỉ thấy đơn hàng của chi nhánh mình
   */
  async findOrdersForShipper(shipperBranchId: string, shipperId?: string): Promise<OrderDocument[]> {
    // Validate branchId
    if (!shipperBranchId || typeof shipperBranchId !== 'string') {
      throw new BadRequestException('Branch ID không hợp lệ');
    }
    
    const query: any = {
      branchId: shipperBranchId,
      status: { $in: ['CONFIRMED', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED'] },
    };
    
    // Shipper thấy tất cả đơn hàng của branch, nhưng ưu tiên các đơn đã được gán cho mình
    // Hoặc các đơn chưa được gán shipper nào (để có thể assign)
    if (shipperId) {
      query.$or = [
        { shipperId: shipperId },
        { shipperId: { $exists: false } },
        { shipperId: null },
      ];
    }

    const orders = await this.orderModel.find(query).sort({ createdAt: -1 }).lean();
    
    // Populate branch for each order
    return Promise.all(
      orders.map(async (order: any) => {
        const populated: any = { ...order, id: order._id.toString() };
        
        // Fetch branch
        if (order.branchId) {
          try {
            const branchUrl = `${this.BRANCH_SERVICE_URL}/api/branches/${order.branchId}`;
            const branchResponse = await firstValueFrom(this.httpService.get(branchUrl));
            populated.branch = branchResponse.data?.data || branchResponse.data;
          } catch (error) {
            // Silent fail
          }
        }
        
        // Fetch shipper if assigned
        if (order.shipperId) {
          try {
            const shipperUrl = `${this.USER_SERVICE_URL}/api/users/internal/${order.shipperId}`;
            const shipperResponse = await firstValueFrom(this.httpService.get(shipperUrl));
            populated.shipper = shipperResponse.data?.data || shipperResponse.data;
          } catch (error) {
            // Silent fail
          }
        }
        
        return populated;
      })
    );
  }

  async findById(id: string): Promise<any> {
    const order = await this.orderModel.findById(id).lean();
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    
    // Populate user, branch, shipper from external services
    const populatedOrder: any = { ...order, id: order._id.toString() };
    
    // Fetch user (customer)
    if (order.customerId) {
      try {
        const userUrl = `${this.USER_SERVICE_URL}/api/users/internal/${order.customerId}`;
        const userResponse = await firstValueFrom(this.httpService.get(userUrl));
        populatedOrder.user = userResponse.data?.data || userResponse.data;
      } catch (error) {
        this.logger.warn(`Could not fetch user ${order.customerId}`, error);
      }
    }
    
    // Fetch branch
    if (order.branchId) {
      try {
        const branchUrl = `${this.BRANCH_SERVICE_URL}/api/branches/${order.branchId}`;
        const branchResponse = await firstValueFrom(this.httpService.get(branchUrl));
        populatedOrder.branch = branchResponse.data?.data || branchResponse.data;
      } catch (error) {
        this.logger.warn(`Could not fetch branch ${order.branchId}`, error);
      }
    }
    
    // Fetch shipper
    if (order.shipperId) {
      try {
        const shipperUrl = `${this.USER_SERVICE_URL}/api/users/internal/${order.shipperId}`;
        const shipperResponse = await firstValueFrom(this.httpService.get(shipperUrl));
        populatedOrder.shipper = shipperResponse.data?.data || shipperResponse.data;
      } catch (error) {
        this.logger.warn(`Could not fetch shipper ${order.shipperId}`, error);
      }
    }
    
    // Populate product information for order items
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      populatedOrder.items = await Promise.all(
        order.items.map(async (item: any) => {
          if (item.productId) {
            try {
              const productUrl = `${this.PRODUCT_SERVICE_URL}/api/products/${item.productId}`;
              const productResponse = await firstValueFrom(this.httpService.get(productUrl));
              return {
                ...item,
                product: productResponse.data?.data || productResponse.data,
              };
            } catch (error) {
              this.logger.warn(`Could not fetch product ${item.productId}`, error);
              return item;
            }
          }
          return item;
        })
      );
    }
    
    return populatedOrder;
  }

  async updateStatus(
    id: string,
    updateDto: UpdateOrderStatusDto,
    performedBy?: { id: string; name: string; role?: string },
  ): Promise<OrderDocument> {
    // 0.2: Standardized status flow
    const validStatuses = [
      'PENDING_CONFIRMATION', 'CONFIRMED', 'PACKING', 'READY_TO_SHIP',
      'SHIPPING', 'DELIVERED', 'COMPLETED',
      'CANCELLED', 'FAILED_DELIVERY', 'RETURNING', 'RETURNED'
    ];
    const normalizedStatus = updateDto.status.toUpperCase();
    
    if (!validStatuses.includes(normalizedStatus)) {
      throw new BadRequestException(`Trạng thái không hợp lệ: ${updateDto.status}`);
    }

    const order = await this.findById(id);
    const oldStatus = order.status;

    // 0.2: Validate status transition - không được nhảy trạng thái tùy ý
    const validTransitions: Record<string, string[]> = {
      'PENDING_CONFIRMATION': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['PACKING', 'CANCELLED'],
      'PACKING': ['READY_TO_SHIP', 'CANCELLED'],
      'READY_TO_SHIP': ['SHIPPING', 'CANCELLED'],
      'SHIPPING': ['DELIVERED', 'FAILED_DELIVERY', 'CANCELLED'],
      'FAILED_DELIVERY': ['SHIPPING', 'RETURNING', 'CANCELLED'],
      'RETURNING': ['RETURNED', 'CANCELLED'],
      'RETURNED': ['CANCELLED'],
      'DELIVERED': ['COMPLETED'],
      'COMPLETED': [], // Final state
      'CANCELLED': [], // Final state
    };

    if (oldStatus !== normalizedStatus) {
      const allowedNextStatuses = validTransitions[oldStatus] || [];
      if (!allowedNextStatuses.includes(normalizedStatus)) {
        throw new BadRequestException(
          `Không thể chuyển từ trạng thái "${oldStatus}" sang "${normalizedStatus}". Trạng thái hợp lệ: ${allowedNextStatuses.join(', ')}`
        );
      }
    }

    // Role-based status transition validation (0.2)
    const userRole = performedBy?.role;
    if (userRole && oldStatus !== normalizedStatus) {
      // EMPLOYEE (5): Chỉ được CONFIRMED → PACKING → READY_TO_SHIP
      if (userRole === 'employee') {
        const allowedEmployeeTransitions = ['CONFIRMED', 'PACKING', 'READY_TO_SHIP'];
        if (!allowedEmployeeTransitions.includes(normalizedStatus)) {
          throw new ForbiddenException(
            `Employee chỉ được chuyển trạng thái: ${allowedEmployeeTransitions.join(', ')}`
          );
        }
        // Employee chỉ được update orders assigned to them
        if (order.assignedEmployeeId && order.assignedEmployeeId.toString() !== performedBy.id) {
          throw new ForbiddenException('Bạn chỉ được cập nhật đơn hàng được phân công cho mình');
        }
      }
      
      // SHIPPER (6): Chỉ được READY_TO_SHIP → SHIPPING → DELIVERED/FAILED_DELIVERY
      if (userRole === 'shipper') {
        const allowedShipperTransitions = ['SHIPPING', 'DELIVERED', 'FAILED_DELIVERY'];
        if (!allowedShipperTransitions.includes(normalizedStatus)) {
          throw new ForbiddenException(
            `Shipper chỉ được chuyển trạng thái: ${allowedShipperTransitions.join(', ')}`
          );
        }
        // Shipper chỉ được update orders assigned to them
        if (order.shipperId && order.shipperId.toString() !== performedBy.id) {
          throw new ForbiddenException('Bạn chỉ được cập nhật đơn hàng được phân công cho mình');
        }
        // 6: DELIVERED phải có xác nhận
        if (normalizedStatus === 'DELIVERED') {
          const deliveryConfirmation = (updateDto as any).deliveryConfirmation;
          if (!deliveryConfirmation) {
            throw new BadRequestException('Cần có xác nhận giao hàng (OTP/chữ ký/ảnh) để chuyển sang DELIVERED');
          }
        }
      }
      
      // ADMIN (3): Không được chuyển trạng thái tùy ý (chỉ exception cases với lý do)
      if (userRole === 'admin') {
        // Admin chỉ được can thiệp trong exception cases và phải có lý do
        const adminReason = (updateDto as any).adminReason;
        if (!adminReason || adminReason.trim().length < 10) {
          throw new BadRequestException(
            'Admin chỉ được can thiệp trạng thái trong trường hợp đặc biệt và phải có lý do (ít nhất 10 ký tự)'
          );
        }
      }
    }

    // Update timestamps and related fields based on status
    const updateData: any = { status: normalizedStatus };
    
    // Send email notification when status changes (only for important statuses)
    if (oldStatus !== normalizedStatus) {
      const importantStatuses = ['CONFIRMED', 'PACKING', 'READY_TO_SHIP', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'COMPLETED'];
      if (importantStatuses.includes(normalizedStatus)) {
        try {
          this.logger.log(`Attempting to send order status update email for order ${id}, status: ${normalizedStatus}`);
          const userUrl = `${this.USER_SERVICE_URL}/api/users/internal/${order.customerId}`;
          const userResponse = await firstValueFrom(this.httpService.get(userUrl));
          const user = userResponse.data?.data || userResponse.data;
          
          if (user?.email) {
            await this.emailService.sendOrderStatusUpdateEmail(
              user.email,
              id,
              normalizedStatus,
            );
            this.logger.log(`✅ Order status update email sent successfully to ${user.email} for order ${id}`);
          } else {
            this.logger.warn(`User ${order.customerId} does not have an email address`);
          }
        } catch (error) {
          this.logger.error(`❌ Failed to send order status update email for order ${id}:`, error);
          this.logger.error('Error details:', error instanceof Error ? error.message : String(error));
          // Don't fail status update if email fails
        }
      }
    }
    if (normalizedStatus === 'CONFIRMED' && !order.confirmedAt) {
      updateData.confirmedAt = new Date();
    } else if (normalizedStatus === 'SHIPPING' && !order.shippedAt) {
      updateData.shippedAt = new Date();
    } else if (normalizedStatus === 'DELIVERED' && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
      // 6: Store delivery confirmation
      if ((updateDto as any).deliveryConfirmation) {
        updateData.deliveryConfirmation = (updateDto as any).deliveryConfirmation;
      }
      if ((updateDto as any).deliveryNotes) {
        updateData.deliveryNotes = (updateDto as any).deliveryNotes;
      }
      if ((updateDto as any).deliveryProof) {
        updateData.deliveryProof = (updateDto as any).deliveryProof;
      }
    } else if (normalizedStatus === 'COMPLETED') {
      // Auto-update payment status if COD and delivered
      if (order.paymentMethod === 'cod' && order.paymentStatus === 'UNPAID') {
        updateData.paymentStatus = 'PAID';
        updateData.isPaid = true;
      }
    } else if (normalizedStatus === 'CANCELLED' && !order.cancelledAt) {
      updateData.cancelledAt = new Date();
      // 0.1: Release reserved stock when cancelled
      if (order.branchId) {
        for (const item of order.items) {
          try {
            const releaseUrl = `${this.WAREHOUSE_SERVICE_URL}/api/warehouse/release/${item.productId}`;
            await firstValueFrom(this.httpService.post(releaseUrl, {
              quantity: item.quantity,
              branchId: order.branchId.toString(),
            }));
            this.logger.log(`Released ${item.quantity} units of product ${item.productId} from branch ${order.branchId}`);
          } catch (error) {
            this.logger.error(`Failed to release stock for product ${item.productId}`, error);
          }
        }
      }
    }

    await this.orderModel.findByIdAndUpdate(id, updateData, { new: true });

    // Create audit log if status changed and performedBy is provided
    if (oldStatus !== normalizedStatus && performedBy) {
      try {
        await this.auditLogService.createStatusUpdateLog(
          id,
          oldStatus,
          normalizedStatus,
          performedBy,
        );
      } catch (error) {
        this.logger.warn('Failed to create audit log for status update', error);
      }
    }

    // Populate order before returning
    const updatedOrder = await this.findById(id);

    return updatedOrder;
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: string,
    isPaid: boolean = false,
  ): Promise<OrderDocument> {
    const order = await this.findById(orderId);
    
    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      { 
        paymentStatus: paymentStatus.toUpperCase(),
        isPaid,
      },
      { new: true },
    );
    
    if (!updatedOrder) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    this.logger.log(`Updated paymentStatus to ${paymentStatus} for orderId: ${orderId}`);
    return updatedOrder;
  }

  async updateItemQuantity(
    orderId: string,
    productId: string,
    newQuantity: number,
    userId: string,
  ): Promise<OrderDocument> {
    const order = await this.findById(orderId);
    
    // Only allow update for PENDING_CONFIRMATION or CONFIRMED orders
    const normalizedStatus = order.status?.toUpperCase();
    if (normalizedStatus !== 'PENDING_CONFIRMATION' && normalizedStatus !== 'CONFIRMED' && normalizedStatus !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể cập nhật số lượng cho đơn hàng ở trạng thái Chờ xác nhận hoặc Đã xác nhận');
    }

    // Verify order belongs to customer
    if (order.customerId?.toString() !== userId) {
      throw new BadRequestException('Bạn không có quyền cập nhật đơn hàng này');
    }

    if (newQuantity <= 0) {
      throw new BadRequestException('Số lượng phải lớn hơn 0');
    }

    // Find the item
    const itemIndex = order.items.findIndex((item: OrderItem) => item.productId?.toString() === productId);
    if (itemIndex === -1) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong đơn hàng');
    }

    const item = order.items[itemIndex];
    const oldQuantity = item.quantity;
    const quantityDiff = newQuantity - oldQuantity;

    // Update item quantity
    item.quantity = newQuantity;

    // Recalculate total price
    const itemsTotal = order.items.reduce((sum: number, it: OrderItem) => sum + (it.price * it.quantity), 0);
    const totalDiscount = order.items.reduce((sum: number, it: OrderItem) => sum + ((it.discount || 0) * it.quantity), 0);
    const newTotalPrice = itemsTotal - totalDiscount;

    // Update stock reservation if quantity changed
    if (quantityDiff !== 0 && order.branchId) {
      try {
        if (quantityDiff > 0) {
          // Reserve more stock
          const reserveUrl = `${this.WAREHOUSE_SERVICE_URL}/api/warehouse/internal/reserve/${productId}`;
          await firstValueFrom(this.httpService.post(reserveUrl, {
            quantity: quantityDiff,
            branchId: order.branchId.toString(),
          }));
          this.logger.log(`Reserved additional ${quantityDiff} units of product ${productId} for order ${orderId}`);
        } else {
          // Release stock
          const releaseUrl = `${this.WAREHOUSE_SERVICE_URL}/api/warehouse/internal/release/${productId}`;
          await firstValueFrom(this.httpService.post(releaseUrl, {
            quantity: Math.abs(quantityDiff),
            branchId: order.branchId.toString(),
          }));
          this.logger.log(`Released ${Math.abs(quantityDiff)} units of product ${productId} for order ${orderId}`);
        }
      } catch (error: any) {
        this.logger.error(`Failed to update stock reservation for product ${productId}`, error);
        throw new BadRequestException(`Không thể cập nhật số lượng: ${error?.response?.data?.message || error.message}`);
      }
    }

    // Update order
    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      {
        items: order.items,
        totalPrice: newTotalPrice,
      },
      { new: true },
    );

    if (!updatedOrder) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    this.logger.log(`Updated item quantity for product ${productId} from ${oldQuantity} to ${newQuantity} in order ${orderId}`);
    return this.findById(orderId);
  }

  async assignShipper(
    orderId: string,
    shipperId: string,
    performedBy?: { id: string; name: string; role?: string },
  ): Promise<OrderDocument> {
    const order = await this.findById(orderId);
    
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new BadRequestException('Không thể phân công shipper cho đơn hàng ở trạng thái này');
    }

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      { 
        shipperId, 
        status: order.status === 'NEW' ? 'CONFIRMED' : order.status, // Auto confirm if NEW
      },
      { new: true },
    );
    
    if (!updatedOrder) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // Create audit log
    if (performedBy) {
      try {
        await this.auditLogService.create(orderId, {
          action: 'SHIPPER_ASSIGNED',
          description: 'Đã gán shipper cho đơn hàng',
          performedBy,
          changes: [
            { field: 'shipperId', oldValue: order.shipperId?.toString() || 'N/A', newValue: shipperId },
          ],
        });
      } catch (error) {
        this.logger.warn('Failed to create audit log for shipper assignment', error);
      }
    }

    // Populate order before returning
    return this.findById(orderId);
  }

  async assignEmployee(
    orderId: string,
    employeeId: string,
    performedBy?: { id: string; name: string; role?: string },
  ): Promise<OrderDocument> {
    const order = await this.findById(orderId);
    
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED' || order.status === 'COMPLETED') {
      throw new BadRequestException('Không thể phân công nhân viên cho đơn hàng ở trạng thái này');
    }

    // Verify employee belongs to the same branch as the order
    if (order.branchId) {
      try {
        const userUrl = `${this.USER_SERVICE_URL}/api/users/internal/${employeeId}`;
        const userResponse = await firstValueFrom(this.httpService.get(userUrl));
        const employee = userResponse.data?.data || userResponse.data;
        
        if (employee.role !== 'employee') {
          throw new BadRequestException('Chỉ có thể phân công nhân viên (employee)');
        }
        
        if (employee.branchId?.toString() !== order.branchId.toString()) {
          throw new BadRequestException('Nhân viên phải thuộc cùng chi nhánh với đơn hàng');
        }
      } catch (error: any) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        this.logger.warn(`Could not verify employee ${employeeId}:`, error.message);
      }
    }

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      { 
        assignedEmployeeId: employeeId,
      },
      { new: true },
    );
    
    if (!updatedOrder) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // Create audit log
    if (performedBy) {
      try {
        await this.auditLogService.create(orderId, {
          action: 'EMPLOYEE_ASSIGNED',
          description: 'Đã gán nhân viên cho đơn hàng',
          performedBy,
          changes: [
            { field: 'assignedEmployeeId', oldValue: order.assignedEmployeeId?.toString() || 'N/A', newValue: employeeId },
          ],
        });
      } catch (error) {
        this.logger.warn('Failed to create audit log for employee assignment', error);
      }
    }

    // Populate order before returning
    return this.findById(orderId);
  }

  async cancelOrder(orderId: string, customerId: string, reason?: string): Promise<any> {
    const order = await this.findById(orderId);
    
    // 2: Chỉ customer của đơn hàng mới được hủy
    if (order.customerId.toString() !== customerId) {
      throw new BadRequestException('Bạn không có quyền hủy đơn hàng này');
    }

    // 2: Hủy đơn có điều kiện - Chỉ được hủy khi đơn chưa vào PACKING
    const orderStatus = order.status.toUpperCase();
    const allowedCancelStatuses = ['PENDING_CONFIRMATION', 'CONFIRMED'];
    if (!allowedCancelStatuses.includes(orderStatus)) {
      throw new BadRequestException(
        `Không thể hủy đơn hàng ở trạng thái "${orderStatus}". Chỉ có thể hủy khi đơn ở trạng thái: ${allowedCancelStatuses.join(', ')}`
      );
    }
    
    // 0.1: Release reserved stock when cancelled
    if (order.branchId) {
      for (const item of order.items) {
        try {
          const releaseUrl = `${this.WAREHOUSE_SERVICE_URL}/api/warehouse/release/${item.productId}`;
          await firstValueFrom(this.httpService.post(releaseUrl, {
            quantity: item.quantity,
            branchId: order.branchId.toString(),
          }));
          this.logger.log(`Released ${item.quantity} units of product ${item.productId} from branch ${order.branchId}`);
        } catch (error) {
          this.logger.error(`Failed to release stock for product ${item.productId}`, error);
        }
      }
    }

    await this.orderModel.findByIdAndUpdate(
      orderId,
      { 
        status: 'CANCELLED', // 0.2: Use standardized status
        cancelReason: reason,
        cancelledAt: new Date(),
      },
      { new: true },
    );

    // Create audit log for cancellation
    try {
      await this.auditLogService.createOrderCancelledLog(
        orderId,
        reason || '',
        {
          id: customerId,
          name: 'Customer',
          role: 'customer',
        },
      );
    } catch (error) {
      this.logger.warn('Failed to create audit log for order cancellation', error);
    }

    // Populate order before returning
    return this.findById(orderId);
  }
}
