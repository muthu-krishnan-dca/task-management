import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    // Ensure default admin exists if database has no accounts
    try {
      const adminExists = await this.userModel.findOne({ role: 'Admin' });
      if (!adminExists) {
        await this.userModel.create({
          name: 'Administrator',
          email: 'admin@ablespace.io',
          password: 'admin',
          role: 'Admin',
          phone: '+91 98765 43210',
          avatarUrl: '',
        });
      }
    } catch (err) {
      console.warn('Could not initialize admin account:', err);
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({
      email: dto.email.toLowerCase().trim(),
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const role = dto.role && ['Admin', 'User', 'Guest'].includes(dto.role) ? dto.role : 'User';

    const createdUser = await this.userModel.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase().trim(),
      password: dto.password,
      role,
      phone: dto.phone || '',
      avatarUrl: dto.avatarUrl || '',
    });

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: createdUser._id.toString(),
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        phone: createdUser.phone,
        avatarUrl: createdUser.avatarUrl,
      },
      token: `token_${createdUser._id.toString()}_${Date.now()}`,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({
      email: dto.email.toLowerCase().trim(),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.password !== dto.password) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
      token: `token_${user._id.toString()}_${Date.now()}`,
    };
  }

  private otpStore = new Map<string, { otp: string; expiresAt: number }>();

  async sendPasswordResetOtp(email: string) {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) {
      throw new NotFoundException('Email address is required.');
    }

    const user = await this.userModel.findOne({ email: cleanEmail });
    if (!user) {
      throw new NotFoundException('No account found with this email address.');
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    this.otpStore.set(cleanEmail, { otp, expiresAt });

    // Dispatch real email via Nodemailer SMTP
    const userSmtp = process.env.SMTP_USER || process.env.EMAIL_USER;
    const passSmtp = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const hostSmtp = process.env.SMTP_HOST || 'smtp.gmail.com';
    const portSmtp = parseInt(process.env.SMTP_PORT || '587', 10);
    const fromSmtp = process.env.SMTP_FROM || `"AbleSpace Security" <${userSmtp || 'no-reply@ablespace.io'}>`;

    if (userSmtp && passSmtp) {
      try {
        const transporter = nodemailer.createTransport({
          host: hostSmtp,
          port: portSmtp,
          secure: portSmtp === 465,
          auth: {
            user: userSmtp,
            pass: passSmtp,
          },
        });

        await transporter.sendMail({
          from: fromSmtp,
          to: cleanEmail,
          subject: `${otp} is your AbleSpace Verification Code`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 28px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #ffffff; padding: 10px 22px; border-radius: 12px; font-weight: 800; font-size: 20px; letter-spacing: 0.5px;">
                  AbleSpace
                </div>
              </div>
              <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin-bottom: 12px; text-align: center;">Reset Your Password</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
                Hello <strong>${user.name || 'User'}</strong>,<br/>
                We received a request to reset your password for your AbleSpace account (<strong>${cleanEmail}</strong>).
              </p>
              <div style="background: linear-gradient(135deg, #f5f3ff, #ede9fe); border: 2px dashed #8b5cf6; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="display: block; font-size: 12px; font-weight: 700; color: #6d28d9; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Your 6-Digit OTP Code</span>
                <span style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #5b21b6; font-family: monospace; display: inline-block; padding: 4px 12px;">${otp}</span>
                <p style="color: #7c3aed; font-size: 12px; font-weight: 600; margin-top: 10px; margin-bottom: 0;">⏱️ Valid for 5 minutes only</p>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center; margin-bottom: 20px;">
                Enter this code on the password reset page to choose a new password. If you didn't request this code, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
              <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
                © 2026 AbleSpace Task Management System. All rights reserved.
              </p>
            </div>
          `,
        });
        console.log(`[SMTP] Successfully dispatched real OTP email to ${cleanEmail}`);
      } catch (mailError) {
        console.error('[SMTP] Error sending email via SMTP:', mailError);
      }
    } else {
      console.warn(
        `[SMTP] SMTP_USER & SMTP_PASS not set in backend/.env. OTP for ${cleanEmail} is: ${otp}`
      );
    }

    return {
      success: true,
      message: `Verification code has been sent directly to ${cleanEmail}`,
      expiresInSeconds: 300,
    };
  }

  async verifyPasswordResetOtp(email: string, otp: string) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const record = this.otpStore.get(cleanEmail);

    if (!record) {
      throw new ConflictException('No OTP request found. Please request a new code.');
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(cleanEmail);
      throw new ConflictException('Verification code has expired. Please request a new code.');
    }

    if (record.otp !== otp.trim()) {
      throw new ConflictException('Invalid verification code. Please check and try again.');
    }

    return {
      success: true,
      message: 'Verification code verified successfully!',
    };
  }

  async completePasswordReset(dto: { email: string; otp: string; newPassword: string }) {
    const cleanEmail = (dto.email || '').toLowerCase().trim();
    
    // Verify OTP first
    await this.verifyPasswordResetOtp(cleanEmail, dto.otp);

    const user = await this.userModel.findOne({ email: cleanEmail });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!dto.newPassword || dto.newPassword.trim().length < 4) {
      throw new ConflictException('New password must be at least 4 characters.');
    }

    user.password = dto.newPassword.trim();
    await user.save();

    // Invalidate OTP after successful reset
    this.otpStore.delete(cleanEmail);

    return {
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    };
  }

  async resetPassword(dto: { email: string; newPassword: string }) {
    const cleanEmail = (dto.email || '').toLowerCase().trim();
    if (!cleanEmail) {
      throw new NotFoundException('Email address is required.');
    }

    const user = await this.userModel.findOne({ email: cleanEmail });
    if (!user) {
      throw new NotFoundException('No account found with this email address.');
    }

    if (!dto.newPassword || dto.newPassword.trim().length < 4) {
      throw new ConflictException('New password must be at least 4 characters.');
    }

    user.password = dto.newPassword.trim();
    await user.save();

    return {
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    };
  }

  async getProfile(email: string) {
    const user = await this.userModel.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    };
  }

  async getAllUsers() {
    const users = await this.userModel.find().sort({ createdAt: -1 });
    return users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      status: 'Active',
    }));
  }

  async updateProfile(data: { email: string; name?: string; phone?: string; avatarUrl?: string }) {
    const cleanEmail = (data.email || '').toLowerCase().trim();
    if (!cleanEmail) {
      throw new NotFoundException('Email address is required.');
    }
    const user = await this.userModel.findOne({ email: cleanEmail });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (data.name) user.name = data.name.trim();
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
    await user.save();
    return {
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async updateUser(id: string, updateData: { name?: string; email?: string; password?: string; role?: string; phone?: string; avatarUrl?: string; status?: string }) {
    let user: any = null;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await this.userModel.findById(id);
    }
    if (!user && updateData.email) {
      user = await this.userModel.findOne({ email: updateData.email.toLowerCase().trim() });
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (updateData.name) user.name = updateData.name.trim();
    if (updateData.email) user.email = updateData.email.toLowerCase().trim();
    if (updateData.password && updateData.password.trim()) user.password = updateData.password.trim();
    if (updateData.role) user.role = updateData.role;
    if (updateData.phone !== undefined) user.phone = updateData.phone;
    if (updateData.avatarUrl !== undefined) user.avatarUrl = updateData.avatarUrl;
    await user.save();
    return {
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        status: 'Active',
      },
    };
  }

  async deleteUser(id: string) {
    let res: any = null;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      res = await this.userModel.findByIdAndDelete(id);
    }
    if (!res) {
      res = await this.userModel.findOneAndDelete({ email: id.toLowerCase().trim() });
    }
    return { success: true, message: 'User removed successfully' };
  }
}
