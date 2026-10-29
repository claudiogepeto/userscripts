    // media/07-video-providers.js
    // Owns: supported s9e video providers and selectors shared by the post model and player CSS.
    // Exposes: VIDEO_S9E_PROVIDERS, VIDEO_S9E_RE, VIDEO_S9E_SELECTOR, VIDEO_BBMEDIA_SELECTOR.
    // Depends on: none.
    const VIDEO_S9E_PROVIDERS = Object.freeze(['redgifs', 'gifs', 'youtube', 'vimeo', 'streamable', 'dailymotion', 'tiktok', 'twitch']);
    const VIDEO_S9E_RE = new RegExp('^(?:' + VIDEO_S9E_PROVIDERS.join('|') + ')$', 'i');
    const VIDEO_S9E_SELECTOR = VIDEO_S9E_PROVIDERS.map(provider => 'span[data-s9e-mediaembed="' + provider + '"]').join(',\n            ');
    const VIDEO_BBMEDIA_SELECTOR = VIDEO_S9E_PROVIDERS.map(provider => '.bbMediaWrapper[data-media-site-id="' + provider + '"]').join(',\n            ');
