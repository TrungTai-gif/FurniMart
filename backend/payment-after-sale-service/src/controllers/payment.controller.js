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

  