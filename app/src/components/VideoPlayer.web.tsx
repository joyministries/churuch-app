import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';
import { youtubeEmbedUrl } from '../lib/media';

const { palette, radius } = theme;

interface VideoPlayerProps {
  videoId: string;
  rounded?: number;
}

/**
 * Web build of the player: react-native-webview has no web target, so the
 * iframe is rendered directly into the DOM tree instead.
 */
export function VideoPlayer({ videoId, rounded = radius.lg }: VideoPlayerProps) {
  const iframe = React.createElement('iframe' as any, {
    src: youtubeEmbedUrl(videoId),
    title: 'Sermon',
    allow:
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    allowFullScreen: true,
    frameBorder: 0,
    style: { border: 0, width: '100%', height: '100%', display: 'block' },
  } as any);

  return <View style={[styles.wrap, { borderRadius: rounded }]}>{iframe}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: palette.video,
    overflow: 'hidden',
  },
});

export default VideoPlayer;
