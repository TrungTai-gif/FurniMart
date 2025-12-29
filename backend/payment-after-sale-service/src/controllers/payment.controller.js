const { validationResult } = require('express-validator');
const PaymentModel = require('../models/payment.model');
const VNPayService = require('../services/vnpay.service');
const MoMoService = require('../services/momo.service');
const ZaloPayService = require('../services/zalopay.service');

class PaymentController {
  /**
   * Create payment
   */
  static async createPayment(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { order_id, amount, payment_method, return_url } = req.body;
      const user_id = req.user.id;

      // Create payment record
      const payment = await PaymentModel.create({
        order_id,
        user_id,
        payment_method,
        amount,
        currency: 'VND',
        status: 'PENDING',
      });

      // Log transaction
      await PaymentModel.logTransaction({
        payment_id: payment.payment_id,
        action: 'CREATE',
        request_data: req.body,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
      });

      // Generate payment URL based on method
      let paymentUrl = null;
      let additionalData = {};

      switch (payment_method.toUpperCase()) {
        case 'VNPAY':
          const vnpayResult = await VNPayService.createPayment({
            orderId: order_id,
            amount,
            orderInfo: `Payment for order ${order_id}`,
            returnUrl: return_url,
          });
          paymentUrl = vnpayResult.paymentUrl;
          additionalData = { vnpay_params: vnpayResult.params };
          break;

        case 'MOMO':
          const momoResult = await MoMoService.createPayment({
            orderId: order_id,
            amount,
            orderInfo: `Payment for order ${order_id}`,
            returnUrl: return_url,
          });
          paymentUrl = momoResult.payUrl;
          additionalData = { momo_request_id: momoResult.requestId };
          break;