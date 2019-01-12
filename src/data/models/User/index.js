import { Schema } from 'mongoose';
import db from 'core/mongo';
import { date } from 'data/tools';

const User = new Schema(
  {
    id: { type: String, required: true, unique: true },
    isBot: String,
    firstName: String,
    lastName: String,
    username: String,
    languageCode: String,
  },
  {
    timestamps: true,
  },
);

function getUser() {
  return {
    id: this.id,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    languageCode: this.languageCode,
    createdAt: date(this.createdAt),
    updatedAt: date(this.updatedAt),
  };
}

function getMention() {
  const tg = `(tg://user?id=${this.id})`;
  if (this.username) {
    return `[${this.username}]${tg}`;
  }
  const firstName = this.firstName ? `${this.firstName} ` : '';
  const lastName = this.lastName ? this.lastName : '';
  return `[${firstName}${lastName}]${tg}`;
}

User.virtual('formatted').get(getUser);

User.virtual('mention').get(getMention);

export default db.model('User', User);
