/**
 * User Controller
 * Handles user authentication and profile management
 */

const UserModel = require('../models/userModel');
const { cache } = require('../config/redis');
const {
  generateOTP,
  generateToken,
  normalizePhoneNumber,
  validatePhoneNumber
} = require('../utils/auth');

class UserController {
  /**
   * Register new user
   */
  static async register(req, res) {
    try {
      let { phoneNumber, role, businessName, companyName } = req.body;

      // Normalize phone number (strip +91 if present)
      phoneNumber = normalizePhoneNumber(phoneNumber);

      // Check if user already exists
      const existingUser = await UserModel.findByPhone(phoneNumber);

      if (existingUser) {
        return res.status(409).json({
          error: {
            message: 'Phone number already registered',
            code: 'USER_EXISTS'
          }
        });
      }

      // Create new user
      const user = await UserModel.create(phoneNumber, role, businessName || companyName);

      // Create role-specific profile immediately upon registration
      if (role === 'shipper' && (businessName || companyName)) {
        await UserModel.createShipperProfile(user.user_id, {
          companyName: businessName || companyName,
          gstNumber: null,
          address: null
        });
      } else if (role === 'carrier' && (businessName || companyName)) {
        await UserModel.createCarrierProfile(user.user_id, {
          companyName: businessName || companyName,
          fleetSize: 0
        });
      }

      // Generate and store OTP
      const otp = generateOTP();
      await cache.setOTP(phoneNumber, otp);

      // In production, send OTP via SMS
      // For MVP, we'll return it in response (development only)
      const response = {
        success: true,
        message: 'OTP sent successfully',
        userId: user.user_id,
        role: user.role
      };

      // TEMPORARY: Always include OTP for demo purposes
      response.otp = otp;
      response.dev_message = 'OTP included for demo purposes';

      res.status(201).json(response);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: {
          message: 'Registration failed',
          code: 'REGISTRATION_ERROR'
        }
      });
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      let { phoneNumber } = req.body;

      // Normalize phone number (strip +91 if present)
      phoneNumber = normalizePhoneNumber(phoneNumber);

      // Check if user exists
      const user = await UserModel.findByPhone(phoneNumber);

      if (!user) {
        return res.status(404).json({
          error: {
            message: 'User not found. Please register first.',
            code: 'USER_NOT_FOUND'
          }
        });
      }

      // Check if user is suspended (manual suspension, not just inactive)
      // We can add a separate suspended field later if needed
      // For now, we'll skip this check as we only have is_active

      // Generate and store OTP
      const otp = generateOTP();
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await cache.setOTP(phoneNumber, otp);
      await cache.set(`session:${sessionId}`, phoneNumber, 300); // 5 minutes expiry

      // In production, send OTP via SMS
      const response = {
        success: true,
        message: 'OTP sent successfully',
        userId: user.user_id,
        sessionId: sessionId
      };

      // TEMPORARY: Always include OTP for demo purposes
      response.otp = otp;
      response.dev_message = 'OTP included for demo purposes';

