import React from 'react'

/**
 * Small, dependency-free layout primitives used by the app.
 *
 * These intentionally cover the subset of the former Themes API that CryoAnime
 * uses. Keeping the primitives local means the app does not ship a second
 * styling system just to render simple boxes, stacks, and buttons.
 */

type ResponsiveValue = string | number | Record<string, string | number>

type ResponsiveBreakpoint = 'initial' | 'sm' | 'md' | 'lg' | 'xl'

const RESPONSIVE_BREAKPOINTS: ResponsiveBreakpoint[] = ['initial', 'sm', 'md', 'lg', 'xl']

type PrimitiveProps = {
  ref?: React.Ref<HTMLElement>
  as?: React.ElementType
  asChild?: boolean
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: React.MouseEventHandler<HTMLElement>
  onMouseEnter?: React.MouseEventHandler<HTMLElement>
  onMouseLeave?: React.MouseEventHandler<HTMLElement>
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  size?: ResponsiveValue
  variant?: string
  color?: string
  weight?: string
  highContrast?: boolean
  truncate?: boolean
  align?: ResponsiveValue
  justify?: ResponsiveValue
  direction?: ResponsiveValue
  wrap?: ResponsiveValue
  gap?: ResponsiveValue
  columns?: ResponsiveValue
  grow?: ResponsiveValue
  flexGrow?: ResponsiveValue
  width?: string | number
  height?: string | number
  position?: string
  inset?: string | number
  top?: string | number
  right?: string | number
  bottom?: string | number
  left?: string | number
  display?: string
  m?: ResponsiveValue
  mt?: ResponsiveValue
  mr?: ResponsiveValue
  mb?: ResponsiveValue
  ml?: ResponsiveValue
  mx?: ResponsiveValue
  my?: ResponsiveValue
  p?: ResponsiveValue
  pt?: ResponsiveValue
  pr?: ResponsiveValue
  pb?: ResponsiveValue
  pl?: ResponsiveValue
  px?: ResponsiveValue
  py?: ResponsiveValue
  // The primitive intentionally forwards normal DOM/event props. The named
  // fields above provide useful types for styling props; the index signature
  // keeps polymorphic elements (links, forms, and buttons) ergonomic.
  [key: string]: unknown
}

const spacing: Record<string, string> = {
  '0': '0',
  '1': '0.25rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.5rem',
  '6': '2rem',
  '7': '2.5rem',
  '8': '3rem',
  '9': '4rem',
  '10': '5rem',
  '11': '6rem',
  '12': '8rem',
  auto: 'auto',
}

function toCssValue(value: string | number | undefined): string | number | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'number') return value
  return spacing[value] ?? value
}

function baseResponsive(value: ResponsiveValue | undefined): string | number | undefined {
  if (value && typeof value === 'object') return value.initial ?? Object.values(value)[0]
  return value
}

function isResponsive(value: unknown): value is Record<string, string | number> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function cssVariableName(property: string, breakpoint: ResponsiveBreakpoint): `--cryo-${string}` {
  const suffix = breakpoint === 'initial' ? '' : `-${breakpoint}`
  return `--cryo-${property}${suffix}`
}

function responsiveValue(value: string | number, property: string): string | number {
  if (property === 'grid-template-columns' && typeof value === 'string' && /^\d+$/.test(value)) {
    return `repeat(${value}, minmax(0, 1fr))`
  }
  if (property === 'justify-content' && value === 'between') return 'space-between'
  return toCssValue(value) ?? ''
}

function setResponsiveValue(
  style: React.CSSProperties,
  property: string,
  value: ResponsiveValue,
): boolean {
  if (!isResponsive(value)) return false
  let current = value.initial ?? Object.values(value)[0]
  for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
    const next = value[breakpoint]
    if (next !== undefined) current = next
    if (current !== undefined) style[cssVariableName(property, breakpoint) as keyof React.CSSProperties] = responsiveValue(current, property) as never
  }
  return true
}

