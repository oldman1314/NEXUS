import React from 'react'

type RocketState = 'idle' | 'launching' | 'flying' | 'returning'

interface RocketIconProps {
  size?: number
  state?: RocketState
}

const RocketIcon: React.FC<RocketIconProps> = ({ size = 48, state = 'idle' }) => {
  const stateClass = state === 'idle' ? 'hovering' : state

  return (
    <svg
      className={`run-btn-rocket ${stateClass}`}
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g className="rocket-flame-group">
        <ellipse
          className="rocket-flame rocket-flame-outer"
          cx="18" cy="32" rx="4" ry="3"
          fill="#FF9500" opacity="0.5"
        />
        <ellipse
          className="rocket-flame rocket-flame-inner"
          cx="18" cy="31" rx="2.5" ry="2"
          fill="#FFCC00" opacity="0.7"
        />
        <ellipse
          className="rocket-flame rocket-flame-core"
          cx="18" cy="30.5" rx="1.2" ry="1"
          fill="white" opacity="0.8"
        />
      </g>

      <g className="rocket-body-group">
        <path
          className="rocket-fins"
          d="M12 24 L8 30 L12 28 Z"
          fill="var(--accent, #007AFF)" opacity="0.6"
        />
        <path
          className="rocket-fins"
          d="M24 24 L28 30 L24 28 Z"
          fill="var(--accent, #007AFF)" opacity="0.6"
        />

        <path
          className="rocket-hull"
          d="M14 26 L14 16 Q14 8 18 4 Q22 8 22 16 L22 26 Z"
          fill="var(--accent, #007AFF)"
        />

        <path
          className="rocket-hull-highlight"
          d="M16 24 L16 16 Q16 10 18 7 Q18 10 18 16 L18 24 Z"
          fill="white" opacity="0.2"
        />

        <circle
          className="rocket-window"
          cx="18" cy="16" r="2.5"
          fill="white" opacity="0.85"
        />
        <circle
          className="rocket-window-inner"
          cx="18" cy="16" r="1.5"
          fill="var(--accent, #007AFF)" opacity="0.5"
        />

        <rect
          className="rocket-stripe"
          x="14" y="22" width="8" height="2" rx="0.5"
          fill="white" opacity="0.25"
        />
      </g>

      <g className="rocket-smoke-group">
        <circle className="rocket-smoke smoke-1" cx="14" cy="33" r="1.5" fill="white" opacity="0" />
        <circle className="rocket-smoke smoke-2" cx="22" cy="33" r="1.2" fill="white" opacity="0" />
        <circle className="rocket-smoke smoke-3" cx="18" cy="34" r="1" fill="white" opacity="0" />
      </g>
    </svg>
  )
}

export default RocketIcon
