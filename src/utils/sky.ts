export const formatUSDS = (value: string | number) => {
  return `${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const formatShortUSDS = (value: string | number) => {
  const num = Number(value);

  // For values under 1000, display normally
  if (num < 1000) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // For thousands (1K - 999K)
  if (num < 1000000) {
    return `${(num / 1000).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    })}K`;
  }

  // For millions (1M - 999M)
  if (num < 1000000000) {
    return `${(num / 1000000).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    })}M`;
  }

  // For billions and above
  return `${(num / 1000000000).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  })}B`;
};

export const formatSkyPrice = (value: string | number | undefined) => {
  if (!value) value = 0;
  return `${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  })}`;
};
