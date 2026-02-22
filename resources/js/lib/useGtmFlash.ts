import { router } from '@inertiajs/react';
import { trackEvent } from './analytics';

function handleGtmEvent(props: Record<string, unknown>) {
    const gtmEvent = (props.flash as { gtm_event?: string } | undefined)?.gtm_event;
    if (gtmEvent) {
        trackEvent(gtmEvent);
    }
}

export function setupGtmFlashListener() {
    // Handle subsequent Inertia navigations
    router.on('navigate', (event) => {
        handleGtmEvent(event.detail.page.props);
    });

    // Handle initial page load (full page load from server redirects)
    const initialPage = document.getElementById('app')?.dataset.page;
    if (initialPage) {
        try {
            const page = JSON.parse(initialPage);
            handleGtmEvent(page.props);
        } catch {
            // ignore parse errors
        }
    }
}
