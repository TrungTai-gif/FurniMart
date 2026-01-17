import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WalletDocument = Wallet & Document;
export type WalletTransactionDocument = WalletTransaction & Document;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ required: true, unique: true })
  userId!: string;

  @Prop({ default: 0 })
  balance!: number;

  @Prop({ default: 0 })
  lockedBalance!: number;

  @Prop({ default: 0 })
  totalDeposited!: number;

  @Prop({ default: 0 })
  totalWithdrawn!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

@Schema({ timestamps: true })
export class WalletTransaction {
  @Prop({ required: true, type: String, ref: 'Wallet' })
  walletId!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true, enum: ['deposit', 'withdraw', 'escrow_lock', 'escrow_release', 'escrow_refund', 'transfer'] })
  type!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' })
  status!: string;

  @Prop()
  orderId?: string;

  @Prop()
  paymentId?: string;

  @Prop()
  description?: string;

  @Prop()
  referenceId?: string;

  @Prop()
  completedAt?: Date;

  @Prop()
  failedReason?: string;

  @Prop()
  bankAccount?: string;

  @Prop()
  bankName?: string;

  @Prop()
  accountHolderName?: string;

  @Prop()
  adminNote?: string;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);

WalletSchema.index({ userId: 1 });
WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ orderId: 1 });

