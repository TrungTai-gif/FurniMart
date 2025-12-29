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
	  // Check access rights
      if (request.user_id !== req.user.id && !['ADMIN', 'SELLER'].includes(req.user.roleName)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      res.json({
        success: true,
        data: { request },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's requests
   */
  static async getUserRequests(req, res, next) {
    try {
      const user_id = req.user.id;
      const { request_type, status } = req.query;

      const requests = await AfterSaleModel.findByUserId(user_id, {
        request_type,
        status,
      });

      res.json({
        success: true,
        data: { requests },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update request status (Admin/Seller only)
   */
  static async updateStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { status, notes } = req.body;
      const user_id = req.user.id;

      const request = await AfterSaleModel.updateStatus(id, status, user_id, notes);

      res.json({
        success: true,
        message: 'Request status updated successfully',
        data: { request },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign request to staff (Admin only)
   */
  static async assignRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { staff_id } = req.body;

      const request = await AfterSaleModel.assign(id, staff_id);

      res.json({
        success: true,
        message: 'Request assigned successfully',
        data: { request },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get statistics (Admin only)
   */
  static async getStatistics(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      
      const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = end_date ? new Date(end_date) : new Date();

      const statistics = await AfterSaleModel.getStatistics(startDate, endDate);

      res.json({
        success: true,
        data: { statistics },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AfterSaleController;