import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  orderId!: string;

  @Prop({ required: true })
  customerId!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true, enum: ['vnpay'], default: 'vnpay' })
  method!: string;

  @Prop({ enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'], default: 'pending' })
  status!: string;

  @Prop()
  transactionId?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  gatewayResponse?: any;

  @Prop()
  callbackUrl?: string;

  @Prop()
  returnUrl?: string;

  @Prop()
  completedAt?: Date;

  @Prop()
  failedReason?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

