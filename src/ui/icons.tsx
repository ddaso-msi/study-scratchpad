import type { ReactNode } from 'react'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const icons = {
  select: (
    <Icon>
      <path d="M5 3l10 6.5-4.6 1.1L8 15.5z" />
    </Icon>
  ),
  text: (
    <Icon>
      <path d="M4.5 6V4.5h11V6M10 4.5v11M8 15.5h4" />
    </Icon>
  ),
  pen: (
    <Icon>
      <path d="M3.5 16.5l1-4L13.5 3.5l3 3L7.5 15.5zM11.5 5.5l3 3" />
    </Icon>
  ),
  eraser: (
    <Icon>
      <path d="M8 16.5l-4.5-4.5 8-8 5 5-7.5 7.5zM7 9l5 5M8 16.5h8.5" />
    </Icon>
  ),
  rectangle: (
    <Icon>
      <rect x="3.5" y="5" width="13" height="10" />
    </Icon>
  ),
  ellipse: (
    <Icon>
      <circle cx="10" cy="10" r="6.5" />
    </Icon>
  ),
  line: (
    <Icon>
      <path d="M4 16L16 4" />
    </Icon>
  ),
  arrow: (
    <Icon>
      <path d="M4 16L16 4M9 4h7v7" />
    </Icon>
  ),
  calc: (
    <Icon>
      <rect x="4" y="2.5" width="12" height="15" />
      <rect x="6.5" y="5" width="7" height="3" />
      <path d="M7 11.2h.1M10 11.2h.1M13 11.2h.1M7 14.2h.1M10 14.2h.1M13 14.2h.1" strokeWidth="1.8" />
    </Icon>
  ),
  image: (
    <Icon>
      <rect x="3" y="4" width="14" height="12" />
      <circle cx="7.5" cy="8.5" r="1.2" />
      <path d="M3.5 14.5l4-4 3 3 2-2 4 4" />
    </Icon>
  ),
  style: (
    <Icon>
      <circle cx="10" cy="10" r="6.5" />
      <circle cx="10" cy="10" r="2.5" fill="currentColor" />
    </Icon>
  ),
  undo: (
    <Icon>
      <path d="M7 4L3.5 7.5 7 11M4 7.5h7.5a4.5 4.5 0 010 9H9" />
    </Icon>
  ),
  redo: (
    <Icon>
      <path d="M13 4l3.5 3.5L13 11M16 7.5H8.5a4.5 4.5 0 000 9H11" />
    </Icon>
  ),
  export: (
    <Icon>
      <path d="M10 12.5v-9M6.5 6.5L10 3l3.5 3.5M4 11.5v5h12v-5" />
    </Icon>
  ),
  more: (
    <Icon>
      <path d="M5 10h.1M10 10h.1M15 10h.1" strokeWidth="2.2" />
    </Icon>
  ),
}
