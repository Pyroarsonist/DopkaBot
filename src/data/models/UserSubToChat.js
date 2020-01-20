import { Schema } from 'mongoose';
import db from 'core/mongo';

const Model = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    chat: { type: Schema.Types.ObjectId, ref: 'Chat' },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

const UserSubToChat = db.model('UserSubToChat', Model);

async function findOrCreateActiveSub(userId, chatId) {
  let foundedSub = await UserSubToChat.findOne({
    user: userId,
    chat: chatId,
  });
  let wasCreated = false;

  if (foundedSub) {
    foundedSub.active = true;
    await foundedSub.save();
  } else {
    wasCreated = true;
    foundedSub = await new UserSubToChat({ user: userId, chat: chatId }).save();
  }
  return [foundedSub, wasCreated];
}

export { findOrCreateActiveSub };
export default UserSubToChat;
