import Telegraf from 'telegraf';
import fs from 'fs';
import debugHandler from 'debug';
import setupCommands from '../data/commands';
import { server, token, tlsPaths, sslFolder } from '../config';

const debug = debugHandler('dopkabot:telegram');

export default async () => {
  if (!token) {
    throw new Error('No telegram bot key supplied');
  }
  let bot;
  try {
    debug('Initializing telegram bot');
    bot = new Telegraf(token, { username: 'dopka_bot' });

    // loading commands

    setupCommands(bot);

    // setting up connection webhooks or polling
    if (__DEV__ || !sslFolder) {
      bot.startPolling();
      debug('Started with polling');
    } else {
      // removing webhooks
      await bot.telegram.deleteWebhook();
      const tlsOptions = {
        key: fs.readFileSync(tlsPaths.key), // Path to file with PEM private key
        cert: fs.readFileSync(tlsPaths.cert), // Path to file with PEM certificate,
        ca: [
          // This is necessary only if the client uses the self-signed certificate.
          fs.readFileSync(tlsPaths.ca),
        ],
      };
      // server side
      bot.telegram.setWebhook(`${server.url}:${server.port}/bot${token}`, {
        source: tlsPaths.ca,
      });
      // telegram side
      bot.startWebhook(`/bot${token}`, tlsOptions, 8443);
      debug('Started with webhook');
    }
  } catch (e) {
    console.error(e);
  }
};
