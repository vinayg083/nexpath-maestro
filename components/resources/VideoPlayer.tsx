import { useEvent, useEventListener } from "expo";
import { VideoView, useVideoPlayer } from "expo-video";
import * as React from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import YoutubePlayer, { PLAYER_STATES } from "react-native-youtube-iframe";
import { Text } from "@/components/ui/text";
import { colors } from "@/lib/design-tokens";
import LucideIcon from "@/lib/icons/LucideIcon";

type VideoProvider = "direct" | "youtube" | "unavailable";
type YouTubeLifecycle = "loading" | "ready" | "error";

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const END_OF_VIDEO_EPSILON_SECONDS = 0.35;
const SCRUBBER_THUMB_SIZE = 14;
// The row is kept short so the caption above it can sit close; hitSlop restores the
// 44pt drag target that the layout height no longer provides.
const SCRUBBER_HIT_HEIGHT = 28;
const SCRUBBER_HIT_SLOP = { bottom: 8, left: 0, right: 0, top: 8 };
const SEEK_SETTLE_SECONDS = 0.6;
const ACCESSIBILITY_SEEK_STEP_SECONDS = 10;

export function detectVideoProvider(videoUrl: string | null | undefined): VideoProvider {
  if (!videoUrl?.trim()) {
    return "unavailable";
  }

  if (isYouTubeUrl(videoUrl)) {
    return "youtube";
  }

  return "direct";
}

export function VideoPlayer({
  caption,
  isActive = true,
  video_url,
}: {
  /** Rendered directly above the control bar, 16px clear of it. */
  caption?: React.ReactNode;
  video_url: string | null | undefined;
  isActive?: boolean;
}) {
  const provider = detectVideoProvider(video_url);

  if (provider === "unavailable") {
    return (
      <PlayerStateOverlay
        icon="CircleAlert"
        message="This video does not have a playable URL yet."
        title="Video unavailable"
      />
    );
  }

  if (provider === "youtube") {
    return <YouTubeVideoPlayer isActive={isActive} videoUrl={video_url ?? ""} />;
  }

  return <DirectVideoPlayer caption={caption} isActive={isActive} videoUrl={video_url ?? ""} />;
}

