import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  phone?: string;

  @Prop({ default: 'customer', enum: ['customer', 'employee', 'manager', 'shipper', 'admin'] })
  role!: string;

  @Prop()
  address?: string;

  @Prop({ type: [{
    name: String,
    phone: String,
    street: String,
    ward: String,
    district: String,
    city: String,
    isDefault: { type: Boolean, default: false },
  }], default: [] })
  addresses?: Array<{
    name: string;
    phone: string;
    street: string;
    ward: string;
    district: string;
    city: string;
    isDefault?: boolean;
  }>;

  @Prop({ default: true })
  isActive!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

