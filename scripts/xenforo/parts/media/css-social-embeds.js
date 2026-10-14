    // ── CSS: Twitter/X and Instagram embeds ──
    const CSS_SOCIAL_EMBEDS = `
            /* ---- Embeds Oficiais (Twitter / X e Instagram) ---- */
            .smg-twitter-embed {
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                margin: 16px auto !important;
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
                margin: 14px 0 !important;
                padding: 16px 18px !important;
                background: var(--smg-s1, #16171b) !important;
                border: 1px solid rgba(255,255,255,0.12) !important;
                border-radius: 16px !important;
                box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
                color: var(--smg-tx, #e7e7ea) !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                box-sizing: border-box !important;
            }
            .smg-tw-head {
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                margin-bottom: 12px !important;
            }
            .smg-tw-avatar {
                width: 42px !important;
                height: 42px !important;
                border-radius: 50% !important;
                overflow: hidden !important;
                flex-shrink: 0 !important;
                background: var(--smg-s2, rgba(255,255,255,0.06)) !important;
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
                gap: 2px !important;
            }
            .smg-tw-name {
                font-weight: 700 !important;
                font-size: 14.5px !important;
                color: var(--smg-tx, #e7e7ea) !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
                text-decoration: none !important;
            }
            .smg-tw-name:hover {
                text-decoration: underline !important;
            }
            .smg-tw-user {
                font-size: 12.5px !important;
                color: var(--smg-tx2, rgba(255,255,255,0.5)) !important;
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
                font-size: 14.5px !important;
                line-height: 1.55 !important;
                word-break: break-word !important;
                white-space: pre-wrap !important;
                margin-bottom: 12px !important;
                color: var(--smg-tx, #e7e7ea) !important;
            }
            .smg-tw-media {
                position: relative !important;
                margin: 4px 0 12px !important;
                border-radius: 12px !important;
                overflow: hidden !important;
                background: #000 !important;
            }
            .smg-tw-play-overlay {
                position: absolute !important;
                inset: 0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: rgba(0, 0, 0, 0.25) !important;
                cursor: pointer !important;
                z-index: 2 !important;
                transition: background 0.2s ease !important;
            }
            .smg-tw-play-overlay:hover {
                background: rgba(0, 0, 0, 0.45) !important;
            }
            .smg-tw-play-icon {
                width: 58px !important;
                height: 58px !important;
                border-radius: 50% !important;
                background: rgba(29, 155, 240, 0.95) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
                transition: transform 0.15s ease, background 0.15s ease !important;
            }
            .smg-tw-play-icon svg {
                margin-left: 3px !important;
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
                border: 3px solid rgba(255, 255, 255, 0.3) !important;
                border-top-color: #1d9bf0 !important;
                border-radius: 50% !important;
                animation: smg-tw-spin 0.75s linear infinite !important;
            }
            @keyframes smg-tw-spin {
                to { transform: rotate(360deg); }
            }
            .smg-tw-media img {
                width: 100% !important;
                max-height: 640px !important;
                object-fit: contain !important;
                display: block !important;
                border-radius: 12px !important;
                background: #000 !important;
            }
            .smg-tw-media video {
                width: 100% !important;
                max-height: 640px !important;
                object-fit: contain !important;
                display: block !important;
                border-radius: 12px !important;
                background: #000 !important;
            }
            .smg-tw-media-grid {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 6px !important;
            }
            .smg-tw-media-grid img {
                height: 320px !important;
                object-fit: cover !important;
            }
            .smg-tw-foot {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding-top: 10px !important;
                border-top: 1px solid rgba(255,255,255,0.08) !important;
                font-size: 12px !important;
                color: var(--smg-tx2, rgba(255,255,255,0.5)) !important;
            }
            .smg-tw-stats {
                display: flex !important;
                align-items: center !important;
                gap: 14px !important;
            }
            .smg-tw-open {
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
                color: var(--smg-link, #ff77b2) !important;
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
                border-radius: 14px !important;
            }
`;