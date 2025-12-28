const authenticateToken = (req, res, next) => {
  try {
    let authHeader = req.headers.authorization || req.headers["Authorization"];

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Thiếu header Authorization",
      });
    }

    // Linh hoạt parse token: hỗ trợ "Bearer token", "bearer token", "token", hoặc sai khoảng trắng
    authHeader = authHeader.trim();
    let token = null;

    if (authHeader.toLowerCase().startsWith("bearer")) {
      token = authHeader.slice(6).trim(); // bỏ "bearer" hoặc "Bearer" + khoảng trắng
    } else {
      // Trường hợp chỉ gửi token thuần (không Bearer) – vẫn chấp nhận để test dễ
      token = authHeader;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token không được cung cấp hoặc sai định dạng",
      });
    }

    // Verify token
    jwt.verify(token, JWT_SECRET, JWT_OPTIONS, (err, decoded) => {
      if (err) {
        let message = "Token không hợp lệ hoặc đã hết hạn";
        if (err.name === "TokenExpiredError") {
          message = "Token đã hết hạn";
        } else if (err.name === "JsonWebTokenError") {
          message = "Token không đúng định dạng hoặc bị thay đổi";
        } else if (err.name === "NotBeforeError") {
          message = "Token chưa có hiệu lực";
        }
        return res.status(401).json({
          success: false,
          message,
          errorCode: err.name,
        });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error("Lỗi xác thực token:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xác thực token",
    });
  }
};
