    if (BypassBR.hostIs('kick.com')) {
        BypassBR.addStyle('bypassbr-kick', `
            [class~="group/player"] [data-nosnippet] { display: none !important; }
            .bypassbr-kick-ui {
                position: absolute; z-index: 203; inset: 0; color: #fff;
                font: 600 14px/1.2 system-ui, sans-serif; pointer-events: none; opacity: 0;
                transition: opacity .18s ease;
            }
            [class~="group/player"]:hover > .bypassbr-kick-ui,
            .bypassbr-kick-ui:has(:focus-visible) { opacity: 1; }
            .bypassbr-kick-ui *, .bypassbr-kick-ui *::before, .bypassbr-kick-ui *::after { box-sizing: border-box; }
            .bypassbr-kick-bottom {
                position: absolute; right: 0; bottom: 0; left: 0; z-index: 1; display: flex;
                min-height: 58px; align-items: center; justify-content: space-between; padding: 0 18px 4px;
                background: linear-gradient(to top, rgba(0,0,0,.86), transparent); pointer-events: none;
            }
            .bypassbr-kick-group { display: flex; min-width: 0; align-items: center; gap: 8px; }
            .bypassbr-kick-btn {
                display: inline-flex; width: 44px; height: 44px; flex: 0 0 auto; align-items: center;
                justify-content: center; padding: 0; border: 0; border-radius: 5px; background: transparent;
                color: #fff; cursor: pointer; transition: color .15s ease, transform .15s ease;
            }
            .bypassbr-kick-btn:hover { color: #53fc18; transform: scale(1.04); }
            .bypassbr-kick-btn:focus-visible, .bypassbr-kick-range:focus-visible {
                outline: 2px solid #53fc18; outline-offset: 2px;
            }
            .bypassbr-kick-btn svg { display: block; width: 24px; height: 24px; }
            .bypassbr-kick-range { min-width: 0; margin: 0; appearance: none; background: transparent; cursor: pointer; }
            .bypassbr-kick-volume { width: 88px; height: 20px; }
            .bypassbr-kick-seek-wrap {
                position: absolute; right: 0; bottom: 49px; left: 0; z-index: 2; height: 18px;
                pointer-events: none;
            }
            .bypassbr-kick-seek { position: absolute; inset: 0; width: 100%; height: 18px; }
            .bypassbr-kick-seek::-webkit-slider-runnable-track {
                height: 4px; border-radius: 4px;
                background: linear-gradient(to right, #53fc18 var(--bypassbr-progress, 0%), rgba(255,255,255,.4) var(--bypassbr-progress, 0%));
            }
            .bypassbr-kick-seek::-moz-range-track {
                height: 4px; border-radius: 4px;
                background: linear-gradient(to right, #53fc18 var(--bypassbr-progress, 0%), rgba(255,255,255,.4) var(--bypassbr-progress, 0%));
            }
            .bypassbr-kick-seek::-webkit-slider-thumb {
                width: 10px; height: 10px; margin-top: -3px; appearance: none; border: 0; border-radius: 50%;
                background: #53fc18; opacity: 0; transition: opacity .15s ease;
            }
            .bypassbr-kick-seek::-moz-range-thumb {
                width: 10px; height: 10px; border: 0; border-radius: 50%; background: #53fc18; opacity: 0;
            }
            .bypassbr-kick-ui:hover .bypassbr-kick-seek::-webkit-slider-thumb,
            .bypassbr-kick-ui:hover .bypassbr-kick-seek::-moz-range-thumb { opacity: 1; }
            .bypassbr-kick-volume::-webkit-slider-runnable-track { height: 3px; border-radius: 3px; background: rgba(255,255,255,.4); }
            .bypassbr-kick-volume::-moz-range-track { height: 3px; border-radius: 3px; background: rgba(255,255,255,.4); }
            .bypassbr-kick-volume::-webkit-slider-thumb {
                width: 12px; height: 12px; margin-top: -4.5px; appearance: none; border: 0; border-radius: 50%; background: #fff;
            }
            .bypassbr-kick-volume::-moz-range-thumb { width: 12px; height: 12px; border: 0; border-radius: 50%; background: #fff; }
            .bypassbr-kick-time { min-width: 88px; padding: 0 2px; color: #fff; font-size: 14px; font-variant-numeric: tabular-nums; text-align: center; white-space: nowrap; }
            [class~="group/player"]:hover > .bypassbr-kick-ui .bypassbr-kick-bottom,
            [class~="group/player"]:hover > .bypassbr-kick-ui .bypassbr-kick-seek-wrap,
            .bypassbr-kick-ui:has(:focus-visible) .bypassbr-kick-bottom,
            .bypassbr-kick-ui:has(:focus-visible) .bypassbr-kick-seek-wrap { pointer-events: auto; }
            @media (max-width: 480px) {
                .bypassbr-kick-bottom { min-height: 48px; padding: 0 6px 2px; }
                .bypassbr-kick-group { gap: 2px; }
                .bypassbr-kick-btn { width: 38px; height: 40px; }
                .bypassbr-kick-btn svg { width: 21px; height: 21px; }
                .bypassbr-kick-volume { width: 62px; }
                .bypassbr-kick-time { min-width: 76px; font-size: 12px; }
                .bypassbr-kick-seek-wrap { bottom: 41px; }
            }
            @media (hover: none) {
                .bypassbr-kick-ui { opacity: 1; }
                .bypassbr-kick-bottom, .bypassbr-kick-seek-wrap { pointer-events: auto; }
            }
            @media (prefers-reduced-motion: reduce) {
                .bypassbr-kick-ui { transition: none; }
            }
        `);

        const controlsByPlayer = new WeakMap();
        const svgNamespace = 'http://www.w3.org/2000/svg';
        const iconPaths = {
            play: [{ d: 'M6 3.5v13l10-6.5z' }],
            pause: [{ d: 'M5 3.5h4v13H5zM11 3.5h4v13h-4z' }],
            sound: [
                { d: 'M8 3 5 6H2v8h3l3 3V3z' },
                { d: 'M12 7a4 4 0 0 1 0 6', fill: 'none', stroke: 'currentColor' },
                { d: 'M14.5 4.5a7.5 7.5 0 0 1 0 11', fill: 'none', stroke: 'currentColor' },
            ],
            muted: [
                { d: 'M8 3 5 6H2v8h3l3 3V3z' },
                { d: 'm13 8 5 5m0-5-5 5', fill: 'none', stroke: 'currentColor' },
            ],
            fullscreen: [
                { d: 'M7 3H3v4m10-4h4v4m0 6v4h-4m-6 0H3v-4', fill: 'none', stroke: 'currentColor' },
            ],
        };

        const formatTime = seconds => {
            if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
            const whole = Math.floor(seconds);
            const minutes = Math.floor(whole / 60);
            const remainder = String(whole % 60).padStart(2, '0');
            return minutes >= 60
                ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${remainder}`
                : `${String(minutes).padStart(2, '0')}:${remainder}`;
        };

        const findPlayer = element => {
            for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
                if (node.classList?.contains('group/player')) return node;
            }
            return null;
        };

        const createIcon = name => {
            const svg = document.createElementNS(svgNamespace, 'svg');
            svg.setAttribute('viewBox', '0 0 20 20');
            svg.setAttribute('aria-hidden', 'true');
            iconPaths[name].forEach(shape => {
                const path = document.createElementNS(svgNamespace, 'path');
                Object.entries(shape).forEach(([key, value]) => path.setAttribute(key, value));
                if (!shape.fill && !shape.stroke) path.setAttribute('fill', 'currentColor');
                if (shape.stroke) path.setAttribute('stroke-width', '1.8');
                svg.appendChild(path);
            });
            return svg;
        };

        const createClipControls = player => {
            let video = null;
            const ui = document.createElement('div');
            ui.className = 'bypassbr-kick-ui';
            ui.setAttribute('role', 'group');
            ui.setAttribute('aria-label', 'Kick video controls');
            ui.addEventListener('click', event => event.stopPropagation());
            ui.addEventListener('pointerdown', event => event.stopPropagation());

            const seekWrap = document.createElement('div');
            seekWrap.className = 'bypassbr-kick-seek-wrap';
            const seek = document.createElement('input');
            seek.className = 'bypassbr-kick-range bypassbr-kick-seek';
            seek.type = 'range';
            seek.min = '0';
            seek.max = '1000';
            seek.value = '0';
            seek.setAttribute('aria-label', 'Current video time');
            seekWrap.appendChild(seek);

            const bottom = document.createElement('div');
            bottom.className = 'bypassbr-kick-bottom';
            const leftGroup = document.createElement('div');
            leftGroup.className = 'bypassbr-kick-group';
            const rightGroup = document.createElement('div');
            rightGroup.className = 'bypassbr-kick-group';

            const makeButton = (label, icon) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'bypassbr-kick-btn';
                button.setAttribute('aria-label', label);
                button.title = label;
                button.appendChild(createIcon(icon));
                return button;
            };

            const play = makeButton('Play video', 'play');
            const sound = makeButton('Enable sound', 'muted');
            const volume = document.createElement('input');
            volume.className = 'bypassbr-kick-range bypassbr-kick-volume';
            volume.type = 'range';
            volume.min = '0';
            volume.max = '100';
            volume.value = '60';
            volume.setAttribute('aria-label', 'Volume');

            const time = document.createElement('span');
            time.className = 'bypassbr-kick-time';
            time.textContent = '00:00 / 00:00';

            const fullscreen = makeButton('Fullscreen', 'fullscreen');
            leftGroup.append(play, sound, volume, time);
            rightGroup.appendChild(fullscreen);
            bottom.append(leftGroup, rightGroup);
            ui.append(seekWrap, bottom);

            const setIcon = (button, label, icon) => {
                button.setAttribute('aria-label', label);
                button.title = label;
                button.replaceChildren(createIcon(icon));
            };
            const syncPlay = () => {
                if (!video) return;
                const playing = !video.paused && !video.ended;
                setIcon(play, playing ? 'Pause video' : 'Play video', playing ? 'pause' : 'play');
            };
            let audioPreferenceMuted = false;
            let audioPreferenceVolume = 0.6;
            const applyAudioPreference = () => {
                if (!video) return;
                video.defaultMuted = audioPreferenceMuted;
                video.volume = audioPreferenceVolume;
                if (audioPreferenceMuted) {
                    video.muted = true;
                } else if (!video.paused) {
                    // Let Kick's muted autoplay start first, then enable audio.
                    video.muted = false;
                }
            };
            const syncSound = () => {
                if (!video) return;
                const muted = video.muted || video.volume === 0;
                setIcon(sound, muted ? 'Enable sound' : 'Mute video', muted ? 'muted' : 'sound');
                volume.value = String(Math.round(video.volume * 100));
            };
            const syncTime = () => {
                if (!video) return;
                const nextTime = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
                if (time.textContent !== nextTime) time.textContent = nextTime;
                const duration = video.duration;
                const progress = Number.isFinite(duration) && duration > 0 ? Math.min(100, video.currentTime / duration * 100) : 0;
                seek.style.setProperty('--bypassbr-progress', `${progress}%`);
                if (document.activeElement !== seek && !seek.matches(':active') && Number.isFinite(duration) && duration > 0) {
                    seek.value = String(Math.round(progress * 10));
                }
            };

            const videoEvents = {
                play: () => {
                    applyAudioPreference();
                    syncPlay();
                },
                pause: syncPlay,
                ended: syncPlay,
                volumechange: () => {
                    applyAudioPreference();
                    syncSound();
                },
                timeupdate: syncTime,
                durationchange: syncTime,
                loadedmetadata: syncTime,
            };

            const bindVideo = nextVideo => {
                if (video === nextVideo) return;
                if (video) Object.entries(videoEvents).forEach(([name, callback]) => video.removeEventListener(name, callback));
                video = nextVideo;
                if (!video) return;
                video.controls = false;
                video.playsInline = true;
                applyAudioPreference();
                Object.entries(videoEvents).forEach(([name, callback]) => video.addEventListener(name, callback));
                syncPlay();
                syncSound();
                syncTime();
            };

            play.addEventListener('click', () => {
                if (!video) return;
                if (video.paused || video.ended) {
                    const result = video.play();
                    if (result && typeof result.catch === 'function') result.catch(() => {});
                } else {
                    video.pause();
                }
            });
            sound.addEventListener('click', () => {
                if (!video) return;
                if (video.muted || video.volume === 0) {
                    if (audioPreferenceVolume === 0) audioPreferenceVolume = 0.6;
                    audioPreferenceMuted = false;
                    applyAudioPreference();
                    const result = video.play();
                    if (result && typeof result.catch === 'function') result.catch(() => {});
                } else {
                    audioPreferenceMuted = true;
                    applyAudioPreference();
                }
                syncSound();
            });
            volume.addEventListener('input', () => {
                if (!video) return;
                audioPreferenceVolume = Number(volume.value) / 100;
                audioPreferenceMuted = audioPreferenceVolume === 0;
                applyAudioPreference();
                syncSound();
            });
            seek.addEventListener('input', () => {
                if (video && Number.isFinite(video.duration) && video.duration > 0) {
                    video.currentTime = Number(seek.value) / 1000 * video.duration;
                    syncTime();
                }
            });
            fullscreen.addEventListener('click', () => {
                if (document.fullscreenElement === player) {
                    document.exitFullscreen?.().catch?.(() => {});
                    return;
                }
                if (typeof player.requestFullscreen === 'function') player.requestFullscreen()?.catch?.(() => {});
                else if (typeof video?.webkitEnterFullscreen === 'function') video.webkitEnterFullscreen();
            });

            return { element: ui, bindVideo };
        };

        const hasKickControls = player => Array.from(player.querySelectorAll('[class]'))
            .some(element => element.classList.contains('group/seekbar'));

        const exposeClipControls = () => {
            const players = new Set();
            document.querySelectorAll('[data-nosnippet]').forEach(gate => {
                const player = findPlayer(gate);
                if (!player) return;
                // Kick owns this React subtree. Keep its age-gate node mounted and
                // let the scoped stylesheet hide it to avoid desynchronizing state.
                players.add(player);
            });
            document.querySelectorAll('.bypassbr-kick-ui').forEach(ui => {
                const player = findPlayer(ui);
                if (player) players.add(player);
            });
            document.querySelectorAll('video').forEach(video => {
                const player = findPlayer(video);
                if (player && controlsByPlayer.has(player)) players.add(player);
            });

            players.forEach(player => {
                let controller = controlsByPlayer.get(player);
                if (hasKickControls(player)) {
                    controller?.element.remove();
                    return;
                }
                if (!controller) {
                    controller = createClipControls(player);
                    controlsByPlayer.set(player, controller);
                }
                const video = player.querySelector('video');
                if (video) controller.bindVideo(video);
                if (controller.element.parentElement !== player) player.appendChild(controller.element);
            });
        };

        BypassBR.onReady(exposeClipControls);
        BypassBR.observeDocument(exposeClipControls, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'data-nosnippet'],
        });
    }
