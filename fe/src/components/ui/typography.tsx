import React, { ElementType } from 'react';

type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'lg'
  | 'bodyBold'
  | 'bodySemi'
  | 'bodyMedium'
  | 'bodyRegular'
  | 'caption'
  | 'label'
  | 'base';

type TypographyColor = 'primary' | 'base' | 'secondary';

interface TypographyProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
}

const Typography: React.FC<TypographyProps> = ({
  variant = 'bodyMedium',
  color = 'base',
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
      style: 'text-3xl font-bold leading-tight',
    },
    h2: {
      tag: 'h2',
      style: 'text-2xl font-bold leading-tight',
    },
    h3: {
      tag: 'h3',
      style: 'text-xl font-bold leading-tight',
    },
    lg: {
      tag: 'h3',
      style: 'text-lg font-bold leading-tight',
    },
    bodyBold: {
      tag: 'p',
      style: 'text-sm font-bold leading-normal',
    },
    bodySemi: {
      tag: 'p',
      style: 'text-sm font-semibold leading-normal',
    },
    bodyMedium: {
      tag: 'p',
      style: 'text-sm font-medium leading-normal',
    },
    bodyRegular: {
      tag: 'p',
      style: 'text-sm font-normal leading-normal',
    },
    caption: {
      tag: 'span',
      style: 'text-xs font-normal leading-normal',
    },
    label: {
      tag: 'span',
      style: 'text-[10px] font-normal leading-normal',
    },
    base: {
      tag: 'h4',
      style: 'text-base font-semibold leading-normal',
    },
  };

  const colorStyles: Record<TypographyColor, string> = {
    primary: 'text-primary',
    base: 'text-black',
    secondary: 'text-muted-foreground',
  };

  const { tag: defaultTag, style } = variantStyles[variant];
  const Component = as ?? defaultTag;

  return (
    <Component className={`${style} ${colorStyles[color]} ${className}`}>
      {children}
    </Component>
  );
};

export default Typography;
