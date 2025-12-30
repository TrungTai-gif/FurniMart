const { validationResult } = require('express-validator');
const AssemblyModel = require('../models/assembly.model');

class AssemblyController {
  /**
   * Create assembly booking
   */
  static async createBooking(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const {
        order_id,
        address,
        city,
        district,
        ward,
        phone,
        preferred_date,
        preferred_time_slot,
        service_fee,
        customer_notes,
      } = req.body;

      const user_id = req.user.id;

      const booking = await AssemblyModel.create({
        order_id,
        user_id,
        address,
        city,
        district,
        ward,
        phone,
        preferred_date,
        preferred_time_slot,
        service_fee: service_fee || 0,
        customer_notes,
      });

      res.status(201).json({
        success: true,
        message: 'Assembly booking created successfully',
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get booking by ID
   */
  static async getBooking(req, res, next) {
    try {
      const { id } = req.params;
      const booking = await AssemblyModel.findById(id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      // Check access rights
      if (booking.user_id !== req.user.id && !['ADMIN', 'BRANCH_MANAGER'].includes(req.user.roleName)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      res.json({
        success: true,
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's bookings
   */
  static async getUserBookings(req, res, next) {
    try {
      const user_id = req.user.id;
      const { status } = req.query;

      const bookings = await AssemblyModel.findByUserId(user_id, status);

      res.json({
        success: true,
        data: { bookings },
      });
    } catch (error) {
      next(error);
    }
  }