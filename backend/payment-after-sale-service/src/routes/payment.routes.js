const express = require('express');
const { body } = require('express-validator');
const PaymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   POST /api/payments
 * @desc    Create new payment
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  [
    body('order_id').isUUID().withMessage('Invalid order ID'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('payment_method')
      .isIn(['VNPAY', 'MOMO', 'ZALOPAY', 'COD'])
      .withMessage('Invalid payment method'),
    body('return_url').optional().isURL().withMessage('Invalid return URL'),
  ],
  PaymentController.createPayment
);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private
 */
router.get('/:id', authenticate, PaymentController.getPayment);

/**
 * @route   GET /api/payments/user/me
 * @desc    Get current user's payments
 * @access  Private
 */
router.get('/user/me', authenticate, PaymentController.getUserPayments);

/**
 * @route   POST /api/payments/vnpay/ipn
 * @desc    VNPay IPN callback
 * @access  Public (called by VNPay)
 */
router.get('/vnpay/ipn', PaymentController.vnpayCallback);

/**
 * @route   POST /api/payments/momo/ipn
 * @desc    MoMo IPN callback
 * @access  Public (called by MoMo)
 */
router.post('/momo/ipn', PaymentController.momoCallback);

/**
 * @route   POST /api/payments/zalopay/callback
 * @desc    ZaloPay callback
 * @access  Public (called by ZaloPay)
 */
router.post('/zalopay/callback', PaymentController.zalopayCallback);

module.exports = router;

