const express = require('express');
const { body } = require('express-validator');
const AssemblyController = require('../controllers/assembly.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   POST /api/assembly
 * @desc    Create assembly booking
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  [
    body('order_id').isUUID().withMessage('Invalid order ID'),
    body('address').notEmpty().withMessage('Address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('district').notEmpty().withMessage('District is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('preferred_date').isISO8601().withMessage('Invalid date format'),
    body('preferred_time_slot')
      .isIn(['MORNING', 'AFTERNOON', 'EVENING'])
      .withMessage('Invalid time slot'),
  ],
  AssemblyController.createBooking
);

/**
 * @route   GET /api/assembly/:id
 * @desc    Get assembly booking by ID
 * @access  Private
 */
router.get('/:id', authenticate, AssemblyController.getBooking);

/**
 * @route   GET /api/assembly/user/me
 * @desc    Get current user's assembly bookings
 * @access  Private
 */
router.get('/user/me', authenticate, AssemblyController.getUserBookings);

/**
 * @route   PUT /api/assembly/:id/schedule
 * @desc    Schedule assembly booking
 * @access  Private (Admin, Branch Manager)
 */
router.put(
  '/:id/schedule',
  authenticate,
  authorize('ADMIN', 'BRANCH_MANAGER'),
  [
    body('scheduled_date').isISO8601().withMessage('Invalid date format'),
    body('technician_id').isUUID().withMessage('Invalid technician ID'),
    body('estimated_duration').isInt({ min: 1 }).withMessage('Invalid duration'),
  ],
  AssemblyController.scheduleBooking
);

/**
 * @route   PUT /api/assembly/:id/status
 * @desc    Update booking status
 * @access  Private (Admin, Branch Manager, Technician)
 */
router.put(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'BRANCH_MANAGER'),
  [
    body('status')
      .isIn(['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
      .withMessage('Invalid status'),
  ],
  AssemblyController.updateStatus
);

/**
 * @route   POST /api/assembly/:id/feedback
 * @desc    Add customer feedback
 * @access  Private
 */
router.post(
  '/:id/feedback',
  authenticate,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('feedback').notEmpty().withMessage('Feedback is required'),
  ],
  AssemblyController.addFeedback
);

/**
 * @route   GET /api/assembly/technician/:technician_id/schedule
 * @desc    Get technician schedule
 * @access  Private (Admin, Branch Manager)
 */
router.get(
  '/technician/:technician_id/schedule',
  authenticate,
  authorize('ADMIN', 'BRANCH_MANAGER'),
  AssemblyController.getTechnicianSchedule
);

module.exports = router;