function DirectVideoPlayer({
  caption,
  isActive,
  videoUrl,
}: {
  caption?: React.ReactNode;
  isActive: boolean;
  videoUrl: string;
}) {
  const [retryKey, setRetryKey] = React.useState(0);
  const [shouldPlay, setShouldPlay] = React.useState(true);
  const player = useVideoPlayer(videoUrl, (nextPlayer) => {
    nextPlayer.loop = false;
    nextPlayer.muted = Platform.OS === "web";
    nextPlayer.timeUpdateEventInterval = 0.25;
    nextPlayer.play();
  });
  const [isMuted, setIsMuted] = React.useState(() => player.muted);
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });
  const statusEvent = useEvent(player, "statusChange", {
    status: player.status,
    error: undefined,
  });
  const timeUpdateEvent = useEvent(player, "timeUpdate", {
    bufferedPosition: 0,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    currentTime: player.currentTime,
  });
  // A seek keeps the reported time stale until playback catches up (and forever while
  // paused, since timeUpdate only ticks during playback), so the requested position is
  // what the controls show until the player reports it.
  const [seekTargetTime, setSeekTargetTime] = React.useState<number | null>(null);
  // timeUpdate stops at the last tick before the end (e.g. 3.75s of 4s), so the bar would
  // rest just short of the end without this.
  const [hasPlayedToEnd, setHasPlayedToEnd] = React.useState(false);
  const status = statusEvent?.status ?? player.status;
  const error = statusEvent?.error;
  const isLoading = status === "idle" || status === "loading";
  const reportedTime = timeUpdateEvent?.currentTime ?? player.currentTime;
  const duration = Number.isFinite(player.duration) ? Math.max(player.duration, 0) : 0;
  const currentTime = hasPlayedToEnd ? duration : (seekTargetTime ?? reportedTime);
  const errorMessage =
    status === "error"
      ? error?.message || "We couldn't play this video. Check the URL and try again."
      : "";

  // When playback finishes, clear shouldPlay so the next tap means "replay"
  // instead of incorrectly toggling into a paused state.
  useEventListener(player, "playToEnd", () => {
    setShouldPlay(false);
    setHasPlayedToEnd(true);
  });

  React.useEffect(() => {
    if (!isActive || !shouldPlay) {
      pausePlayer(player);
      return;
    }

    if (status !== "error") {
      startDirectPlayback(player);
    }
  }, [isActive, player, shouldPlay, status]);

  React.useEffect(() => {
    if (seekTargetTime !== null && Math.abs(reportedTime - seekTargetTime) < SEEK_SETTLE_SECONDS) {
      setSeekTargetTime(null);
    }
  }, [reportedTime, seekTargetTime]);

  React.useEffect(() => {
    return () => {
      pausePlayer(player);
    };
  }, [player]);

  async function handleRetry() {
    try {
      setRetryKey((current) => current + 1);
      await player.replaceAsync({ uri: videoUrl });
      player.currentTime = 0;

      if (isActive) {
        setShouldPlay(true);
        player.play();
      }
    } catch {
      // statusChange surfaces the user-visible error state.
    }
  }

  function handleTogglePlayback() {
    if (isPlaying && shouldPlay) {
      setShouldPlay(false);
      return;
    }

    setShouldPlay(true);
    setHasPlayedToEnd(false);
    startDirectPlayback(player);
  }

  function handleSeek(time: number) {
    const targetTime = Math.min(Math.max(time, 0), duration > 0 ? duration : time);

    try {
      player.currentTime = targetTime;
      setSeekTargetTime(targetTime);
      setHasPlayedToEnd(false);
    } catch {
      // The native player can already be released during route transitions.
    }
  }

  function handleToggleMute() {
    try {
      const nextMuted = !player.muted;
      player.muted = nextMuted;
      setIsMuted(nextMuted);
    } catch {
      // The native player can already be released during route transitions.
    }
  }

  return (
    <View style={styles.fill}>
      <VideoView
        key={retryKey}
        contentFit="cover"
        fullscreenOptions={{ enable: false }}
        nativeControls={false}
        player={player}
        playsInline
        style={StyleSheet.absoluteFill}
      />

      <TapPlaybackOverlay
        isPlaying={isPlaying && isActive && shouldPlay}
        onToggle={handleTogglePlayback}
      />

      {status === "error" ? null : (
        <VideoControls
          caption={caption}
          currentTime={currentTime}
          duration={duration}
          isMuted={isMuted}
          isPlaying={isPlaying && isActive && shouldPlay}
          onSeek={handleSeek}
          onToggleMute={handleToggleMute}
          onTogglePlayback={handleTogglePlayback}
        />
      )}

      {isLoading ? <LoadingOverlay label="Loading video" /> : null}
      {errorMessage ? (
        <PlayerStateOverlay
          actionLabel="Retry"
          icon="CircleAlert"
          message={errorMessage}
          onAction={handleRetry}
          title="Video playback failed"
        />
      ) : null}
    </View>
  );
}

