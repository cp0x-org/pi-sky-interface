export const formatUSDS = (value: string | number) => {
  return `${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const formatSkyPrice = (value: string | number | undefined) => {
  if (!value) value = 0;
  return `${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  })}`;
};
