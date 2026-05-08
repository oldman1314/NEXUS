import type { JSX } from 'react'

export default function ApiRocketIcon(): JSX.Element {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      {/* 外圈光晕 */}
      <circle cx="12" cy="12" r="10.5" stroke="url(#grad1)" strokeWidth="0.8" opacity="0.25" />

      {/* 主六边形 */}
      <path
        d="M12 2.5L20.5 7V17L12 21.5L3.5 17V7L12 2.5Z"
        stroke="url(#grad1)"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />

      {/* 内部数据流 - 三条动态线 */}
      <g opacity="0.9">
        {/* 左上到中心 */}
        <path
          d="M7 8.5L12 12"
          stroke="url(#grad2)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* 右上到中心 */}
        <path
          d="M17 8.5L12 12"
          stroke="url(#grad2)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* 中心到底部 */}
        <path
          d="M12 12L12 18"
          stroke="url(#grad2)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>

      {/* 中心节点 */}
      <circle cx="12" cy="12" r="1.8" fill="url(#grad1)" />

      {/* 三个端点小圆 */}
      <circle cx="7" cy="8.5" r="1.1" fill="#06b6d4" opacity="0.85" />
      <circle cx="17" cy="8.5" r="1.1" fill="#3b82f6" opacity="0.85" />
      <circle cx="12" cy="18" r="1.1" fill="#8b5cf6" opacity="0.85" />

      {/* 微妙的高光点 */}
      <circle cx="11.3" cy="11.3" r="0.6" fill="white" opacity="0.5" />
    </svg>
  )
}