      res.json(response);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: {
          message: 'Login failed',
          code: 'LOGIN_ERROR'
        }
      });
    }
  }

  /**
   * Verify OTP and issue JWT token
   */
  static async verifyOTP(req, res) {
    try {
      let { phoneNumber, otp } = req.body;

      // Normalize phone number (strip +91 if present)
      phoneNumber = normalizePhoneNumber(phoneNumber);

      // OTP verification is done in middleware
      // If we reach here, OTP is valid

      // Get user
      const user = await UserModel.findByPhone(phoneNumber);

      if (!user) {
        return res.status(404).json({
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        });
      }

      // Auto-activate users in development mode (after first OTP verification)
      if (process.env.NODE_ENV !== 'production' && !user.is_active) {
        await UserModel.updateStatus(user.user_id, true);
        user.is_active = true;
      }

      // Update last login
      await UserModel.updateLastLogin(user.user_id);

      // Generate JWT token
      const token = generateToken({
        userId: user.user_id,
        phoneNumber: user.phone_number,
        role: user.role
      });

      // Prepare response
      const response = {
        success: true,
        token,
        user: {
          userId: user.user_id,
          phoneNumber: user.phone_number,
          role: user.role,
          status: user.is_active ? 'active' : 'pending',
          isActive: user.is_active,
          isVerified: user.is_verified,
          isProfileComplete: false
        }
      };

      // Check if profile is complete
      if (user.role === 'shipper' && user.shipper_id) {
        response.user.isProfileComplete = true;
        response.user.shipperId = user.shipper_id;
        response.user.companyName = user.shipper_company;
      } else if (user.role === 'carrier' && user.carrier_id) {
        response.user.isProfileComplete = true;
        response.user.carrierId = user.carrier_id;
        response.user.companyName = user.carrier_company;
      } else if (user.role === 'driver' && user.driver_id) {
        response.user.isProfileComplete = true;
        response.user.driverId = user.driver_id;
        response.user.driverName = user.driver_name;
      }

      res.json(response);
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        error: {
          message: 'Verification failed',
          code: 'VERIFICATION_ERROR'
        }
      });
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        });
      }

      // Get user statistics
      const stats = await UserModel.getUserStats(userId, user.role);

      const profile = {
        userId: user.user_id,
        phoneNumber: user.phone_number,
        role: user.role,
        status: user.is_active ? 'active' : 'pending',
        isActive: user.is_active,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        statistics: stats
      };

      // Add role-specific profile data
      if (user.role === 'shipper' && user.shipper_id) {
        profile.shipper = {
          shipperId: user.shipper_id,
          companyName: user.shipper_company,
          gstNumber: user.shipper_gst,
          // Add other shipper fields as needed
        };
      } else if (user.role === 'carrier' && user.carrier_id) {
        profile.carrier = {
          carrierId: user.carrier_id,
          companyName: user.carrier_company,
          fleetSize: user.fleet_size,
          // Add other carrier fields as needed
        };
      } else if (user.role === 'driver' && user.driver_id) {
        profile.driver = {
          driverId: user.driver_id,
          fullName: user.driver_name,
          licenseNumber: user.license_number,
          // Add other driver fields as needed
        };
      }

      res.json(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to fetch profile',
          code: 'PROFILE_FETCH_ERROR'
        }
      });
    }
  }

  /**
   * Create shipper profile
   */
  static async createShipperProfile(req, res) {
    try {
      const userId = req.user.userId;

      // Check if user is a shipper
      if (req.user.role !== 'shipper') {
        return res.status(403).json({
          error: {
            message: 'Only shippers can create shipper profiles',
            code: 'INVALID_ROLE'
          }
        });
      }

      // Check if profile already exists
      if (req.user.shipperId) {
        return res.status(409).json({
          error: {
            message: 'Profile already exists',
            code: 'PROFILE_EXISTS'
          }
        });
      }

      const profile = await UserModel.createShipperProfile(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Shipper profile created successfully',
        profile
      });
    } catch (error) {
      console.error('Create shipper profile error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to create profile',
          code: 'PROFILE_CREATE_ERROR'
        }
      });
    }
  }

  /**
   * Create carrier profile
   */
  static async createCarrierProfile(req, res) {
    try {
      const userId = req.user.userId;

      // Check if user is a carrier
      if (req.user.role !== 'carrier') {
        return res.status(403).json({
          error: {
            message: 'Only carriers can create carrier profiles',
            code: 'INVALID_ROLE'
          }
        });
      }

      // Check if profile already exists
      if (req.user.carrierId) {
        return res.status(409).json({
          error: {
            message: 'Profile already exists',
            code: 'PROFILE_EXISTS'
          }
        });
      }

      const profile = await UserModel.createCarrierProfile(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Carrier profile created successfully',
        profile
      });
    } catch (error) {
      console.error('Create carrier profile error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to create profile',
          code: 'PROFILE_CREATE_ERROR'
        }
      });
    }
  }

  /**
   * Create driver profile
   */
  static async createDriverProfile(req, res) {
    try {
      const userId = req.user.userId;

      // Check if user is a driver
      if (req.user.role !== 'driver') {
        return res.status(403).json({
          error: {
            message: 'Only drivers can create driver profiles',
            code: 'INVALID_ROLE'
          }
        });
      }

      // Check if profile already exists
      if (req.user.driverId) {
        return res.status(409).json({
          error: {
            message: 'Profile already exists',
            code: 'PROFILE_EXISTS'
          }
        });
      }

      const profile = await UserModel.createDriverProfile(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Driver profile created successfully',
        profile
      });
    } catch (error) {
      console.error('Create driver profile error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to create profile',
          code: 'PROFILE_CREATE_ERROR'
        }
      });
    }
  }

  /**
   * Update shipper profile
   */
  static async updateShipperProfile(req, res) {
    try {
      const userId = req.user.userId;
      const shipperId = req.user.shipperId;

      // Check if user is a shipper with profile
      if (req.user.role !== 'shipper' || !shipperId) {
        return res.status(403).json({
          error: {
            message: 'No shipper profile found',
            code: 'NO_PROFILE'
          }
        });
      }

      const updatedProfile = await UserModel.updateShipperProfile(
        shipperId,
        req.body
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        profile: updatedProfile
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update profile',
          code: 'PROFILE_UPDATE_ERROR'
        }
      });
    }
  }

  /**
   * Resend OTP
   */
  static async resendOTP(req, res) {
    try {
      const { phoneNumber } = req.body;

      // Check if user exists
      const user = await UserModel.findByPhone(phoneNumber);

      if (!user) {
        return res.status(404).json({
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        });
      }

      // Check if OTP already exists (rate limiting)
      const existingOTP = await cache.getOTP(phoneNumber);
      if (existingOTP) {
        return res.status(429).json({
          error: {
            message: 'Please wait before requesting new OTP',
            code: 'OTP_RATE_LIMIT'
          }
        });
      }

      // Generate and store new OTP
      const otp = generateOTP();
      await cache.setOTP(phoneNumber, otp);

      const response = {
        success: true,
        message: 'OTP resent successfully'
      };

      // TEMPORARY: Always include OTP for demo purposes
      response.otp = otp;
      response.dev_message = 'OTP included for demo purposes';

      res.json(response);
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to resend OTP',
          code: 'OTP_RESEND_ERROR'
        }
      });
    }
  }

  /**
   * Update carrier profile (placeholder)
   */
  static async updateCarrierProfile(req, res) {
    res.status(501).json({
      error: {
        message: 'Not implemented yet',
        code: 'NOT_IMPLEMENTED'
      }
    });
  }

  /**
   * Update driver profile (placeholder)
   */
  static async updateDriverProfile(req, res) {
    res.status(501).json({
      error: {
        message: 'Not implemented yet',
        code: 'NOT_IMPLEMENTED'
      }
    });
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(req, res) {
    res.status(501).json({
      error: {
        message: 'Not implemented yet',
        code: 'NOT_IMPLEMENTED'
      }
    });
  }

  /**
   * Update user status (admin only)
   */
  static async updateUserStatus(req, res) {
    res.status(501).json({
      error: {
        message: 'Not implemented yet',
        code: 'NOT_IMPLEMENTED'
      }
    });
  }

  /**
   * Logout (optional - mainly for clearing client-side token)
   */
  static async logout(req, res) {
    // In a JWT-based system, logout is mainly handled client-side
    // We could implement token blacklisting in Redis if needed

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}

module.exports = UserController;