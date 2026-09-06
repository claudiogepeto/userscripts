    if (BypassBR.hostIs('erome.com')) {
        const getCookie = name => {
            const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
            return match ? BypassBR.decodeCookieValue(match[1]) : null;
        };

        const clearDisclaimer = () => {
            const disclaimer = document.getElementById('disclaimer');
            const enterButton = document.querySelector('.enter');
            if (!disclaimer || !enterButton || window.__bypassBrEromeBusy) return;
            window.__bypassBrEromeBusy = true;

            const csrf = document.querySelector('meta[name="csrf-token"]')?.content
                || document.querySelector('input[name="_token"]')?.value
                || getCookie('XSRF-TOKEN');
            const headers = { 'X-Requested-With': 'XMLHttpRequest' };
            if (csrf) headers['X-CSRF-TOKEN'] = csrf;

            fetch('/user/disclaimer', {
                method: 'POST',
                credentials: 'same-origin',
                headers,
            }).then(response => {
                if (!response.ok) throw new Error(`Erome disclaimer request failed: ${response.status}`);
                disclaimer.remove();
                if (document.body) document.body.style.overflow = 'visible';
                location.reload();
            }).catch(() => {
                window.__bypassBrEromeBusy = false;
                enterButton.click();
            });
        };

        BypassBR.onReady(clearDisclaimer);
        BypassBR.observeDocument(clearDisclaimer);
    }
