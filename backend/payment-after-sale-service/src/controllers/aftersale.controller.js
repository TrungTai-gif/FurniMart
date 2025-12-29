const { validationResult } = require('express-validator');
const AfterSaleModel = require('../models/aftersale.model');

class AfterSaleController {
  /**
   * Create after-sale request
   */
  static async createRequest(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { order_id, request_type, reason, description, attachments, priority } = req.body;
      const user_id = req.user.id;

      const request = await AfterSaleModel.create({
        order_id,
        user_id,
        request_type,
        reason,
        description,
        attachments,
        priority: priority || 'NORMAL',
      });

      res.status(201).json({
        success: true,
        message: 'After-sale request created successfully',
        data: { request },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get request by ID
   */
  static async getRequest(req, res, next) {
    try {
      const { id } = req.params;
      const request = await AfterSaleModel.findById(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found',
        });
      }
	  