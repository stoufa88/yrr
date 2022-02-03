import { useEffect, useRef } from "react";
import { AspectRatio } from "@chakra-ui/react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady(): void;
  }
}

interface Props {
  videoId?: string | null;
}

export default function Player({ videoId }: Props) {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const tag = document.createElement("script");

    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = function () {
      playerRef.current = new window.YT.Player("player");
    };
  }, []);

  useEffect(() => {
    if (!playerRef.current || !videoId) {
      return;
    }

    playerRef.current.loadVideoById(videoId);
  }, [videoId]);

  return (
    <AspectRatio ratio={16 / 9}>
      <div id="player" />
    </AspectRatio>
  );
}