function cleanPrimitiveProps(props: PrimitiveProps): Record<string, unknown> {
  const ignored = new Set([
    'as', 'asChild', 'ref', 'size', 'variant', 'color', 'weight', 'highContrast', 'truncate',
    'accentColor', 'grayColor', 'panelBackground', 'radius', 'scaling',
    'align', 'justify', 'direction', 'wrap', 'gap', 'columns', 'grow', 'flexGrow',
    'position', 'inset', 'top', 'right', 'bottom', 'left', 'display', 'width', 'height',
    'm', 'mt', 'mr', 'mb', 'ml', 'mx', 'my', 'p', 'pt', 'pr', 'pb', 'pl', 'px', 'py',
  ])
  return Object.fromEntries(Object.entries(props).filter(([key]) => !ignored.has(key)))
}

function primitiveStyle(props: PrimitiveProps, extra: React.CSSProperties = {}): React.CSSProperties {
  const style: React.CSSProperties = { ...extra, ...(props.style ?? {}) }
  // CSS custom properties inherit. Reset every responsive slot on each
  // primitive before writing the values supplied by this element; otherwise
  // a child with only `mb`/`size` would accidentally inherit its parent's
  // padding or grid variables at desktop breakpoints.
  const responsiveProperties = [
    'align-items', 'justify-content', 'flex-direction', 'flex-wrap', 'gap',
    'grid-template-columns', 'margin', 'margin-top', 'margin-right',
    'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right',
    'padding-bottom', 'padding-left', 'font-size',
  ]
  const responsiveDefaults: Record<string, string> = {
    // Layout properties use their CSS initial values; font size should keep
    // inheriting the surrounding page scale when a Box/Flex only has a gap or
    // direction breakpoint.
    'font-size': 'inherit',
  }
  if (hasResponsiveProps(props)) {
    for (const property of responsiveProperties) {
      for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
        style[cssVariableName(property, breakpoint) as keyof React.CSSProperties] = (responsiveDefaults[property] ?? 'initial') as never
      }
    }
  }
  const set = (key: keyof React.CSSProperties, value: ResponsiveValue | undefined) => {
    const property = String(key).replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
    if (value !== undefined && setResponsiveValue(style, property, value)) return
    const base = baseResponsive(value)
    if (base !== undefined) style[key] = toCssValue(base) as never
  }

  if (props.gap !== undefined) set('gap', props.gap)
  if (props.align !== undefined) set('alignItems', props.align)
  if (props.justify !== undefined) {
    const value = baseResponsive(props.justify)
    set('justifyContent', value === 'between' ? 'space-between' : value)
  }
  if (props.direction !== undefined) set('flexDirection', props.direction)
  if (props.wrap !== undefined) set('flexWrap', props.wrap)
  if (props.columns !== undefined) {
    set('gridTemplateColumns', props.columns)
  }
  if (props.grow !== undefined || props.flexGrow !== undefined) {
    const value = baseResponsive(props.flexGrow ?? props.grow)
    style.flexGrow = value === '0' ? 0 : Number(value ?? 1)
  }
  if (props.width !== undefined) style.width = toCssValue(props.width) as never
  if (props.height !== undefined) style.height = toCssValue(props.height) as never
  if (props.position !== undefined) style.position = props.position as React.CSSProperties['position']
  if (props.display !== undefined) style.display = props.display as React.CSSProperties['display']
  if (props.inset !== undefined) style.inset = toCssValue(props.inset) as never
  if (props.top !== undefined) style.top = toCssValue(props.top) as never
  if (props.right !== undefined) style.right = toCssValue(props.right) as never
  if (props.bottom !== undefined) style.bottom = toCssValue(props.bottom) as never
  if (props.left !== undefined) style.left = toCssValue(props.left) as never

  const margin = (key: keyof React.CSSProperties, value: ResponsiveValue | undefined) => set(key, value)
  margin('margin', props.m)
  margin('marginTop', props.mt)
  margin('marginRight', props.mr)
  margin('marginBottom', props.mb)
  margin('marginLeft', props.ml)
  if (props.mx !== undefined) {
    margin('marginLeft', props.mx)
    margin('marginRight', props.mx)
  }
  if (props.my !== undefined) {
    margin('marginTop', props.my)
    margin('marginBottom', props.my)
  }
  margin('padding', props.p)
  margin('paddingTop', props.pt)
  margin('paddingRight', props.pr)
  margin('paddingBottom', props.pb)
  margin('paddingLeft', props.pl)
  if (props.px !== undefined) {
    margin('paddingLeft', props.px)
    margin('paddingRight', props.px)
  }
  if (props.py !== undefined) {
    margin('paddingTop', props.py)
    margin('paddingBottom', props.py)
  }
  if (props.truncate) {
    style.overflow = 'hidden'
    style.textOverflow = 'ellipsis'
    style.whiteSpace = 'nowrap'
  }
  if (props.color && style.color === undefined) {
    style.color = ({
      gray: '#94a3b8', red: '#ef4444', blue: '#3b82f6', green: '#10b981',
      yellow: '#fbbf24', purple: '#a855f7', orange: '#f97316',
    } as Record<string, string>)[props.color] ?? props.color
  }
  if (props.size !== undefined && isResponsive(props.size)) {
    const sizeValues = Object.fromEntries(Object.entries(props.size).map(([breakpoint, value]) => [
      breakpoint,
      ({ '1': '0.75rem', '2': '0.875rem', '3': '1rem', '4': '1.125rem', '5': '1.25rem', '6': '1.5rem', '7': '1.75rem', '8': '2.25rem', '9': '3.75rem' }[String(value)] ?? toCssValue(value)),
    ])) as Record<string, string | number>
    set('fontSize', sizeValues)
  }
  return style
}

