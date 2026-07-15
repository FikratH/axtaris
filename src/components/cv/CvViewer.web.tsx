import React from 'react';

interface Props {
  url: string;
  kind: 'pdf' | 'office';
}

/**
 * Web CV preview. PDFs render inline in the browser's native viewer via an
 * iframe; Office documents (.doc/.docx) are embedded through Microsoft's
 * public Office viewer (it fetches the time-limited signed URL server-side).
 */
export function CvViewer({ url, kind }: Props) {
  const src =
    kind === 'office'
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
      : url;

  return React.createElement('iframe', {
    src,
    title: 'CV preview',
    style: { width: '100%', height: '100%', border: '0', backgroundColor: '#ffffff' },
  });
}