function YouTubeVideoPlayer({ isActive, videoUrl }: { isActive: boolean; videoUrl: string }) {
  const windowDimensions = useWindowDimensions();
  const [lifecycle, setLifecycle] = React.useState<YouTubeLifecycle>("loading");
  const [retryKey, setRetryKey] = React.useState(0);
  const [shouldPlay, setShouldPlay] = React.useState(true);
  const [frameSize, setFrameSize] = React.useState({
    height: Math.max(windowDimensions.height, 220),
    width: Math.max(windowDimensions.width, 320),
  });
  const videoId = getYouTubeVideoId(videoUrl);

  // Web constraint: the player is a cross-origin iframe (react-native-web-webview posts
  // commands without a targetOrigin, so the browser drops them, and the iframe has no
  // autoplay permission). On web, playback can ONLY start from the user's tap on
  // YouTube's own controls, and can only be stopped by unmounting the iframe. Never put
  // a touch-intercepting overlay above this player — it makes playback unstartable.
  const isWebPlatform = Platform.OS === "web";
  // Unmount whenever this page is inactive. pauseVideo via the play prop is
  // unreliable (and on web impossible for the cross-origin iframe), so tearing
  // down the player is the only sure way to stop audio when the user scrolls past.
  const shouldMountPlayer = isActive;
  // Keep YouTube at a normal contained 16:9 size (full frame width), letterboxed
  // on the black page — do not scale it to cover/full-screen.
  const playerWidth = Math.max(frameSize.width, 320);
  const playerHeight = Math.max(220, playerWidth * (9 / 16));

  React.useEffect(() => {
    if (isActive) {
      setShouldPlay(!isWebPlatform);
      return;
    }

    setShouldPlay(false);
  }, [isActive, isWebPlatform]);

  React.useEffect(() => {
    if (!shouldMountPlayer) {
      setLifecycle("loading");
    }
  }, [shouldMountPlayer]);

  function handleRetry() {
    setLifecycle("loading");
    setShouldPlay(!isWebPlatform);
    setRetryKey((current) => current + 1);
  }

  if (!videoId) {
    return (
      <PlayerStateOverlay
        icon="CircleAlert"
        message="This YouTube URL is missing a video id."
        title="Video unavailable"
      />
    );
  }

  return (
    <View
      onLayout={(event) => {
        const { height, width } = event.nativeEvent.layout;
        if (height <= 0 || width <= 0) {
          return;
        }

        setFrameSize((current) =>
          current.height === height && current.width === width
            ? current
            : { height, width },
        );
      }}
      style={styles.fill}
    >
      {shouldMountPlayer ? (
        <View style={styles.youtubeFrame}>
          <YoutubePlayer
            key={`${videoId}-${retryKey}`}
            forceAndroidAutoplay
            height={playerHeight}
            initialPlayerParams={{
              controls: true,
              iv_load_policy: 3,
              preventFullScreen: false,
              rel: false,
            }}
            onChangeState={(state: PLAYER_STATES) => {
              // Mirror the player's real state so the play prop never fights taps made
              // directly on YouTube's controls.
              if (state === PLAYER_STATES.PLAYING) {
                setShouldPlay(true);
              } else if (state === PLAYER_STATES.PAUSED || state === PLAYER_STATES.ENDED) {
                setShouldPlay(false);
              }
            }}
            onError={() => setLifecycle("error")}
            onReady={() => setLifecycle("ready")}
            play={!isWebPlatform && isActive && shouldPlay}
            videoId={videoId}
            webViewProps={{
              allowsFullscreenVideo: true,
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
            }}
            webViewStyle={styles.youtubeWebView}
            width={playerWidth}
          />
        </View>
      ) : null}

      {shouldMountPlayer && lifecycle === "loading" ? (
        <LoadingOverlay label="Loading video" />
      ) : null}
      {lifecycle === "error" ? (
        <PlayerStateOverlay
          actionLabel="Retry"
          icon="CircleAlert"
          message="We couldn't load this YouTube video. Check the URL and try again."
          onAction={handleRetry}
          title="YouTube playback failed"
        />
      ) : null}
    </View>
  );
}

