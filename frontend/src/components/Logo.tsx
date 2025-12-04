import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  /** 是否显示完整文字，默认 true */
  showFullText?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ showFullText = true, className = '' }) => {
  return (
    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }} className={className}>
      {/* SVG Icon: Rounded Hexagon with W */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Rounded Hexagon - using path with rounded corners */}
        <path
          d="M20 6L29.5 10.5Q31 11.5 31 13L31 27Q31 28.5 29.5 29.5L20 34L10.5 29.5Q9 28.5 9 27L9 13Q9 11.5 10.5 10.5L20 6Z"
          fill="#2563eb"
          fillRule="evenodd"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.2))',
          }}
        />
        {/* Stylized W representing pipelines/flow - flowing from top to bottom */}
        <path
          d="M12 16L16 24L20 20L24 24L28 16M12 16V20M28 16V20M20 20V28"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Text */}
      {showFullText && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#1e293b',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            王得伏
          </span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 400,
              color: '#f97316',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              letterSpacing: '0.02em',
            }}
          >
            の工具箱
          </span>
        </div>
      )}
    </Link>
  );
};

export default Logo;

