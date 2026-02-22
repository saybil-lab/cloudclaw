import { router } from '@inertiajs/react';
import { trackEvent } from './analytics';

let initialUrl: string | null = null;

function handleGtmEvent(props: Record<string, unknown>) {
    const gtmEvent = (props.flash as { gtm_event?: string } | undefined)?.gtm_event;
    if (gtmEvent) {
        trackEvent(gtmEvent);
    }
}

export function setupGtmFlashListener() {
    // Handle initial page load (full page load from server redirects)
    const initialPage = document.getElementById('app')?.dataset.page;
    if (initialPage) {
        try {
            const page = JSON.parse(initialPage);
            if (page.props?.flash?.gtm_event) {
                initialUrl = page.url;
                handleGtmEvent(page.props);
            }
        } catch {
            // ignore parse errors
        }
    }

    // Handle subsequent Inertia navigations (skip first if already handled above)
    router.on('navigate', (event) => {
        const url = event.detail.page.url;
        if (initialUrl && url === initialUrl) {
            initialUrl = null;
            return;
        }
        initialUrl = null;
        handleGtmEvent(event.detail.page.props);
    });
}
