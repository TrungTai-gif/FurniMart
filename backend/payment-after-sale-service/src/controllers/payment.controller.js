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

        case 'ZALOPAY':
          const zalopayResult = await ZaloPayService.createPayment({
            orderId: order_id,
            amount,
            description: `Payment for order ${order_id}`,
            returnUrl: return_url,
          });
          paymentUrl = zalopayResult.order_url;
          additionalData = { zalopay_trans_token: zalopayResult.zp_trans_token };
          break;

        case 'COD':
          // COD doesn't need payment URL
          await PaymentModel.updateStatus(payment.payment_id, 'PENDING', {});
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Unsupported payment method',
          });
      }

      // Update payment with URL if generated
      if (paymentUrl) {
        await PaymentModel.updateStatus(payment.payment_id, 'PENDING', {
          ...additionalData,
          gateway_response: additionalData,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: {
          payment_id: payment.payment_id,
          order_id: payment.order_id,
          amount: payment.amount,
          payment_method: payment.payment_method,
          status: payment.status,
          payment_url: paymentUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment by ID
   */
  static async getPayment(req, res, next) {
    try {
      const { id } = req.params;
      const payment = await PaymentModel.findById(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      // Check if user owns this payment
      if (payment.user_id !== req.user.id && req.user.roleName !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      res.json({
        success: true,
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user payments
   */
  static async getUserPayments(req, res, next) {
    try {
      const user_id = req.user.id;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const payments = await PaymentModel.findByUserId(user_id, limit, offset);

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            limit,
            offset,
            total: payments.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle VNPay IPN callback
   */
  static async vnpayCallback(req, res, next) {
    try {
      const vnpayParams = req.query;
      
      // Verify signature
      const isValid = VNPayService.verifySignature(vnpayParams);
      
      if (!isValid) {
        return res.json({ RspCode: '97', Message: 'Invalid signature' });
      }

      const orderId = vnpayParams.vnp_TxnRef;
      const responseCode = vnpayParams.vnp_ResponseCode;
      const transactionId = vnpayParams.vnp_TransactionNo;

      // Find payment
      const payments = await PaymentModel.findByOrderId(orderId);
      const payment = payments[0];

      if (!payment) {
        return res.json({ RspCode: '01', Message: 'Order not found' });
      }

      // Update payment status
      const status = responseCode === '00' ? 'SUCCESS' : 'FAILED';
      await PaymentModel.updateStatus(payment.payment_id, status, {
        transaction_id: transactionId,
        callback_data: vnpayParams,
      });

      // Log callback
      await PaymentModel.logTransaction({
        payment_id: payment.payment_id,
        action: 'CALLBACK',
        request_data: vnpayParams,
        response_data: { status },
        ip_address: req.ip,
      });

      res.json({ RspCode: '00', Message: 'Confirm Success' });
    } catch (error) {
      console.error('VNPay callback error:', error);
      res.json({ RspCode: '99', Message: 'Unknown error' });
    }
  }

  /**
   * Handle MoMo IPN callback
   */
  static async momoCallback(req, res, next) {
    try {
      const momoData = req.body;
      
      // Verify signature
      const isValid = MoMoService.verifySignature(momoData);
      
      if (!isValid) {
        return res.json({ resultCode: 97, message: 'Invalid signature' });
      }

      const orderId = momoData.orderId;
      const resultCode = momoData.resultCode;
      const transactionId = momoData.transId;

      // Find payment
      const payments = await PaymentModel.findByOrderId(orderId);
      const payment = payments[0];

      if (!payment) {
        return res.json({ resultCode: 1, message: 'Order not found' });
      }

      // Update payment status
      const status = resultCode === 0 ? 'SUCCESS' : 'FAILED';
      await PaymentModel.updateStatus(payment.payment_id, status, {
        transaction_id: transactionId,
        callback_data: momoData,
      });

      // Log callback
      await PaymentModel.logTransaction({
        payment_id: payment.payment_id,
        action: 'CALLBACK',
        request_data: momoData,
        response_data: { status },
        ip_address: req.ip,
      });

      res.json({ resultCode: 0, message: 'Success' });
    } catch (error) {
      console.error('MoMo callback error:', error);
      res.json({ resultCode: 99, message: 'Unknown error' });
    }
  }

  /**
   * Handle ZaloPay callback
   */
  static async zalopayCallback(req, res, next) {
    try {
      const zalopayData = req.body;
      
      // Verify MAC
      const isValid = ZaloPayService.verifyCallback(zalopayData);
      
      if (!isValid) {
        return res.json({ return_code: -1, return_message: 'Invalid MAC' });
      }

      const dataStr = zalopayData.data;
      const data = JSON.parse(dataStr);
      const orderId = data.app_trans_id;

      // Find payment
      const payments = await PaymentModel.findByOrderId(orderId);
      const payment = payments[0];

      if (!payment) {
        return res.json({ return_code: 2, return_message: 'Order not found' });
      }

      // Update payment status
      await PaymentModel.updateStatus(payment.payment_id, 'SUCCESS', {
        transaction_id: data.zp_trans_id,
        callback_data: data,
      });

      // Log callback
      await PaymentModel.logTransaction({
        payment_id: payment.payment_id,
        action: 'CALLBACK',
        request_data: zalopayData,
        response_data: { status: 'SUCCESS' },
        ip_address: req.ip,
      });

      res.json({ return_code: 1, return_message: 'Success' });
    } catch (error) {
      console.error('ZaloPay callback error:', error);
      res.json({ return_code: 0, return_message: 'Unknown error' });
    }
  }
}

module.exports = PaymentController;

