import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  orderId!: string;

  @Prop({ required: true })
  customerId!: double;



  @Prop({ required: true, enum: ['vnpay'], default: 'vnpay' })
  method!: string;

  @Prop({ enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'], default: 'pending' })
  status!: string;

  @Prop()
  transactionId?: string;

 

  @Prop()
  callbackUrl?: string;

  @Prop()
  returnUrl?: string;

  @Prop()
  completedAt?: Date;


}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

