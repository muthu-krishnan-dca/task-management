import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    // Seed default admin and user if database is empty
    try {
      const count = await this.userModel.countDocuments();
      if (count === 0) {
        await this.userModel.create({
          name: 'Administrator',
          email: 'admin@ablespace.io',
          password: 'admin',
          role: 'Admin',
          phone: '+91 98765 43210',
          avatarUrl: '',
        });
        await this.userModel.create({
          name: 'User Evaluator',
          email: 'user@ablespace.io',
          password: 'user',
          role: 'User',
          phone: '+91 98765 00000',
          avatarUrl: '',
        });
      }
    } catch (err) {
      console.warn('Could not seed initial users:', err);
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

  async updateUser(id: string, updateData: { name?: string; email?: string; password?: string; role?: string; phone?: string; status?: string }) {
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
