export const timezoneChangeToKR = function (UnchangedDate) {
  const timezoneOffset = new Date().getTimezoneOffset() * 60000;
  const changedDate = new Date(UnchangedDate.getTime() - timezoneOffset);
  return changedDate;
};
