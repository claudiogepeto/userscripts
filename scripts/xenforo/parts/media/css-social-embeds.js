    // ── CSS: Twitter/X and Instagram embeds ──
    const CSS_SOCIAL_EMBEDS = `
            /* ---- Embeds Oficiais (Twitter / X e Instagram) ---- */
            .smg-twitter-embed {
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                margin: var(--smg-sp-16) auto !important;
                max-width: 550px !important;
                width: 100% !important;
                min-height: 100px;
            }
            .smg-twitter-embed iframe,
            .twitter-tweet {
                margin-left: auto !important;
                margin-right: auto !important;
                max-width: 100% !important;
            }

            /* ---- Twitter / X Rich Card & Video Player ---- */
            .smg-tw-card {
                display: flex !important;
                flex-direction: column !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: var(--smg-sp-14) 0 !important;
                padding: var(--smg-sp-16) var(--smg-sp-18) !important;
                background: var(--smg-s1) !important;
                border: 1px solid var(--smg-w-12) !important;
                border-radius: var(--smg-r-16) !important;
                box-shadow: var(--smg-shadow-2) !important;
                color: var(--smg-tx) !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                box-sizing: border-box !important;
            }
            .smg-tw-head {
                display: flex !important;
                align-items: center !important;
                gap: var(--smg-sp-12) !important;
                margin-bottom: var(--smg-sp-12) !important;
            }
            .smg-tw-avatar {
                width: 42px !important;
                height: 42px !important;
                border-radius: var(--smg-r-round) !important;
                overflow: hidden !important;
                flex-shrink: 0 !important;
                background: var(--smg-s2) !important;
            }
            .smg-tw-avatar img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                display: block !important;
            }
            .smg-tw-author {
                display: flex !important;
                flex-direction: column !important;
                flex: 1 1 auto !important;
                min-width: 0 !important;
                gap: var(--smg-sp-2) !important;
            }
            .smg-tw-name {
                font-weight: 700 !important;
                font-size: var(--smg-fs-15) !important;
                color: var(--smg-tx) !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
                text-decoration: none !important;
            }
            .smg-tw-name:hover {
                text-decoration: underline !important;
            }
            .smg-tw-user {
                font-size: var(--smg-fs-13) !important;
                color: var(--smg-tx2) !important;
                text-decoration: none !important;
            }
            .smg-tw-xlogo {
                color: #fff !important;
                flex-shrink: 0 !important;
                opacity: 0.85 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                text-decoration: none !important;
            }
            .smg-tw-xlogo svg {
                width: 20px !important;
                height: 20px !important;
            }
            .smg-tw-text {
                font-size: var(--smg-fs-15) !important;
                line-height: 1.55 !important;
                word-break: break-word !important;
                white-space: pre-wrap !important;
                margin-bottom: var(--smg-sp-12) !important;
                color: var(--smg-tx) !important;
            }
            .smg-tw-media {
                position: relative !important;
                margin: var(--smg-sp-4) 0 var(--smg-sp-12) !important;
                border-radius: var(--smg-r-12) !important;
                overflow: hidden !important;
                background: #000 !important;
            }
            .smg-tw-play-overlay {
                position: absolute !important;
                inset: 0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: var(--smg-k-25) !important;
                cursor: pointer !important;
                z-index: var(--smg-z-2) !important;
                transition: background var(--smg-dur-20) ease !important;
            }
            .smg-tw-play-overlay:hover {
                background: var(--smg-k-45) !important;
            }
            .smg-tw-play-icon {
                width: 58px !important;
                height: 58px !important;
                border-radius: var(--smg-r-round) !important;
                background: rgba(29, 155, 240, 0.95) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-shadow: var(--smg-shadow-2) !important;
                transition: transform var(--smg-dur-15) ease, background var(--smg-dur-15) ease !important;
            }
            .smg-tw-play-icon svg {
                margin-left: var(--smg-sp-4) !important;
            }
            .smg-tw-play-overlay:hover .smg-tw-play-icon {
                transform: scale(1.08) !important;
                background: #1d9bf0 !important;
            }
            .smg-tw-play-overlay.loading .smg-tw-play-icon {
                background: transparent !important;
                box-shadow: none !important;
            }
            .smg-tw-spinner {
                width: 38px !important;
                height: 38px !important;
                border: 3px solid var(--smg-w-30) !important;
                border-top-color: #1d9bf0 !important;
                border-radius: var(--smg-r-round) !important;
                animation: smg-tw-spin 0.75s linear infinite !important;
            }
            @keyframes smg-tw-spin {
                to { transform: rotate(360deg); }
            }
            .smg-tw-media img,
            .smg-tw-media video {
                width: 100% !important;
                max-height: 640px !important;
                object-fit: contain !important;
                display: block !important;
                border-radius: var(--smg-r-12) !important;
                background: #000 !important;
            }
            .smg-tw-media-grid {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: var(--smg-sp-6) !important;
            }
            .smg-tw-media-grid img {
                height: 320px !important;
                object-fit: cover !important;
            }
            .smg-tw-foot {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding-top: var(--smg-sp-10) !important;
                border-top: 1px solid var(--smg-w-08) !important;
                font-size: var(--smg-fs-12) !important;
                color: var(--smg-tx2) !important;
            }
            .smg-tw-stats {
                display: flex !important;
                align-items: center !important;
                gap: var(--smg-sp-14) !important;
            }
            .smg-tw-open {
                display: inline-flex !important;
                align-items: center !important;
                gap: var(--smg-sp-4) !important;
                color: var(--smg-link) !important;
                text-decoration: none !important;
                font-weight: 600 !important;
            }
            .smg-tw-open:hover {
                text-decoration: underline !important;
            }
            blockquote.instagram-media {
                margin-left: auto !important;
                margin-right: auto !important;
                max-width: 100% !important;
                border-radius: var(--smg-r-14) !important;
            }
`;