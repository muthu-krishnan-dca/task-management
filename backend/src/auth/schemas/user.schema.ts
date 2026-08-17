import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'User', enum: ['Admin', 'User', 'Guest'] })
  role: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: '' })
  resetOtp?: string;

  @Prop({ type: Date })
  resetOtpExpiry?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
