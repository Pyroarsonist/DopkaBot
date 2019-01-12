import moment from 'moment';

export default seconds => {
  const hours = moment.duration(seconds, 'seconds').asHours();
  const hoursFormat = hours === 0 ? '' : `${parseInt(hours)} часов `;

  const mins = moment.duration(seconds, 'seconds').minutes();
  const minsFormat = mins === 0 ? '' : `${parseInt(mins)} минут `;

  const secs = moment.duration(seconds, 'seconds').seconds();
  const secsFormat = secs === 0 ? '' : `${parseInt(secs)} секунд `;
  return `${hoursFormat}${minsFormat}${secsFormat}`;
};