function VideoControls({
  caption,
  currentTime,
  duration,
  isMuted,
  isPlaying,
  onSeek,
  onToggleMute,
  onTogglePlayback,
}: {
  caption?: React.ReactNode;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onToggleMute: () => void;
  onTogglePlayback: () => void;
}) {
  return (
    // Bottom edge only — the player is full-bleed, so the top/sides must not be inset.
    <SafeAreaView className="pb-3" edges={["bottom"]} pointerEvents="box-none" style={styles.controlBar}>
      {/* mb-4 is the only thing setting the caption/control gap — 16px on every device. */}
      {caption ? (
        <View className="mb-4" pointerEvents="box-none">
          {caption}
        </View>
      ) : null}

      <View className="flex-row items-center gap-2 px-4" pointerEvents="box-none">
        <Pressable
          accessibilityLabel={isPlaying ? "Pause video" : "Play video"}
          accessibilityRole="button"
          className="active:opacity-75"
          onPress={onTogglePlayback}
          style={styles.controlButton}>
          <LucideIcon
            color={colors.primaryForeground}
            fill={colors.primaryForeground}
            name={isPlaying ? "Pause" : "Play"}
            size={17}
          />
        </Pressable>

        <VideoScrubber currentTime={currentTime} duration={duration} onSeek={onSeek} />

        <Pressable
          accessibilityLabel={isMuted ? "Unmute video" : "Mute video"}
          accessibilityRole="button"
          className="active:opacity-75"
          onPress={onToggleMute}
          style={styles.controlButton}>
          <LucideIcon
            color={colors.primaryForeground}
            name={isMuted ? "VolumeX" : "Volume2"}
            size={17}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function VideoScrubber({
  currentTime,
  duration,
  onSeek,
}: {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}) {
  const [trackWidth, setTrackWidth] = React.useState(0);
  const [dragTime, setDragTime] = React.useState<number | null>(null);
  const durationRef = React.useRef(duration);
  const trackWidthRef = React.useRef(0);
  const trackOriginRef = React.useRef(0);
  const onSeekRef = React.useRef(onSeek);

  durationRef.current = duration;
  trackWidthRef.current = trackWidth;
  onSeekRef.current = onSeek;

  const panResponder = React.useMemo(() => {
    function timeAtPageX(pageX: number) {
      if (trackWidthRef.current <= 0 || durationRef.current <= 0) {
        return 0;
      }

      const ratio = (pageX - trackOriginRef.current) / trackWidthRef.current;

      return Math.min(Math.max(ratio, 0), 1) * durationRef.current;
    }

    function commitSeek(pageX: number) {
      const time = timeAtPageX(pageX);
      setDragTime(null);
      onSeekRef.current(time);
    }

    return PanResponder.create({
      onStartShouldSetPanResponder: () => durationRef.current > 0,
      onMoveShouldSetPanResponder: () => durationRef.current > 0,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event, gestureState) => {
        // locationX is only reliable on grant, so anchor the track's page origin here
        // and drive every later move from absolute page coordinates.
        trackOriginRef.current = gestureState.x0 - event.nativeEvent.locationX;
        setDragTime(timeAtPageX(gestureState.x0));
      },
      onPanResponderMove: (_event, gestureState) => {
        setDragTime(timeAtPageX(gestureState.moveX));
      },
      onPanResponderRelease: (_event, gestureState) => {
        commitSeek(gestureState.moveX || gestureState.x0);
      },
      onPanResponderTerminate: (_event, gestureState) => {
        commitSeek(gestureState.moveX || gestureState.x0);
      },
    });
  }, []);

  const displayTime = dragTime ?? currentTime;
  const progress = duration > 0 ? Math.min(Math.max(displayTime / duration, 0), 1) : 0;
  // Keep the thumb inside the track so it never collides with the time labels beside it.
  const thumbOffset = Math.min(
    Math.max(progress * trackWidth - SCRUBBER_THUMB_SIZE / 2, 0),
    Math.max(trackWidth - SCRUBBER_THUMB_SIZE, 0),
  );

  return (
    <View className="min-w-0 flex-1 flex-row items-center gap-2">
      <Text className="text-xs font-medium text-white">
        {formatPlaybackTime(displayTime)}
      </Text>

      <View
        accessibilityActions={[{ name: "decrement" }, { name: "increment" }]}
        accessibilityLabel="Video progress"
        accessibilityRole="adjustable"
        accessibilityValue={{
          max: Math.round(duration),
          min: 0,
          now: Math.round(displayTime),
        }}
        onAccessibilityAction={(event) => {
          if (duration <= 0) {
            return;
          }

          const step =
            event.nativeEvent.actionName === "increment"
              ? ACCESSIBILITY_SEEK_STEP_SECONDS
              : -ACCESSIBILITY_SEEK_STEP_SECONDS;

          onSeek(Math.min(Math.max(displayTime + step, 0), duration));
        }}
        hitSlop={SCRUBBER_HIT_SLOP}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        style={styles.scrubberHitArea}
        {...panResponder.panHandlers}>
        <View style={styles.scrubberTrack}>
          <View style={[styles.scrubberFill, { width: `${progress * 100}%` }]} />
        </View>
        <View
          pointerEvents="none"
          style={[styles.scrubberThumb, { left: thumbOffset }]}
        />
      </View>

      <Text className="text-xs font-medium text-white">
        {formatPlaybackTime(duration)}
      </Text>
    </View>
  );
}

function formatPlaybackTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  const paddedSeconds = String(remainingSeconds).padStart(2, "0");

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`
    : `${minutes}:${paddedSeconds}`;
}

function TapPlaybackOverlay({ isPlaying, onToggle }: { isPlaying: boolean; onToggle: () => void }) {
  const opacity = React.useRef(new Animated.Value(isPlaying ? 0 : 1)).current;
  const hideTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }

    Animated.timing(opacity, {
      duration: isPlaying ? 180 : 120,
      toValue: 1,
      useNativeDriver: true,
    }).start(() => {
      if (!isPlaying) {
        return;
      }

      hideTimeout.current = setTimeout(() => {
        Animated.timing(opacity, {
          duration: 320,
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }, 360);
    });

    return () => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
    };
  }, [isPlaying, opacity]);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Pressable
        accessibilityLabel={isPlaying ? "Pause video" : "Play video"}
        accessibilityRole="button"
        onPress={onToggle}
        style={styles.centerTapTarget}
      >
        <View className="flex-1 items-center justify-center" pointerEvents="none">
          <Animated.View style={[styles.centerPlayOverlay, { opacity }]}>
            <LucideIcon color={colors.foreground} name="Play" size={42} fill={colors.foreground} />
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}

function isYouTubeUrl(url: string | null | undefined) {
  if (!url) {
    return false;
  }

  if (YOUTUBE_VIDEO_ID_PATTERN.test(url.trim())) {
    return true;
  }

  try {
    const parsedUrl = parsePotentialUrl(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();

    return (
      hostname === "youtu.be" ||
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com" ||
      hostname.endsWith(".youtube-nocookie.com")
    );
  } catch {
    return false;
  }
}

function pausePlayer(player: ReturnType<typeof useVideoPlayer>) {
  try {
    player.pause();
  } catch {
    // The native player can already be released during route transitions.
  }
}

function isDirectPlayerAtEnd(player: ReturnType<typeof useVideoPlayer>) {
  const duration = player.duration;

  return (
    Number.isFinite(duration) &&
    duration > 0 &&
    player.currentTime >= Math.max(0, duration - END_OF_VIDEO_EPSILON_SECONDS)
  );
}

function startDirectPlayback(player: ReturnType<typeof useVideoPlayer>) {
  try {
    if (isDirectPlayerAtEnd(player)) {
      player.replay();
      return;
    }

    player.play();
  } catch {
    // The native player can already be released during route transitions.
  }
}

function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    const trimmedUrl = url.trim();

    if (YOUTUBE_VIDEO_ID_PATTERN.test(trimmedUrl)) {
      return trimmedUrl;
    }

    const parsedUrl = parsePotentialUrl(trimmedUrl);
    const hostname = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();

    if (hostname === "youtu.be") {
      return normalizeYouTubeVideoId(parsedUrl.pathname.split("/").filter(Boolean)[0]);
    }

    if (
      hostname !== "youtube.com" &&
      !hostname.endsWith(".youtube.com") &&
      hostname !== "youtube-nocookie.com" &&
      !hostname.endsWith(".youtube-nocookie.com")
    ) {
      return null;
    }

    const nestedWatchUrl = parsedUrl.searchParams.get("u") ?? parsedUrl.searchParams.get("url");
    const nestedVideoId: string | null = nestedWatchUrl
      ? getYouTubeVideoId(normalizeNestedYouTubeUrl(nestedWatchUrl))
      : null;

    return (
      normalizeYouTubeVideoId(parsedUrl.searchParams.get("v")) ??
      normalizeYouTubeVideoId(
        parsedUrl.pathname.match(/\/(?:embed|shorts|live|v|e)\/([^/?]+)/)?.[1],
      ) ??
      nestedVideoId
    );
  } catch {
    return null;
  }
}

function parsePotentialUrl(url: string): URL {
  const trimmedUrl = url.trim();
  return new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`);
}

