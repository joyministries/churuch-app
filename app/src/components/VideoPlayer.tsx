import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../lib/theme';
import { youtubePlayerHtml } from '../lib/media';

const { palette, radius } = theme;

interface VideoPlayerProps {
  videoId: string;
  /** Extra rounded corners for the card treatment. */
  rounded?: number;
}

/**
 * In-app YouTube player. The iframe is served from youtube-nocookie and the
 * WebView is transparent to the card, so the video reads as part of the screen
 * rather than a browser window.
 */
export function VideoPlayer({ videoId, rounded = radius.lg }: VideoPlayerProps) {
  const [ready, setReady] = useState(false);

  return (
    <View style={[styles.wrap, { borderRadius: rounded }]}>
      <WebView
        key={videoId}
        source={{ html: youtubePlayerHtml(videoId) }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        scrollEnabled={false}
        style={styles.web}
        containerStyle={styles.web}
        onLoadEnd={() => setReady(true)}
      />
      {!ready && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color={palette.brandBlue} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: palette.video,
    overflow: 'hidden',
  },
  web: { flex: 1, backgroundColor: palette.video },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.video,
  },
});

export default VideoPlayer;
