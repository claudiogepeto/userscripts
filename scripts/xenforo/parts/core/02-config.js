    // =========================================================
    // CONFIG
    // =========================================================

    const DEFAULT_FEATURES = {
        autoFullImages: true,       // "Grade de imagens nos posts": qualidade média + grade masonry por post (off = thumbs nativas)
        autoLoadRedgifs: true,      // auto-click nos placeholders de redgifs
        redgifsPlayer: true,        // troca o iframe do redgifs por <video> nativo (mp4 da API); à prova de falha (restaura o iframe)
        autoExpandSpoilers: true,   // abre os spoilers automaticamente
        sidebarNavigation: true,    // dock de navegação (desligar esconde a barra inteira)
        topBar: true,               // topbar reformulada (ícones + popovers agrupados; esconde a nav nativa)
        alertsDock: true,           // modo "docked" das notificações: rail fixo à direita (empurra o conteúdo) com scroll infinito
        autoSearchTitleOnly: true,  // marca "Search titles only" no quick search
        imageLightbox: true,        // clique na imagem abre o modo feed
        mediaFeed: true,            // botão "modo feed" (tiktok) com a mídia da thread
        keyboardShortcuts: true,    // atalhos de teclado (j/k/[/]/g/v/f//)
        infiniteScroll: true,       // master switch / rolagem infinita global
        infiniteScrollThreads: true,  // rolagem infinita em tópicos (threads)
        infiniteScrollTimeline: true, // rolagem infinita na timeline / feed
        infiniteScrollWatched: true,  // rolagem infinita em fóruns / tópicos seguidos (watched)
        thumbPlaceholders: true,    // marca no lugar de thumb ausente/quebrada (grid/lista)
        hoverPreview: true,         // preview maior da thumb ao passar o mouse (desktop)
        homeRemake: true,           // reformula a home (cards/atalhos/sidebar pro topo) — off = home original
        customFavicon: true,        // troca a favicon pela marca SMG (SMG only)
        headerNotices: true,        // recolhe os avisos (.notices--block) num iconezinho dentro da página
        lazyEmbeds: true,           // só monta o embed perto da viewport
        unwrapLinks: true,          // pula o aviso de link externo (goto/redirect → URL real)
        revealLikedPosts: true,     // SMG: recarrega o post escondido após reagir (like/medalha)
        imagepondEmbeds: true,      // SMG: troca o iframe do imagepond.net/videos pelo nosso player (scrape do mp4)
        cyberdropEmbeds: true,      // troca o iframe do cyberdrop /e/ (fica em branco atrás do DDoS-Guard) pelo nosso player (API do host)
        directMedia: true,          // embeda mídia DIRETA (susercontent/Shopee, .mp4/.webm/.webp em link cru)
        fileHostCards: true,        // links de file-host (pixeldrain/bunkr/gofile/mega/cyberdrop/…) → card estilizado (thumb/logo + host + tipo)
        groupLinks: true,           // agrupa os links de file-host (GoFile/Bunkr/…) numa barra de chips no post
        mediaDownload: true,        // botão "baixar toda a mídia do post" na action bar
        shareDirectLink: true,      // Compartilhar copia o link direto do post (em vez de abrir o menu de compartilhamento do XF)
        bookmarksFeed: true,        // /account/bookmarks: substitui a lista nativa por um feed com os posts salvos (igual o feed da home)
    };

    // persistência (engrenagem na dock) — GM_*Value com fallback p/ localStorage
    const FEATURES_KEY = 'smg-features';
    const gmGet = (k, d) => { try { return typeof GM_getValue === 'function' ? GM_getValue(k, d) : (localStorage.getItem(k) ?? d); } catch { return d; } };
    const gmSet = (k, v) => { try { if (typeof GM_setValue === 'function') GM_setValue(k, v); else localStorage.setItem(k, v); } catch {} };
    // kill-switch global: se o site quebrar com o mod, rode gmSet('smg-off','1') (ou localStorage) e recarregue.
    const smgDisabled = gmGet('smg-off', '0') === '1';

    const FEATURES = (() => {
        let stored = {};
        try { stored = JSON.parse(gmGet(FEATURES_KEY, '{}')) || {}; } catch {}
        return { ...DEFAULT_FEATURES, ...stored };
    })();

    function saveFeatures() { gmSet(FEATURES_KEY, JSON.stringify(FEATURES)); }

    // sempre ligadas: não aparecem no painel e ignoram qualquer valor salvo antigo
    ['imageLightbox', 'mediaFeed', 'lazyEmbeds'].forEach(k => { FEATURES[k] = true; });

    // toggles do painel de settings — agrupados por categoria, cada um com descrição do impacto.
    // desc é bilíngue inline ({en,pt}); o label é traduzido pelo i18nDom (dicionário).
    const SETTINGS_META = [
        { section: 'Appearance', items: [
            { key: 'topBar', label: 'Redesigned top bar', desc: { en: "Replaces the original header with a lean bar that gathers search, discover, watched, alerts and account into icons.", pt: 'Substitui o cabeçalho original por uma barra enxuta, com busca, descobrir, seguindo, alertas e conta reunidos em ícones.' } },
            { key: 'homeRemake', label: 'Reworked homepage', desc: { en: 'Reorganizes the home into clickable cards, moves the sidebar to the top and merges the smaller sections.', pt: 'Reorganiza a home em cards clicáveis, leva a barra lateral para o topo e agrupa as seções menores.' } },
            { key: 'alertsDock', label: 'Docked side panel', desc: { en: 'Adds a pin button to the bell and to Following: they turn into a fixed rail on the right side, with tabs for alerts and watched threads and the whole history in infinite scroll. The page is pushed aside instead of covered — and its column widens to use the leftover margin — so you can keep browsing while you go through the list.', pt: 'Adiciona um botão de fixar no sino e no Seguindo: viram um painel fixo na lateral direita, com abas de alertas e tópicos acompanhados e o histórico inteiro em rolagem infinita. A página é empurrada em vez de coberta — e a coluna dela alarga para aproveitar a margem que sobrava — então dá para navegar enquanto passa pela lista.' } },
            { key: 'headerNotices', label: 'Notices tucked into an icon', desc: { en: 'Hides the page notices behind a small in-page icon, freeing up space. Click it to read them.', pt: 'Recolhe os avisos da página atrás de um ícone pequeno, liberando espaço. Clique nele para ler.' } },
            { key: 'customFavicon', label: 'Custom tab icon', desc: { en: "Swaps the icon shown on the browser tab for the site's identity (SocialMediaGirls only).", pt: 'Troca o ícone exibido na aba do navegador pela identidade do site (somente no SocialMediaGirls).' } },
        ] },
        { section: 'Images', items: [
            { key: 'autoFullImages', label: 'Image grid in posts', desc: { en: "Lays each post's images out in a masonry mosaic and loads them at medium quality to save data. Off, it keeps the original thumbnails, with no grid.", pt: 'Dispõe as imagens de cada post num mosaico (masonry) e as carrega em qualidade média, para poupar dados. Desligado, mantém as miniaturas originais, sem grade.' } },
            { key: 'hoverPreview', label: 'Enlarged preview on hover', desc: { en: 'Shows a larger version of the thumbnail when the cursor rests over it (desktop only).', pt: 'Mostra uma versão maior da miniatura quando o cursor para sobre ela (apenas no desktop).' } },
            { key: 'thumbPlaceholders', label: 'Placeholder for missing thumbnails', desc: { en: 'Puts a branded badge in place of thumbnails that are missing or failed to load.', pt: 'Coloca um selo com a identidade do site no lugar de miniaturas que faltam ou falharam ao carregar.' } },
        ] },
        { section: 'Videos', items: [
            { key: 'autoLoadRedgifs', label: 'RedGifs — load automatically', desc: { en: 'Opens RedGifs players on their own, without requiring a click on the load prompt.', pt: 'Abre os players do RedGifs sozinho, sem exigir o clique no aviso de carregamento.' } },
            { key: 'redgifsPlayer', label: 'RedGifs — built-in player', desc: { en: "Replaces the default RedGifs player with a native one — true aspect ratio, mute and scrubbing. Falls back to the original if the API doesn't respond.", pt: 'Troca o player padrão do RedGifs por um nativo, com proporção real, mudo e controle de tempo. Retorna ao original caso a API não responda.' } },
            { key: 'imagepondEmbeds', label: 'ImagePond — built-in player', desc: { en: 'Replaces the imagepond.net video iframe with the native player (own controls + download). Falls back to the original when it can\'t.', pt: 'Troca o iframe de vídeo do imagepond.net pelo player nativo (controles próprios + download). Recorre ao original quando não consegue.' } },
            { key: 'cyberdropEmbeds', label: 'Cyberdrop — built-in player', desc: { en: 'The cyberdrop embed loads blank inside the forum (the host sits behind DDoS-Guard), leaving the post empty. Resolves the video through the host API and plays it in the native player, with a link back to the file.', pt: 'O embed do cyberdrop carrega em branco dentro do fórum (o host fica atrás do DDoS-Guard) e o post fica vazio. Resolve o vídeo pela API do host e toca no player nativo, com link de volta pro arquivo.' } },
        ] },
        { section: 'Links & files', items: [
            { key: 'directMedia', label: 'Direct media from CDNs', desc: { en: 'Embeds standalone files (.mp4/.webm and images from CDNs like Shopee) in place of the raw link.', pt: 'Incorpora arquivos avulsos (.mp4/.webm e imagens de CDNs como o Shopee) no lugar do link cru.' } },
            { key: 'fileHostCards', label: 'File-host link cards', desc: { en: 'Turns file-host links (Pixeldrain, Bunkr, GoFile, MEGA, Cyberdrop…) into a clear card: thumbnail or host logo on the left, plus type and item count for galleries.', pt: 'Transforma links de hospedagem (Pixeldrain, Bunkr, GoFile, MEGA, Cyberdrop…) num card claro: miniatura ou logo do host à esquerda, com o tipo e a contagem de itens nas galerias.' } },
            { key: 'unwrapLinks', label: 'Skip external link warning', desc: { en: 'Skips the warning page when leaving the forum (goto/redirect); the click goes straight to the destination.', pt: 'Ignora a página de alerta ao sair do fórum (goto/redirect); o clique segue direto ao destino.' } },
            { key: 'groupLinks', label: 'Gather download links', desc: { en: 'Gathers file-host links (GoFile, Bunkr, Pixeldrain…) into a shortcut bar at the end of the post, without touching the text.', pt: 'Agrupa os links de hospedagem (GoFile, Bunkr, Pixeldrain…) numa barra de atalhos ao fim do post, sem mexer no texto.' } },
        ] },
        { section: 'Infinite scroll', items: [
            { key: 'infiniteScroll', label: 'Infinite scroll (global)', desc: { en: 'Master switch for infinite scrolling across threads, timeline and watched lists.', pt: 'Chave mestre para rolagem infinita em tópicos, timeline e listas de seguidos.' } },
            { key: 'infiniteScrollThreads', label: 'Infinite scroll in threads', desc: { en: 'Loads the next thread page automatically when you reach the bottom.', pt: 'Carrega a próxima página do tópico automaticamente ao chegar ao fim.' } },
            { key: 'infiniteScrollTimeline', label: 'Infinite scroll in timeline', desc: { en: 'Loads older posts automatically when scrolling the timeline/feed.', pt: 'Carrega posts mais antigos automaticamente ao rolar a timeline/feed.' } },
            { key: 'infiniteScrollWatched', label: 'Infinite scroll in watched & forums', desc: { en: 'Loads next pages automatically in watched lists and forum thread listings.', pt: 'Carrega as próximas páginas automaticamente em listas de seguidos e fóruns.' } },
        ] },
        { section: 'Thread & reading', items: [
            { key: 'mediaDownload', label: 'Download all media on the page', desc: { en: 'Adds a button (in the thread header) that downloads every image and video on the current page at once.', pt: 'Adiciona um botão (no header da thread) que baixa de uma vez todas as imagens e vídeos da página atual.' } },
            { key: 'revealLikedPosts', label: 'Reveal locked posts on reacting', desc: { en: 'On SMG, reloads a like/medal-locked post on its own as soon as you react — no manual refresh.', pt: 'No SMG, recarrega sozinho o post liberado por curtida/medalha assim que você reage, sem atualizar na mão.' } },
            { key: 'autoExpandSpoilers', label: 'Open spoilers automatically', desc: { en: 'Expands spoilers without requiring a click.', pt: 'Expande os spoilers sem exigir clique.' } },
            { key: 'keyboardShortcuts', label: 'Keyboard shortcuts', desc: { en: 'j / k posts · [ ] pages · g go to page · v grid/list · f feed mode · n notifications · / search.', pt: 'j / k posts · [ ] páginas · g ir para página · v grade/lista · f modo feed · n notificações · / buscar.' } },
            { key: 'bookmarksFeed', label: 'Bookmarks as a feed', desc: { en: 'Replaces the bookmarks page with a feed of your saved posts (media inline), just like the home feed.', pt: 'Substitui a página de salvos por um feed dos seus posts salvos (mídia inline), igual ao feed da home.' } },
            { key: 'shareDirectLink', label: 'Share copies the direct link', desc: { en: 'Share on a post copies its direct link straight to the clipboard instead of opening the sharing menu.', pt: 'O Compartilhar do post copia o link direto para a área de transferência, em vez de abrir o menu de compartilhamento.' } },
        ] },
    ];
