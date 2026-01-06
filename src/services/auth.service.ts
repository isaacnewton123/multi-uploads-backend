import bcrypt from 'bcryptjs';
import { User, type IUser } from '../models/user.model';
import { OTP } from '../models/otp.model';
import { emailService } from './email.service';
import { generateToken, type JWTPayload } from '../utils/jwt.util';
import { validateEmail, validatePassword, generateOTPCode } from '../utils/validation.util';
import { ENV } from '../config/env';
import { UserTier } from '../types';

class AuthService {
  async register(email: string, password: string, phone?: string): Promise<{ message: string }> {
    // Validate email
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message!);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      phone,
      tier: UserTier.BASIC,
      isEmailVerified: false,
    });

    await user.save();

    // Generate and send OTP
    await this.sendOTP(email);

    return { message: 'Registration successful. Please verify your email with the OTP sent.' };
  }

  async sendOTP(email: string): Promise<{ message: string }> {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    // Generate OTP
    const code = generateOTPCode();
    const expiresAt = new Date(Date.now() + ENV.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email });

    // Save new OTP
    const otp = new OTP({
      email,
      code,
      expiresAt,
    });

    await otp.save();

    // Send OTP via email
    await emailService.sendOTP(email, code);

    return { message: 'OTP sent successfully to your email' };
  }

  async verifyOTP(email: string, code: string): Promise<{ token: string; user: Partial<IUser> }> {
    // Find OTP
    const otp = await OTP.findOne({ email, code });
    
    if (!otp) {
      throw new Error('Invalid OTP code');
    }

    // Check if OTP is expired
    if (otp.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otp._id });
      throw new Error('OTP has expired. Please request a new one.');
    }

    // Find user and update email verification status
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    user.isEmailVerified = true;
    await user.save();

    // Delete OTP after successful verification
    await OTP.deleteOne({ _id: otp._id });

    // Generate JWT token
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      tier: user.tier,
    };

    const token = generateToken(payload);

    // Send welcome email (async, don't wait)
    emailService.sendWelcomeEmail(user.email).catch(console.error);

    return {
      token,
      user: {
        id: user._id .toString(),
        email: user.email,
        phone: user.phone,
        tier: user.tier,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async login(email: string, password: string): Promise<{ message: string }> {
    // Validate email
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Send OTP for login verification
    await this.sendOTP(email);

    return { message: 'OTP sent to your email. Please verify to complete login.' };
  }

  async getUserById(userId: string): Promise<Partial<IUser> | null> {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return null;
    }

    return {
      id: user._id .toString(),
      email: user.email,
      phone: user.phone,
      tier: user.tier,
      isEmailVerified: user.isEmailVerified,
      dailyUploadCount: user.dailyUploadCount,
      lastResetDate: user.lastResetDate,
    };
  }
}

export const authService = new AuthService();