import React from 'react';

// Common SVG props
const svgProps = (size = 20, className = '') => ({
  xmlns: 'http://www.w3.org/2000/svg',
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: className
});

export const IconDashboard = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

export const IconCart = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export const IconBag = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

export const IconInventory = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <path d="M20.38 3.46L16 2.1a2 2 0 0 0-1.48 0l-9 2.8a2 2 0 0 0-1.25 1.57L3.06 14A2 2 0 0 0 4 16.14L12 22l8-5.86a2 2 0 0 0 .94-2.14l-1.21-7.63a2 2 0 0 0-1.35-1.91z" />
    <line x1="12" y1="22" x2="12" y2="10" />
    <line x1="12" y1="10" x2="20" y2="6.5" />
    <line x1="12" y1="10" x2="4" y2="6.5" />
  </svg>
);

export const IconHanger = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <path d="M12 2a3 3 0 0 1 3 3c0 1.25-.66 2.25-1.5 3L21 16a2 2 0 0 1-1.5 3H4.5A2 2 0 0 1 3 16l7.5-8c-.84-.75-1.5-1.75-1.5-3a3 3 0 0 1 3-3z" />
  </svg>
);

export const IconReports = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const IconRevenue = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

export const IconMargin = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export const IconGem = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <path d="M6 3h12l4 6-10 12L2 9z" />
    <path d="M11 3 8 9l4 12 4-12-3-6" />
    <path d="M2 9h20" />
  </svg>
);

export const IconGift = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

export const IconClients = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const IconAlert = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const IconApparel = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <path d="M20.3 5.3a1 1 0 0 0-1-.3h-3.3l-1.4-2.8a2 2 0 0 0-3.6 0L9.6 5H6.3a1 1 0 0 0-1 .7L3 18a2 2 0 0 0 2 2.3h14a2 2 0 0 0 2-2.3z" />
    <path d="M12 5v15" />
  </svg>
);

export const IconLeather = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <path d="M12 22a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9z" />
    <path d="M12 13V5a3 3 0 0 0-6 0v8" />
    <path d="M18 13V5a3 3 0 0 0-3-3 3 3 0 0 0-3 3" />
  </svg>
);

export const IconFragrance = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <rect x="6" y="9" width="12" height="13" rx="2" />
    <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    <path d="M11 3h2" />
    <circle cx="12" cy="15" r="2" />
  </svg>
);

export const IconAccessories = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <circle cx="12" cy="14" r="7" />
    <polygon points="12 2 8 7 16 7" />
  </svg>
);

export const IconClose = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const IconSearch = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const IconPrint = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

export const IconTrash = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const IconEdit = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

export const IconPlus = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const IconDownload = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const IconEye = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconSparkles = ({ size, className }) => (
  <svg {...svgProps(size, className)}>
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
  </svg>
);