function normalizeNestedYouTubeUrl(url: string): string {
  return url.startsWith("/") ? `https://youtube.com${url}` : url;
}

function normalizeYouTubeVideoId(videoId: string | null | undefined): string | null {
  const normalizedVideoId = videoId?.trim().match(/[A-Za-z0-9_-]{11}/)?.[0] ?? null;
  return normalizedVideoId && YOUTUBE_VIDEO_ID_PATTERN.test(normalizedVideoId)
    ? normalizedVideoId
    : null;
}

function LoadingOverlay({ label }: { label: string }) {
  return (
    <View
      className="items-center justify-center"
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      <ActivityIndicator color={colors.primaryForeground} size="large" />
      <Text className="mt-3 text-sm font-medium text-white">{label}</Text>
    </View>
  );
}

function PlayerStateOverlay({
  actionLabel,
  icon,
  message,
  onAction,
  title,
}: {
  actionLabel?: string;
  icon: React.ComponentProps<typeof LucideIcon>["name"];
  message: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <View className="items-center justify-center px-6" style={StyleSheet.absoluteFill}>
      <View style={styles.statePanel}>
        <LucideIcon color={colors.primaryForeground} name={icon} size={34} />
        <Text className="mt-4 text-center text-xl font-bold text-white">{title}</Text>
        <Text className="mt-3 text-center text-sm leading-6 text-white/80">{message}</Text>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityLabel={actionLabel}
            accessibilityRole="button"
            className="mt-5 rounded-md px-5 py-3 active:opacity-75"
            onPress={onAction}
            style={styles.retryButton}
          >
            <Text className="text-sm font-semibold text-foreground">{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  centerPlayOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 999,
    height: 92,
    justifyContent: "center",
    width: 92,
  },
  controlBar: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
  controlButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  scrubberHitArea: {
    flex: 1,
    height: SCRUBBER_HIT_HEIGHT,
    justifyContent: "center",
  },
  scrubberTrack: {
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderRadius: 999,
    height: 4,
    overflow: "hidden",
  },
  scrubberFill: {
    backgroundColor: colors.primaryForeground,
    height: 4,
  },
  scrubberThumb: {
    backgroundColor: colors.primaryForeground,
    borderRadius: 999,
    height: SCRUBBER_THUMB_SIZE,
    position: "absolute",
    width: SCRUBBER_THUMB_SIZE,
  },
  centerTapTarget: {
    bottom: "18%",
    left: 0,
    position: "absolute",
    right: 0,
    top: "18%",
  },
  retryButton: {
    backgroundColor: colors.primaryForeground,
  },
  statePanel: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.62)",
    borderRadius: 8,
    maxWidth: 340,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  youtubeFrame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: colors.overlay,
    justifyContent: "center",
  },
  youtubeWebView: {
    backgroundColor: colors.overlay,
  },
});
