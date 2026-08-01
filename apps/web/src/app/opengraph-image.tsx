import { ImageResponse } from 'next/og';

import { APP_NAME } from '@twinzy/shared';

import {
  OG_IMAGE_COPY,
  OG_IMAGE_LOGO,
  OG_IMAGE_SIZE,
  OG_IMAGE_STYLES,
} from '@/shared/constants/og-image.constants';

export { OG_IMAGE_CONTENT_TYPE as contentType } from '@/shared/constants/og-image.constants';

export const size = OG_IMAGE_SIZE;
export const alt = OG_IMAGE_COPY.alt;

/**
 * The link-preview card scrapers fetch for the site root. Generated at build
 * time from the brand palette so a shared URL renders with a title, tagline and
 * logo instead of a bare link.
 */
const OpenGraphImage = (): ImageResponse =>
  new ImageResponse(
    <div style={OG_IMAGE_STYLES.root}>
      <svg width={OG_IMAGE_LOGO.size} height={OG_IMAGE_LOGO.size} viewBox={OG_IMAGE_LOGO.viewBox}>
        <rect
          width="128"
          height="128"
          rx={OG_IMAGE_LOGO.cornerRadius}
          fill={OG_IMAGE_LOGO.background}
        />
        <circle
          cx={OG_IMAGE_LOGO.leftEye.cx}
          cy={OG_IMAGE_LOGO.leftEye.cy}
          r={OG_IMAGE_LOGO.eyeRadius}
          fill="none"
          stroke={OG_IMAGE_LOGO.leftEye.stroke}
          strokeWidth={OG_IMAGE_LOGO.strokeWidth}
        />
        <circle
          cx={OG_IMAGE_LOGO.rightEye.cx}
          cy={OG_IMAGE_LOGO.rightEye.cy}
          r={OG_IMAGE_LOGO.eyeRadius}
          fill="none"
          stroke={OG_IMAGE_LOGO.rightEye.stroke}
          strokeWidth={OG_IMAGE_LOGO.strokeWidth}
        />
        <path
          d={OG_IMAGE_LOGO.smilePath}
          fill="none"
          stroke={OG_IMAGE_LOGO.smileStroke}
          strokeWidth={OG_IMAGE_LOGO.strokeWidth}
          strokeLinecap="round"
        />
      </svg>
      <div style={OG_IMAGE_STYLES.name}>{APP_NAME}</div>
      <div style={OG_IMAGE_STYLES.tagline}>{OG_IMAGE_COPY.tagline}</div>
      <div style={OG_IMAGE_STYLES.subtitle}>{OG_IMAGE_COPY.subtitle}</div>
    </div>,
    size,
  );

export default OpenGraphImage;
