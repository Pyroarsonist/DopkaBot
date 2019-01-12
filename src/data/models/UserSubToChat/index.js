import { Schema } from 'mongoose';
import db from 'core/mongo';

const UserSubToChat = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    chat: { type: Schema.Types.ObjectId, ref: 'Chat' },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

export default db.model('UserSubToChat', UserSubToChat);
