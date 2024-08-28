"use client";
import Hls from "hls.js";
import { useCallback, useEffect, useRef, useState } from "react";

export function VideoEmbedClient({
  source,
  sessionId,
}: {
  source: string;
  sessionId?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const { play, pause } = useVideoUtils(ref);

  const hlsRef = useRef<Hls | undefined>(undefined);

  useEffect(() => {
    if (!ref.current) return;
    if (!Hls.isSupported()) throw new HLSUnsupportedError();

    const hls = new Hls({
      capLevelToPlayerSize: true,
      // progressive: true enables fetch, we can then customize the request in fetchSetup
      // Can't use the default xhr loader because there appears to be no way to customise the URL there
      progressive: true,
      fetchSetup(context, initParams) {
        const url = new URL(context.url);
        if (sessionId) {
          url.searchParams.set("session_id", sessionId);
        }

        return new Request(url, initParams);
      },
    });
    hlsRef.current = hls;

    hls.attachMedia(ref.current);
    hls.loadSource(source);

    // initial value, later on it's managed by Controls
    hls.autoLevelCapping = 0;

    return () => {
      hlsRef.current = undefined;
      hls.detachMedia();
      hls.destroy();
    };
  }, [source, sessionId]);

  return (
    <div
      style={{
        aspectRatio: "16 / 9",
      }}
    >
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", display: "flex" }}
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={ref}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          preload="none"
          loop
        />
        {/* <Controls
          videoRef={ref}
          hlsRef={hlsRef}
          active={active}
          setActive={setActive}
          focused={focused}
          setFocused={setFocused}
          onScreen={onScreen}
          fullscreenRef={containerRef}
          hasSubtitleTrack={hasSubtitleTrack}
        /> */}
      </div>
      <button type="button" onClick={play}>
        Play
      </button>
      <button type="button" onClick={pause}>
        Pause
      </button>
    </div>
  );
}

export class HLSUnsupportedError extends Error {
  constructor() {
    super("HLS is not supported");
  }
}

function useVideoUtils(ref: React.RefObject<HTMLVideoElement>) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const playWhenReadyRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;

    let bufferingTimeout: ReturnType<typeof setTimeout> | undefined;

    function round(num: number) {
      return Math.round(num * 100) / 100;
    }

    // Initial values
    setCurrentTime(round(ref.current.currentTime) || 0);
    setDuration(round(ref.current.duration) || 0);
    setMuted(ref.current.muted);
    setPlaying(!ref.current.paused);

    const handleTimeUpdate = () => {
      if (!ref.current) return;
      setCurrentTime(round(ref.current.currentTime) || 0);
    };

    const handleDurationChange = () => {
      if (!ref.current) return;
      setDuration(round(ref.current.duration) || 0);
    };

    const handlePlay = () => {
      setPlaying(true);
    };

    const handlePause = () => {
      setPlaying(false);
    };

    const handleVolumeChange = () => {
      if (!ref.current) return;
      setMuted(ref.current.muted);
    };

    const handleError = () => {
      setError(true);
    };

    const handleCanPlay = () => {
      setBuffering(false);
      setCanPlay(true);

      if (!ref.current) return;
      if (playWhenReadyRef.current) {
        ref.current.play();
        playWhenReadyRef.current = false;
      }
    };

    const handleCanPlayThrough = () => {
      setBuffering(false);
    };

    const handleWaiting = () => {
      if (bufferingTimeout) clearTimeout(bufferingTimeout);
      bufferingTimeout = setTimeout(() => {
        setBuffering(true);
      }, 200); // Delay to avoid frequent buffering state changes
    };

    const handlePlaying = () => {
      if (bufferingTimeout) clearTimeout(bufferingTimeout);
      setBuffering(false);
      setError(false);
    };

    const handleStalled = () => {
      if (bufferingTimeout) clearTimeout(bufferingTimeout);
      bufferingTimeout = setTimeout(() => {
        setBuffering(true);
      }, 200); // Delay to avoid frequent buffering state changes
    };

    const handleEnded = () => {
      setPlaying(false);
      setBuffering(false);
      setError(false);
    };

    const abortController = new AbortController();

    ref.current.addEventListener("timeupdate", handleTimeUpdate, {
      signal: abortController.signal,
    });
    ref.current.addEventListener("durationchange", handleDurationChange, {
      signal: abortController.signal,
    });
    ref.current.addEventListener("play", handlePlay, {
      signal: abortController.signal,
    });
    ref.current.addEventListener("pause", handlePause, {
      signal: abortController.signal,
    });
    ref.current.addEventListener("volumechange", handleVolumeChange, {
      signal: abortController.signal,
    });
    ref.current.addEventListener("error", handleError, {
      signal: abortController.signal,
    });
    ref.current.addEventListener("canplay", handleCanPlay, {
      signal: abortController.signal,
    });
    ref.current.addEventListener("canplaythrough", handleCanPlayThrough, {
      signal: abortController.signal,
    });
    ref.current.addEventListener("waiting", handleWaiting, {
      signal: abortController.signal,
    });
    ref.current.addEventListener("playing", handlePlaying, {
      signal: abortController.signal,
    });
    ref.current.addEventListener("stalled", handleStalled, {
      signal: abortController.signal,
    });
    ref.current.addEventListener("ended", handleEnded, {
      signal: abortController.signal,
    });

    return () => {
      abortController.abort();
      clearTimeout(bufferingTimeout);
    };
  }, [ref]);

  const play = useCallback(() => {
    if (!ref.current) return;

    if (ref.current.ended) {
      // eslint-disable-next-line react-compiler/react-compiler
      ref.current.currentTime = 0;
    }

    if (ref.current.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      playWhenReadyRef.current = true;
    } else {
      const promise = ref.current.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.error("Error playing video:", err);
        });
      }
    }
  }, [ref]);

  const pause = useCallback(() => {
    if (!ref.current) return;

    ref.current.pause();
    playWhenReadyRef.current = false;
  }, [ref]);

  const togglePlayPause = useCallback(() => {
    if (!ref.current) return;

    if (ref.current.paused) {
      play();
    } else {
      pause();
    }
  }, [ref, play, pause]);

  const mute = useCallback(() => {
    if (!ref.current) return;

    ref.current.muted = true;
  }, [ref]);

  const unmute = useCallback(() => {
    if (!ref.current) return;

    ref.current.muted = false;
  }, [ref]);

  const toggleMute = useCallback(() => {
    if (!ref.current) return;

    ref.current.muted = !ref.current.muted;
  }, [ref]);

  return {
    play,
    pause,
    togglePlayPause,
    duration,
    currentTime,
    playing,
    muted,
    mute,
    unmute,
    toggleMute,
    buffering,
    error,
    canPlay,
  };
}
