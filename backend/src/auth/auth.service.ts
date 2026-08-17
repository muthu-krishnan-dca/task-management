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
}
