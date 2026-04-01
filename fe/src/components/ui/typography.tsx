import React, { ElementType } from 'react';

type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyBold'
  | 'bodySemi'
  | 'bodyMedium'
  | 'bodyRegular'
  | 'caption'
  | 'label';

interface TypographyProps {
  variant?: TypographyVariant;
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
}

const Typography: React.FC<TypographyProps> = ({
  variant = 'bodyMedium',
  children,
  className = '',
  as,
}) => {
  const variantStyles: Record<
    TypographyVariant,
    { tag: ElementType; style: string }
  > = {
    h1: {
      tag: 'h1',
      style: 'text-3xl font-bold leading-tight text-primary-text',
    },
    h2: {
      tag: 'h2',
      style: 'text-2xl font-bold leading-tight text-primary-text',
    },
    h3: {
      tag: 'h3',
      style: 'text-xl font-bold leading-tight text-primary-text',
    },
    bodyBold: {
      tag: 'p',
      style: 'text-sm font-bold leading-normal text-primary-text',
    },
    bodySemi: {
      tag: 'p',
      style: 'text-sm font-semibold leading-normal text-primary-text',
    },
    bodyMedium: {
      tag: 'p',
      style: 'text-sm font-medium leading-normal text-primary-text',
    },
    bodyRegular: {
      tag: 'p',
      style: 'text-sm font-normal leading-normal text-primary-text',
    },
    caption: {
      tag: 'span',
      style: 'text-xs font-normal leading-normal text-primary-text',
    },
    label: {
      tag: 'span',
      style: 'text-[10px] font-normal leading-normal text-primary-text',
    },
  };

  const { tag: defaultTag, style } = variantStyles[variant];
  const Component = as ?? defaultTag;

  return <Component className={`${style} ${className}`}>{children}</Component>;
};

export default Typography;