function hasResponsiveProps(props: PrimitiveProps): boolean {
  return [
    props.size, props.align, props.justify, props.direction, props.wrap, props.gap,
    props.columns, props.grow, props.flexGrow, props.m, props.mt, props.mr, props.mb,
    props.ml, props.mx, props.my, props.p, props.pt, props.pr, props.pb, props.pl,
    props.px, props.py,
  ].some(isResponsive)
}

function mergeClassNames(...names: Array<string | undefined>): string | undefined {
  const value = names.filter(Boolean).join(' ')
  return value || undefined
}

function Primitive({
  as = 'div',
  asChild,
  ref,
  children,
  className,
  style,
  ...props
}: PrimitiveProps) {
  const Component = as
  const nextProps = {
    ...cleanPrimitiveProps(props),
    ref,
    className,
    style: primitiveStyle({ ...props, style }),
    ...(hasResponsiveProps(props) ? { 'data-cryo-responsive': 'true' } : {}),
  }
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>
    const childProps = child.props
    return React.cloneElement(child, {
      ...nextProps,
      className: mergeClassNames(typeof childProps.className === 'string' ? childProps.className : undefined, className),
      style: { ...(childProps.style as React.CSSProperties | undefined), ...nextProps.style },
    } as Partial<Record<string, unknown>>)
  }
  return React.createElement(
    Component,
    nextProps,
    children,
  )
}

export const Box = React.forwardRef<HTMLElement, PrimitiveProps>((props, ref) => (
  <Primitive {...props} ref={ref as never} />
))
Box.displayName = 'Box'

export const Container = React.forwardRef<HTMLElement, PrimitiveProps>(({ size = '4', style, ...props }, ref) => {
  const typedProps = props as PrimitiveProps
  const containerSize = typeof size === 'string' ? size : '4'
  return (
    <Primitive
      {...props}
      ref={ref as never}
      className={mergeClassNames('cryo-container', typedProps.className)}
      style={primitiveStyle({ ...typedProps, style: style as React.CSSProperties | undefined }, {
        width: '90%',
        maxWidth: containerSize === '1' ? '480px' : containerSize === '2' ? '640px' : containerSize === '3' ? '960px' : '1440px',
        marginInline: 'auto',
      })}
    />
  )
})
Container.displayName = 'Container'

export const Flex = React.forwardRef<HTMLElement, PrimitiveProps>(({ style, ...props }, ref) => {
  const typedProps = props as PrimitiveProps
  return <Primitive {...props} ref={ref as never} className={mergeClassNames('cryo-flex', typedProps.className)} style={primitiveStyle({ ...typedProps, style: style as React.CSSProperties | undefined }, { display: 'flex' })} />
})
Flex.displayName = 'Flex'

