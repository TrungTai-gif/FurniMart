import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'Order' })
  orderId!: string;

  @Prop({ required: true })
  action!: string; // 'status_update', 'delivery_update', 'proof_upload', 'order_created', 'order_cancelled'

  @Prop({ required: true })
  description!: string;


  @Prop({
    type: [{
      field: { type: String, required: true },
      oldValue: { type: String, required: true },
      newValue: { type: String, required: true },
    }],
    default: [],
  })
  changes?: Array<{
    field: string;
    oldValue: string;
    newValue: string;
  }>;


