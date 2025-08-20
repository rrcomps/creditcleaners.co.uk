import React from 'react';

const baseProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
};

export const CheckCircle2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const ShieldCheck = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const Phone = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11 18a19.5 19.5 0 0 1-5-5A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.83.3 1.65.54 2.44a2 2 0 0 1-.45 2L8.09 9.91a16 16 0 0 0 6 6l1.72-1.72a2 2 0 0 1 2-.45 12.44 12.44 0 0 0 2.44.54A2 2 0 0 1 22 16.92Z" />
  </svg>
);

export const ArrowRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const Info = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const AlertTriangle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const Lock = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const Award = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="8" r="7" />
    <path d="M8.21 13.89 7 23l5-2 5 2-1.21-9.11" />
  </svg>
);

export const Star = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