export const Grid = React.forwardRef<HTMLElement, PrimitiveProps>(({ style, ...props }, ref) => {
  const typedProps = props as PrimitiveProps
  return <Primitive {...props} ref={ref as never} className={mergeClassNames('cryo-grid', typedProps.className)} style={primitiveStyle({ ...typedProps, style: style as React.CSSProperties | undefined }, { display: 'grid' })} />
})
Grid.displayName = 'Grid'

export const Text = React.forwardRef<HTMLElement, PrimitiveProps>(({ as = 'span', style, ...props }, ref) => {
  const typedProps = props as PrimitiveProps
  const element = (as || 'span') as React.ElementType
  const baseSize = baseResponsive(typedProps.size)
  return (
    <Primitive
      {...props}
      as={element}
      ref={ref as never}
      className={mergeClassNames('cryo-text', typedProps.className)}
      style={primitiveStyle({ ...typedProps, style: style as React.CSSProperties | undefined }, {
        fontSize: typeof typedProps.size === 'object'
          ? undefined
          : toCssValue(baseSize) === undefined
          ? undefined
          : ({ '1': '0.75rem', '2': '0.875rem', '3': '1rem', '4': '1.125rem', '5': '1.25rem', '6': '1.5rem', '7': '1.75rem', '8': '2.25rem', '9': '3.75rem' }[String(baseSize)] ?? toCssValue(baseSize)) as never,
        fontWeight: typedProps.weight === 'bold' ? 700 : typedProps.weight === 'medium' ? 500 : undefined,
      })}
    />
  )
})
Text.displayName = 'Text'

export const Heading = React.forwardRef<HTMLElement, PrimitiveProps>(({ as = 'h2', style, ...props }, ref) => {
  const typedProps = props as PrimitiveProps
  const baseSize = baseResponsive(typedProps.size)
  const headingStyle: React.CSSProperties = {
    marginBlock: 0,
    ...(typeof typedProps.size === 'object' || baseSize === undefined
      ? {}
      : { fontSize: ({ '1': '0.75rem', '2': '0.875rem', '3': '1rem', '4': '1.125rem', '5': '1.25rem', '6': '1.5rem', '7': '1.75rem', '8': '2.25rem', '9': '3.75rem' }[String(baseSize)] ?? toCssValue(baseSize)) as never }),
  }
  return <Primitive {...props} as={as as React.ElementType} ref={ref as never} className={mergeClassNames('cryo-heading', typedProps.className)} style={primitiveStyle({ ...typedProps, style: style as React.CSSProperties | undefined }, headingStyle)} />
})
Heading.displayName = 'Heading'

export const Card = React.forwardRef<HTMLElement, PrimitiveProps>(({ style, ...props }, ref) => {
  const typedProps = props as PrimitiveProps
  return <Primitive {...props} ref={ref as never} className={mergeClassNames('cryo-card', typedProps.className)} style={primitiveStyle({ ...typedProps, style: style as React.CSSProperties | undefined }, { borderRadius: '0.75rem' })} />
})
Card.displayName = 'Card'

