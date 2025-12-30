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
  
  /**
   * Schedule booking (Admin/Branch Manager only)
   */
  static async scheduleBooking(req, res, next) {
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
      const { scheduled_date, technician_id, estimated_duration } = req.body;

      const booking = await AssemblyModel.schedule(
        id,
        scheduled_date,
        technician_id,
        estimated_duration
      );

      res.json({
        success: true,
        message: 'Booking scheduled successfully',
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update booking status
   */
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, actual_duration, technician_notes, completion_photos } = req.body;

      const booking = await AssemblyModel.updateStatus(id, status, {
        actual_duration,
        technician_notes,
        completion_photos,
      });

      res.json({
        success: true,
        message: 'Booking status updated successfully',
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add customer feedback
   */
  static async addFeedback(req, res, next) {
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
      const { rating, feedback } = req.body;

      // Verify booking belongs to user
      const booking = await AssemblyModel.findById(id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      if (booking.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const updatedBooking = await AssemblyModel.addFeedback(id, rating, feedback);

      res.json({
        success: true,
        message: 'Feedback added successfully',
        data: { booking: updatedBooking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get technician schedule (Admin/Branch Manager only)
   */
  static async getTechnicianSchedule(req, res, next) {
    try {
      const { technician_id } = req.params;
      const { start_date, end_date } = req.query;

      const startDate = start_date ? new Date(start_date) : new Date();
      const endDate = end_date ? new Date(end_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const schedule = await AssemblyModel.getTechnicianSchedule(
        technician_id,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: { schedule },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AssemblyController;

