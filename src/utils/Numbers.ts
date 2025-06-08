export const formatKMGT = (value: number): string => {
  if (value < 1000) {
    return value.toString();
  } else if (value < 1000000) {
    return (value / 1000).toFixed(1) + "K";
  } else if (value < 1000000000) {
    return (value / 1000000).toFixed(1) + "M";
  } else if (value < 1000000000000) {
    return (value / 1000000000).toFixed(1) + "G";
  } else {
    return (value / 1000000000000).toFixed(1) + "T";
  }
};

export const formatKMBTQ = (value: number): string => {
  if (value < 1000) {
    return value.toString();
  } else if (value < 1000000) {
    return (value / 1000).toFixed(1) + "K";
  } else if (value < 1000000000) {
    return (value / 1000000).toFixed(1) + "M";
  } else if (value < 1000000000000) {
    return (value / 1000000000).toFixed(1) + "B";
  } else if (value < 1000000000000000) {
    return (value / 1000000000000).toFixed(1) + "T";
  } else {
    return (value / 1000000000000000).toFixed(1) + "Q";
  }
};