export const Badge = React.forwardRef<HTMLElement, PrimitiveProps>(({ style, ...props }, ref) => {
  const typedProps = props as PrimitiveProps
  return <Primitive {...props} ref={ref as never} className={mergeClassNames('cryo-badge', typedProps.className)} style={primitiveStyle({ ...typedProps, style: style as React.CSSProperties | undefined }, { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', borderRadius: 999, padding: '0.2rem 0.55rem', fontSize: '0.75rem' })} />
})
Badge.displayName = 'Badge'

export const Button = React.forwardRef<HTMLElement, PrimitiveProps>(({ asChild, children, style, ...props }, ref) => {
  const typedProps = props as PrimitiveProps
  const baseSize = baseResponsive(typedProps.size)
  const buttonSize = String(baseSize ?? '2')
  const nextProps = {
    ...cleanPrimitiveProps(typedProps),
    ref,
    className: mergeClassNames('cryo-button', typedProps.className),
    style: primitiveStyle({ ...typedProps, style: style as React.CSSProperties | undefined }, {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      whiteSpace: 'nowrap',
      fontWeight: 500,
      textDecoration: 'none',
      cursor: 'pointer',
      minHeight: buttonSize === '1' ? '2rem' : buttonSize === '3' ? '2.75rem' : '2.5rem',
      paddingInline: buttonSize === '1' ? '0.65rem' : buttonSize === '3' ? '1rem' : '0.8rem',
      ...(isResponsive(typedProps.size)
        ? {}
        : { fontSize: buttonSize === '1' ? '0.75rem' : buttonSize === '3' ? '1rem' : '0.875rem' }),
    }),
    ...(typedProps.variant ? { 'data-variant': typedProps.variant } : {}),
    ...(hasResponsiveProps(typedProps) ? { 'data-cryo-responsive': 'true' } : {}),
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>
    const childProps = child.props
    return React.cloneElement(child, {
      ...nextProps,
      className: mergeClassNames(typeof childProps.className === 'string' ? childProps.className : undefined, nextProps.className),
      style: { ...(childProps.style as React.CSSProperties | undefined), ...nextProps.style },
    } as Partial<Record<string, unknown>>)
  }
  return React.createElement('button', { type: 'button', ...nextProps }, children as React.ReactNode)
})
Button.displayName = 'Button'

export const Separator = React.forwardRef<HTMLElement, PrimitiveProps>(({ style, ...props }, ref) => {
  const typedProps = props as PrimitiveProps
  return <Primitive {...props} as="div" ref={ref as never} role="separator" className={mergeClassNames('cryo-separator', typedProps.className)} style={primitiveStyle({ ...typedProps, style: style as React.CSSProperties | undefined }, { height: 1, width: '100%', backgroundColor: 'rgba(148, 163, 184, 0.25)' })} />
})
Separator.displayName = 'Separator'

export const Skeleton = React.forwardRef<HTMLElement, PrimitiveProps>(({ style, ...props }, ref) => {
  const typedProps = props as PrimitiveProps
  return <Primitive {...props} ref={ref as never} aria-hidden="true" className={mergeClassNames('cryo-skeleton', typedProps.className)} style={primitiveStyle({ ...typedProps, style: style as React.CSSProperties | undefined }, { minHeight: 12, borderRadius: '0.35rem', backgroundColor: '#334155' })} />
})
Skeleton.displayName = 'Skeleton'

export const Inset = React.forwardRef<HTMLElement, PrimitiveProps>((props, ref) => (
  <Primitive {...props} ref={ref as never} />
))
Inset.displayName = 'Inset'

export function Theme({ children, style, ...props }: PrimitiveProps) {
  const scaling = typeof props.scaling === 'string' && /^\d+(?:\.\d+)?%$/.test(props.scaling)
    ? props.scaling
    : '100%'
  return (
    <div
      {...cleanPrimitiveProps(props)}
      className={mergeClassNames('cryo-theme', props.className)}
      style={{
        colorScheme: 'dark',
        fontSize: scaling,
        '--cryo-scale': scaling,
        '--font-size-2': '0.875rem',
        '--font-size-3': '1rem',
        '--font-size-4': '1.125rem',
        '--font-size-6': '1.5rem',
        '--font-size-7': '1.75rem',
        '--font-size-8': '2.25rem',
        '--font-size-9': '3rem',
        '--space-2': '0.5rem',
        '--space-6': '2rem',
        '--space-8': '4rem',
        '--radius-2': '0.5rem',
        '--radius-3': '0.75rem',
        '--radius-5': '1.5rem',
        '--blue-a4': 'rgba(59, 130, 246, 0.16)',
        '--blue-a5': 'rgba(59, 130, 246, 0.24)',
        '--indigo-a4': 'rgba(99, 102, 241, 0.16)',
        '--slate-a3': 'rgba(148, 163, 184, 0.12)',
        ...style,
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
