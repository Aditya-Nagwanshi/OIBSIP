import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Slice Theory` : 'Slice Theory · Pizza, with a theory';
  }, [title]);
}
