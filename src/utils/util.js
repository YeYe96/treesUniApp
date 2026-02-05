// src/utils/util.js

export const formatNumber = (n) => {
  const s = n.toString();
  return s[1] ? s : `0${s}`;
};

export const formatTime = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();
  const minute = d.getMinutes();
  const second = d.getSeconds();

  return `${[year, month, day].map(formatNumber).join('/')}`
    + ` ${[hour, minute, second].map(formatNumber).join(':')}`;
};

/**
 * 诗意时间显示 (如：三日前的午后)
 * @param {Date|string} date
 */
export const formatTimePoetic = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;

  const now = new Date();
  const diff = now - d;
  const oneDay = 24 * 60 * 60 * 1000;

  const getPeriod = (t) => {
    const h = t.getHours();
    if (h >= 0 && h < 6) return '深夜';
    if (h >= 6 && h < 9) return '清晨';
    if (h >= 9 && h < 12) return '上午';
    if (h >= 12 && h < 18) return '午后';
    if (h >= 18 && h < 21) return '傍晚';
    return '深夜';
  };

  const period = getPeriod(d);

  if (diff < oneDay && d.getDate() === now.getDate()) {
    return `今日${period}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.getDate() === yesterday.getDate()) {
    return `昨日${period}`;
  }

  const days = Math.floor(diff / oneDay);
  if (days < 4) return '两三日前';
  if (days < 8) return '数日前';
  if (days < 15) return '半月前';
  if (days < 31) return '近一月前';

  const months = Math.floor(days / 30);
  return `${months}月前`;
};

export const getWaitingText = () => {
  const texts = [
    '候鸟尚未归来',
    '墨迹尚在途中',
    '静待远方回音',
    '长信已寄，静候回音'
  ];
  const index = Math.floor(Math.random() * texts.length);
  return texts[index];
};
