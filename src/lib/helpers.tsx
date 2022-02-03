export function filterByDate(d: string, diff = 8) {
  var date = new Date(d);
  var timeDiff = Math.abs(Date.now() - date.getTime());
  var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return diffDays < diff;
}

export function filterVideoByTitle(title: string) {
  const lowerCaseTitle = title.toLowerCase();
  if (
    lowerCaseTitle.indexOf("live") > -1 ||
    lowerCaseTitle.indexOf("freestyle") > -1 ||
    lowerCaseTitle.indexOf("snippet") > -1 ||
    lowerCaseTitle.indexOf("demo") > -1 ||
    lowerCaseTitle.indexOf("acoustic") > -1 ||
    lowerCaseTitle.indexOf("recap") > -1 ||
    lowerCaseTitle.indexOf("tutorial") > -1 ||
    lowerCaseTitle.indexOf("lyrics") > -1 ||
    lowerCaseTitle.indexOf("reacts") > -1 ||
    lowerCaseTitle.indexOf("teaser") > -1 ||
    lowerCaseTitle.indexOf("vlog") > -1 ||
    lowerCaseTitle.indexOf("preview") > -1
  ) {
    return false;
  }

  return true;
}

export function filterVideoByQuality(
  video: any,
  minLikes: number,
  minViews: number
) {
  const likeCount = Number(video.statistics.likeCount);
  const viewCount = Number(video.statistics.viewCount);

  // Skip video if it is longer than 11 minutes or lower than 2 minute
  const duration = convertDuration(video.contentDetails.duration);
  if (duration > 11 * 60 || duration < 120) {
    return false;
  }

  if (likeCount < minLikes || viewCount < minViews) {
    return false;
  }

  return true;
}

function convertDuration(d: string): number {
  let a = d.match(/\d+/g);
  if (!a) {
    return 0;
  }

  let duration = 0;

  if (a.length === 3) {
    duration = duration + parseInt(a[0]) * 3600;
    duration = duration + parseInt(a[1]) * 60;
    duration = duration + parseInt(a[2]);
  }

  if (a.length === 2) {
    duration = duration + parseInt(a[0]) * 60;
    duration = duration + parseInt(a[1]);
  }

  if (a.length === 1) {
    duration = duration + parseInt(a[0]);
  }

  return duration;
}
