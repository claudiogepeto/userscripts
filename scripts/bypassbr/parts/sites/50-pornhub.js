    if (BypassBR.hostIs('pornhub.com')) {
        const COOKIE = 'accessAgeDisclaimerPH=2';
        const EXPIRES = 'expires=Fri, 31 Dec 2038 23:59:59 GMT';

        try {
            if (!document.cookie.includes(COOKIE)) {
                document.cookie = `${COOKIE}; path=/; domain=.pornhub.com; ${EXPIRES}`;
                document.cookie = `${COOKIE}; path=/; ${EXPIRES}`;
                if (!sessionStorage.getItem('bypassbr-ph-age-reload')) {
                    sessionStorage.setItem('bypassbr-ph-age-reload', '1');
                    location.reload();
                }
            }
        } catch (error) {}
    }
