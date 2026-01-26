# Commit Messages - Danh sách các file đã sửa

1. `docker-compose.yml`
   - Cập nhật cấu hình Docker Compose

2. `frontend/app/(customer)/account/addresses/page.tsx`
   - Sửa lỗi hiển thị thông báo khi thêm địa chỉ thành công

3. `frontend/app/(customer)/account/chat/page.tsx`
   - Sửa lỗi chat với admin và cải thiện xử lý lỗi

4. `frontend/app/(customer)/account/page.tsx`
   - Nâng cấp giao diện trang tài khoản và xóa mục Ví điện tử

5. `frontend/app/(customer)/branches/[id]/page.tsx`
   - Nâng cấp giao diện trang chi tiết chi nhánh và bỏ hiển thị doanh thu

6. `frontend/app/(customer)/branches/page.tsx`
   - Cải thiện xử lý address và filter branches hợp lệ

7. `frontend/app/(customer)/cart/page.tsx`
   - Sửa lỗi redirect khi nhấn thanh toán

8. `frontend/app/(customer)/categories/[slug]/page.tsx`
   - Nâng cấp giao diện trang chi tiết danh mục

9. `frontend/app/(customer)/categories/page.tsx`
   - Cải thiện hiển thị ảnh danh mục với fallback và normalizeImageUrl

10. `frontend/app/(customer)/checkout/page.tsx`
    - Thêm nhập mã giảm giá và cải thiện xử lý giỏ hàng

11. `frontend/app/(customer)/orders/[id]/page.tsx`
    - Truyền props để cho phép chỉnh sửa số lượng đơn hàng

12. `frontend/app/(customer)/page.tsx`
    - Thêm ảnh hero mặc định và cải thiện xử lý lỗi

13. `frontend/app/(customer)/products/[id]/page.tsx`
    - Thêm nút Mua ngay và cải thiện kiểm tra tồn kho

14. `frontend/app/(customer)/products/page.tsx`
    - Cải thiện giao diện trang sản phẩm với gradient background và search bar

15. `frontend/app/(customer)/promotions/page.tsx`
    - Nâng cấp giao diện trang khuyến mãi

16. `frontend/app/(customer)/wallet/page.tsx`
    - Tạo trang ví điện tử với balance card và lịch sử giao dịch

17. `frontend/app/(dashboard)/employee/inventory/page.tsx`
    - Sửa lỗi tính toán availableQuantity hiển thị

18. `frontend/app/(dashboard)/manager/inventory/page.tsx`
    - Sửa lỗi tính toán availableQuantity hiển thị

19. `frontend/app/auth/forgot-password/page.tsx`
    - Sửa để gọi API thực tế thay vì mock

20. `frontend/app/globals.css`
    - Cải thiện CSS variables và thêm animation keyframes

21. `frontend/components/layout/Footer.tsx`
    - Cải thiện styling footer với gradient background

22. `frontend/components/layout/Navbar.tsx`
    - Sửa lỗi nút Thanh toán trong dropdown giỏ hàng

23. `frontend/components/order/OrderItemsTable.tsx`
    - Thêm điều khiển số lượng cho đơn hàng có thể chỉnh sửa

24. `frontend/components/product/FilterSidebar.tsx`
    - Sửa lỗi lọc theo giá và rating

25. `frontend/components/product/ProductCard.tsx`
    - Cải thiện UI/UX với hover effects và badge styling

26. `frontend/components/ui/Button.tsx`
    - Refine button styles với enhanced hover effects

27. `frontend/lib/endpoints.ts`
    - Thêm endpoints updateItemQuantity, promotion, forgotPassword, resetPassword và chat

28. `frontend/services/authService.ts`
    - Thêm hàm forgotPassword và resetPassword

29. `frontend/services/branchService.ts`
    - Cải thiện tính toán availableQuantity từ inventory

30. `frontend/services/cartService.ts`
    - Cải thiện normalizeCartItem để giữ nguyên branchId

31. `frontend/services/orderService.ts`
    - Thêm hàm updateItemQuantity và cập nhật CreateOrderData

32. `frontend/services/productService.ts`
    - Cải thiện xử lý filters cho rating, sortBy, sort

33. `frontend/services/userService.ts`
    - Cải thiện xử lý response khi thêm địa chỉ

34. `frontend/store/cartStore.ts`
    - Cải thiện setCart để giữ nguyên branchId khi sync từ backend

35. `frontend/tailwind.config.js`
    - Cập nhật cấu hình Tailwind CSS

36. `scripts/package-lock.json`
    - Cập nhật package-lock.json

37. `services/auth-service/package.json`
    - Cập nhật dependencies cho auth-service

38. `services/auth-service/src/auth/auth.controller.ts`
    - Thêm endpoints forgot-password và reset-password

39. `services/auth-service/src/auth/auth.module.ts`
    - Thêm EmailModule vào auth module

40. `services/auth-service/src/auth/auth.service.ts`
    - Thêm logic forgot password và reset password

41. `services/auth-service/src/auth/dtos/auth.dto.ts`
    - Thêm DTOs cho forgot password và reset password

42. `services/auth-service/src/user/schemas/user.schema.ts`
    - Thêm resetToken và resetTokenExpiry vào user schema

43. `services/auth-service/src/user/user.service.ts`
    - Thêm methods để xử lý reset token

44. `services/branch-service/src/branch/branch.service.ts`
    - Cập nhật branch service

45. `services/order-service/package.json`
    - Cập nhật dependencies cho order-service

46. `services/order-service/src/email/email.service.ts`
    - Cải thiện logging và xử lý lỗi khi gửi email

47. `services/order-service/src/orders/dtos/order.dto.ts`
    - Thêm UpdateOrderItemQuantityDto

48. `services/order-service/src/orders/orders.controller.ts`
    - Thêm endpoint PATCH để cập nhật số lượng sản phẩm trong đơn hàng

49. `services/order-service/src/orders/orders.module.ts`
    - Thêm EmailModule vào orders module

50. `services/order-service/src/orders/orders.service.ts`
    - Sửa lỗi kiểm tra tồn kho sử dụng internal endpoints và thêm email sending

51. `services/settings-service/README.md`
    - Viết lại README cho settings-service

52. `services/user-service/README.md`
    - Viết lại README cho user-service

53. `services/wallet-service/src/main.ts`
    - Cập nhật main.ts cho wallet-service

54. `services/warehouse-service/src/warehouse/schemas/warehouse.schema.ts`
    - Thêm pre-save hook để tự động tính toán availableQuantity

55. `services/warehouse-service/src/warehouse/warehouse.controller.ts`
    - Thêm internal endpoints cho inventory, reserve và release stock

56. `services/warehouse-service/src/warehouse/warehouse.service.ts`
    - Cải thiện logic reserveStock và releaseReservedStock

57. `shared/tsconfig.json`
    - Cập nhật TypeScript configuration

58. `.env.example`
    - Thêm file .env.example mới

59. `commit.md`
    - Thêm file commit.md để tracking commits

60. `frontend/app/auth/reset-password/`
    - Tạo trang reset password với form validation

61. `services/auth-service/src/email/`
    - Thêm EmailModule và EmailService cho auth-service
