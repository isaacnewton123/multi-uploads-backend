import { authService } from '../services/auth.service';

export const authController = {
  async register(body: any) {
    try {
      const { email, password, phone } = body;

      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required',
        };
      }

      const result = await authService.register(email, password, phone);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  async login(body: any) {
    try {
      const { email, password } = body;

      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required',
        };
      }

      const result = await authService.login(email, password);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  async verifyOTP(body: any) {
    try {
      const { email, code } = body;

      if (!email || !code) {
        return {
          success: false,
          message: 'Email and OTP code are required',
        };
      }

      const result = await authService.verifyOTP(email, code);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  async resendOTP(body: any) {
    try {
      const { email } = body;

      if (!email) {
        return {
          success: false,
          message: 'Email is required',
        };
      }

      const result = await authService.sendOTP(email);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  async getProfile(userId: string) {
    try {
      const user = await authService.getUserById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },
};