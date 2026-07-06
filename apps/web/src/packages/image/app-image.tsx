import NextImage, { type ImageProps as NextImageProps } from 'next/image';
import type { ReactNode } from 'react';

/** {@link NextImageProps} with a mandatory (non-optional) `alt`. */
export type AppImageProps = Omit<NextImageProps, 'alt'> & {
  alt: string;
};

/** next/image wrapper that makes descriptive alt text a compile-time requirement. */
export const AppImage = ({ alt, ...rest }: AppImageProps): ReactNode => (
  <NextImage {...rest} alt={alt} />
);
