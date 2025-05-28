export const formatUSDS = (value: string | number) => {
  return `${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6 // если хочешь до 6 знаков для крипты
  })} USDS`;
};
