import { useState, useEffect, useRef } from 'react';
import type PlyrType from 'plyr';
import 'plyr/dist/plyr.css';
import Hls from 'hls.js';
import mux from 'mux-embed';

import logger from '../lib/logger';
import { getStreamBaseUrl, getImageBaseUrl } from '../lib/urlutils';
import { breakpoints } from '../style-vars';
import { HTMLVideoElementWithPlyr } from '../types';
import { useCombinedRefs } from '../util/use-combined-refs';
import { MUX_DATA_CUSTOM_DOMAIN } from '../constants';

type Props = {
  playbackId: string
  poster: string
  aspectRatio?: number;
  currentTime?: number
  onLoaded: () => void
  onError: (error: ErrorEvent) => void;
  forwardedRef: React.ForwardedRef<HTMLVideoElementWithPlyr>;
};

const PlyrPlayer: React.FC<Props> = ({ playbackId, poster, currentTime, onLoaded, onError, forwardedRef, aspectRatio }) => {
  const videoRef = useRef<HTMLVideoElementWithPlyr>(null);
  const metaRef = useCombinedRefs(forwardedRef, videoRef);
  const playerRef = useRef<PlyrType | null>(null);
  const [playerInitTime] = useState(Date.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const video = videoRef.current;
    if (!video) return;

    const src = `${getStreamBaseUrl()}/${playbackId}.m3u8`;
    let hls: Hls | null = null;
    let cancelled = false;

    const videoError = (event: ErrorEvent) => onError(event);
    video.addEventListener('error', videoError);

    const initialize = async () => {
      try {
        const { default: Plyr } = await import('plyr');
        if (cancelled) return;

        playerRef.current = new Plyr(video, {
          previewThumbnails: { enabled: true, src: `${getImageBaseUrl()}/${playbackId}/storyboard.vtt` },
          storage: { enabled: false },
          fullscreen: {
            iosNative: true
          },
          captions: { active: true, language: 'auto', update: true }
        });

        playerRef.current.on('ready', () => onLoaded());

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
        } else if (Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, function (_event, data) {
            if (data.fatal) {
              logger.error('hls.js fatal error');
              videoError(new ErrorEvent('HLS.js fatal error'));
            }
          });
        } else {
          logger.error('Browser does not support HLS playback');
        }

        if (typeof mux !== 'undefined' && process.env.NEXT_PUBLIC_MUX_ENV_KEY) {
          mux.monitor(video, {
            hlsjs: hls,
            Hls,
            beaconCollectionDomain: MUX_DATA_CUSTOM_DOMAIN,
            data: {
              env_key: process.env.NEXT_PUBLIC_MUX_ENV_KEY,
              player_name: 'Plyr',
              video_id: playbackId,
              video_title: playbackId,
              player_init_time: playerInitTime,
            },
          });
        }
      } catch (error) {
        logger.error('Unable to initialize video player');
        if (!cancelled) {
          videoError(new ErrorEvent('PLAYER_INITIALIZATION_FAILED'));
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      video.removeEventListener('error', videoError);
      if (hls) {
        hls.destroy();
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [playbackId, onLoaded, onError, playerInitTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (currentTime && video) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  return (
    <>
      <video ref={metaRef} poster={poster} controls playsInline />
      <style jsx>{`
        :global(:root) {
          --plyr-color-main: #1b1b1b;
          --plyr-range-fill-background: #ccc;
        }
        :global(.plyr) {
          max-height: 100%;
          margin: 0 auto;
          aspect-ratio: ${aspectRatio}
        }
        :global(.plyr__controls button),
        :global(.plyr__controls input) {
          cursor: pointer;
        }
        :global(.plyr:fullscreen video) {
          max-width: initial;
          max-height: initial;
          width: 100%;
          height: 100%;
        }
        video {
          display: block;
          cursor: pointer;
          max-height: 100%;
          max-width: 100%;
        }
        @media only screen and (min-width: ${breakpoints.md}px) {
          :global(.plyr.plyr--full-ui) {
            min-width: 480px;
          }
        }
        @media only screen and (max-width: ${breakpoints.md}px) {
          :global(.plyr__volume, .plyr__menu, .plyr--pip-supported [data-plyr=pip]) {
            display: none;
          }
        }
      `}
      </style>
    </>
  );
};

PlyrPlayer.displayName = 'PlyrPlayer';

export default PlyrPlayer;
