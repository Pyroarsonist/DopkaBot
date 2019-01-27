/* eslint-disable no-underscore-dangle */
import { bot } from 'core/telegram';
import _ from 'lodash';
import debugHandler from 'debug';
import {
  findOrCreateUser,
  findOrCreateChat,
  Dopka,
  Recovery,
  findOrCreateActiveSub,
  UserSubToChat,
  User,
} from 'data/models';
import { intervals } from 'config';
import { formatTime } from 'data/tools';

const debug = debugHandler('dopkabot:commands');

export default () => {
  bot.catch(err => {
    debug(err);
  });

  bot.use(async (ctx, next) => {
    ctx.pyroUser = await findOrCreateUser(ctx.from);
    ctx.pyroChat = await findOrCreateChat(ctx.chat);
    return next(ctx);
  });

  bot.command('start', async ctx => {
    await findOrCreateActiveSub(ctx.pyroUser._id, ctx.pyroChat._id);
    return ctx.reply(
      'Чего опаздываем? На галерку не садимся, будете на первых партах меня слушать',
    );
  });

  bot.command('help', async ctx =>
    ctx.replyWithMarkdown(
      'Всем добрый времени суток, студенты.\n' +
        'Я надеюсь вы будете слушать внимательно, не перебивая меня и не переспрашивая 100 раз, как это бывает.\n' +
        `Так вот, раз в ${formatTime(
          intervals.dopka / 1000,
        )} у меня проходит экзамен, а значит приходите уже готовыми.\nЖду вас, не опаздывайте.`,
    ),
  );

  bot.command('me', async ctx => {
    const countD = await Dopka.count({
      chat: ctx.pyroChat._id,
      user: ctx.pyroUser._id,
    });
    const countR = await Recovery.count({
      chat: ctx.pyroChat._id,
      user: ctx.pyroUser._id,
    });
    const text = `${
      ctx.pyroUser.mention
    } был на допке ${countD} раз, а на восстановлении ${countR} раз`;
    return ctx.replyWithMarkdown(text);
  });

  bot.command('register', async ctx => {
    const [, wasCreated] = await findOrCreateActiveSub(
      ctx.pyroUser._id,
      ctx.pyroChat._id,
    );
    const { pyroUser } = ctx;
    const text = wasCreated
      ? `${pyroUser.mention}, так, значит лабу донесешь, жду на экзамене`
      : `${
          pyroUser.mention
        }, ты глухой что-ли?\nЯ тебя уже отконсультировала, иди готовься к экзамену`;
    return ctx.replyWithMarkdown(text);
  });

  bot.command('dopka', async ctx => {
    const dopkaInterval = Date.now() - intervals.dopka;
    const dopka = await Dopka.findOne({
      createdAt: { $gt: dopkaInterval },
      chat: ctx.pyroChat._id,
    })
      .sort({ createdAt: 'desc' })
      .limit(1);
    if (dopka) {
      const userOnDopka = await User.findById(dopka.user._id);
      if (!userOnDopka)
        return ctx.reply('Так дети, все, я ушла и больше не принимаю');
      const seconds =
        (Date.parse(dopka.createdAt) + intervals.dopka - Date.now()) / 1000;
      const text = `На допке уже чиллит ${
        userOnDopka.name
      }\nДо новой допки осталось ${formatTime(seconds)}`;
      return ctx.replyWithMarkdown(text);
    }
    const usersRelation = await UserSubToChat.find({
      chat: ctx.pyroChat._id,
      active: true,
    });
    if (usersRelation.length === 0) {
      return ctx.reply(
        'Группа интерестная!\nНикого нет, а они ешку хотят значит!\nХрен вам всем!',
      );
    }
    const onDopkaUserRelation = _.sample(usersRelation);
    const userOnDopka = await User.findById(onDopkaUserRelation.user);
    await new Dopka({
      chat: ctx.pyroChat._id,
      user: onDopkaUserRelation.user,
    }).save();
    await ctx.replyWithMarkdown('Тааак...');
    await ctx.replyWithMarkdown(
      'Посмотрим на списки, кто не ходил на лекции...',
    );
    await ctx.replyWithMarkdown(
      'Кажется, я знаю кто сегодня даже ешку не получит...',
    );
    return ctx.replyWithMarkdown(
      `${userOnDopka.mention} отправляется на допку`,
    );
  });

  bot.on('left_chat_participant', async ctx => {
    const userRelation = await UserSubToChat.findOne({
      chat: ctx.pyroChat._id,
      user: ctx.pyroUser._id,
    });
    userRelation.active = false;
    await userRelation.save();
    const text = `${
      ctx.pyroUser.mention
    } значит уходит после пары, а что дальше?\nВ армию пойдете?`;
    return ctx.replyWithMarkdown(text);
  });

  bot.command('top', async ctx => {
    const dopkas = await Dopka.aggregate([
      {
        $match: { chat: ctx.pyroChat._id },
      },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);
    const recoveries = await Recovery.aggregate([
      {
        $match: { chat: ctx.pyroChat._id },
      },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);
    const userDopkas = await Promise.all(
      dopkas.map(async dopka => {
        const user = await User.findById(dopka._id);
        return { user, count: dopka.count };
      }),
    );
    const userRecoveries = await Promise.all(
      recoveries.map(async recovery => {
        const user = await User.findById(recovery._id);
        return { user, count: recovery.count };
      }),
    );
    let text = '';
    if (userDopkas.length + userRecoveries.length === 0) {
      text = 'Пока что тут пусто...\nНо *каждый* может стать первым!';
    } else {
      if (userDopkas.length > 0) {
        text += 'Допки ☠️\n';
        userDopkas.forEach(({ user, count }, i) => {
          text += `${i + 1}. ${user.name} был на допке ${count} раз\n`;
        });
      }
      if (userRecoveries.length > 0) {
        text += 'Восстановления ✝️\n';
        userRecoveries.forEach(({ user, count }, i) => {
          text += `${i + 1}. ${user.name} был на восстановлении ${count} раз\n`;
        });
      }
    }

    return ctx.replyWithMarkdown(text);
  });

  bot.command('recovery', async ctx => {
    const recoveryInterval = Date.now() - intervals.recovery;
    const recovery = await Recovery.findOne({
      createdAt: { $gt: recoveryInterval },
      chat: ctx.pyroChat._id,
    })
      .sort({ createdAt: 'desc' })
      .limit(1);
    if (recovery) {
      const userOnRecovery = await User.findById(recovery.user._id);
      if (!userOnRecovery) return ctx.reply('Ты отчислен, что ты тут делаешь?');
      const seconds =
        (Date.parse(recovery.createdAt) + intervals.recovery - Date.now()) /
        1000;
      const text = `Уже восстановился ${
        userOnRecovery.name
      }\nДо нового восстановления осталось ${formatTime(seconds)}`;
      return ctx.replyWithMarkdown(text);
    }
    const dopkas = await Dopka.find({
      chat: ctx.pyroChat._id,
    });
    if (dopkas.length === 0) {
      return ctx.replyWithMarkdown(
        `Молодцы, все хорошо учились и даже восстанавливать некого!`,
      );
    }
    const randomDopka = _.sample(dopkas);
    const userOnRecovery = await User.findById(randomDopka.user);
    await new Recovery({
      chat: ctx.pyroChat._id,
      user: randomDopka.user,
    }).save();
    await ctx.replyWithMarkdown('Значит вот эту справку оформишь...');
    await ctx.replyWithMarkdown('Это занеси в 31 корпус...');
    await ctx.replyWithMarkdown('Документы почти готовы...');
    return ctx.replyWithMarkdown(`${userOnRecovery.mention} восстановился!`);
  });

  bot.command('shrug', async ctx => ctx.replyWithMarkdown('*¯\\_(ツ)_/¯*'));
};
