import { useEffect } from 'react';

const SITE_URL = 'https://pos.fahrudina.my.id';

interface PageMetaOptions {
  title?: string;
  description?: string;
  /** Route path (e.g. '/', '/login', '/install') used to build the canonical URL. */
  path?: string;
}

/**
 * Updates the single static <title>/<meta name="description">/<link rel="canonical">
 * already present in index.html, rather than injecting new tags — index.html is served
 * as-is for every route (SPA rewrite), so a library that only appends tags would leave
 * two conflicting canonical links per page, which makes Google ignore both.
 */
export const usePageMeta = ({ title, description, path }: PageMetaOptions) => {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    }

    if (path !== undefined) {
      document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${SITE_URL}${path}`);
    }
  }, [title, description, path]);
};
