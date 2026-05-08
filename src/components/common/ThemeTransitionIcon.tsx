import React from 'react'

type ThemeTransitionState = 'idle' | 'to-dark' | 'to-light'

interface ThemeTransitionIconProps {
  size?: number
  state?: ThemeTransitionState
}

const ThemeTransitionIcon: React.FC<ThemeTransitionIconProps> = ({ size = 14, state = 'idle' }) => {
  return (
    <span className={`theme-transition-icon ${state}`} style={{ display: 'inline-flex', width: size, height: size, position: 'relative' }}>
      <svg
        className="theme-icon-sun"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      <svg
        className="theme-icon-moon"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>

      <svg
        className="theme-icon-stars"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle className="theme-star theme-star-1" cx="6" cy="6" r="1" fill="currentColor" />
        <circle className="theme-star theme-star-2" cx="18" cy="8" r="0.8" fill="currentColor" />
        <circle className="theme-star theme-star-3" cx="14" cy="4" r="0.6" fill="currentColor" />
      </svg>

      <svg
        className="theme-icon-rays"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <line x1="12" y1="0" x2="12" y2="4" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="12" y1="20" x2="12" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="0" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="20" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      </svg>

      <svg
        className="theme-icon-halo"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      </svg>
    </span>
  )
}

export default ThemeTransitionIcon
