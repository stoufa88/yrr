import {
  filterByDate,
  filterVideoByQuality,
  filterVideoByTitle,
} from "./helpers";

function getSubscriptions(pageToken?: string) {
  const ytClient = gapi.client.youtube;

  return ytClient.subscriptions.list({
    part: ["snippet,contentDetails"],
    mine: true,
    maxResults: 50,
    pageToken,
  });
}

function getChannels(channelIds: string) {
  const ytClient = gapi.client.youtube;

  return ytClient.channels.list({
    part: "snippet,contentDetails",
    id: channelIds,
  });
}

function getPlaylistItems(playlistId: string) {
  const ytClient = gapi.client.youtube;

  return ytClient.playlistItems.list({
    part: "snippet",
    maxResults: 5,
    playlistId,
  });
}

function getVideosByIds(ids: string) {
  const ytClient = gapi.client.youtube;

  return ytClient.videos.list({
    id: ids,
    part: "statistics,snippet,contentDetails",
  });
}

async function getSubscriptionVideos(playlistId: string, config: Config) {
  const playlistItems = await getPlaylistItems(playlistId);

  if (!playlistItems?.result?.items) {
    return [];
  }

  const ids = playlistItems.result.items
    .filter((item: any) =>
      filterByDate(item.snippet.publishedAt, config.daysAgo)
    )
    .map((item: any) => item.snippet.resourceId.videoId)
    .join(",");

  const videos = await getVideosByIds(ids);

  if (!videos?.result?.items) {
    return [];
  }

  return videos.result.items.filter(
    (item: any) =>
      item.snippet.categoryId === "10" &&
      filterVideoByQuality(item, config.minLikes, config.minViews) &&
      filterVideoByTitle(item.snippet.title)
  );
}

export default function parse(cb: any, config: Config) {
  const tracks: any = [];

  async function execute(pageToken?: string) {
    console.log("getting subscriptions...", pageToken);
    const subscriptions = await getSubscriptions(pageToken);

    if (!subscriptions?.result?.items) {
      return;
    } else {
      console.log("done!");
    }

    console.log("getting subscription channels...");
    const channels = await getChannels(
      subscriptions.result.items
        .map((i: any) => i.snippet.resourceId.channelId)
        .join(",")
    );

    if (!channels?.result?.items) {
      return;
    } else {
      console.log("done!");
    }

    console.log("getting uploads");
    await Promise.all(
      channels.result.items.map(async (channel: any) => {
        try {
          const results = await getSubscriptionVideos(
            channel.contentDetails.relatedPlaylists.uploads,
            config
          );

          if (results.length > 0) {
            tracks.push(...results);
          }
        } catch (e) {
          console.error(e);
        }
      })
    );

    // Repeat until we finish all liked playlists
    if (subscriptions.result.nextPageToken) {
      await execute(subscriptions.result.nextPageToken);
    } else {
      cb(tracks);
      console.log("Done!");
    }
  }

  execute();
}
