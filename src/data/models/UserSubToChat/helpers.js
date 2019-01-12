import { UserSubToChat } from '../index';

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

export default findOrCreateActiveSub;
