import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';

const appName = import.meta.env.VITE_APP_NAME || 'O!Save Monitor';

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx', { eager: true });
        const page = (pages[`./pages/${name}.tsx`] as any);
        if (!page) {
            throw new Error(`Page [${name}] not found in resources/js/pages/`);
        }
        return page.default ? page : { default: page };
    },
    setup({ el, App, props }) {
        if (!el) return;
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#E60012', // O!Save brand red
        showSpinner: false,
    },
});
