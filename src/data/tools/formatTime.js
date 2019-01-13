import moment from 'moment';

export default seconds => {
  const formats = [];
  const hours = moment.duration(seconds, 'seconds').asHours();
  const mins = moment.duration(seconds, 'seconds').minutes();
  const secs = moment.duration(seconds, 'seconds').seconds();

  if (hours !== 0) formats.push(`${parseInt(hours)} часов`);
  if (mins !== 0) formats.push(`${parseInt(mins)} минут`);
  if (secs !== 0) formats.push(`${parseInt(secs)} секунд`);

  return `_${formats.join(' ')}_`;
};
