type FunctionVoid = () => {}
type RefreshFn = FunctionVoid

const describe = (milliseconds: number, refresh?: RefreshFn): string => {
  const seconds = Math.round(milliseconds / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);

  if (seconds < 60) {
    if (refresh) {
      setTimeout(refresh, 1000);
    }
    return 'just now';
  } else if (minutes < 60) {
    if (refresh) {
      setTimeout(refresh, 1000 * 60);
    }
    return `${minutes} min ago`;
  } else if (hours < 24) {
    if (refresh) {
      setTimeout(refresh, 1000 * 60 * 60);
    }
    return `${hours}h ago`;
  } else if (days < 7) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
}

export default {
  describe
}