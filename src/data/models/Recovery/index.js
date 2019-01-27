import { Schema } from 'mongoose';
import db from 'core/mongo';

const Recovery = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    chat: { type: Schema.Types.ObjectId, ref: 'Chat' },
  },
  {
    timestamps: true,
  },
);

export default db.model('Recovery', Recovery);
