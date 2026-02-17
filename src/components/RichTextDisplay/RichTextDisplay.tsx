import { useMemo, type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'
import type { RichTextRecord, MentionFeature, LinkFeature, TagFeature } from '../../types/facets'
import { isMentionFeature, isLinkFeature, isTagFeature } from '../../types/facets'
import type { DisplayClassNames } from '../../types/classNames'
import { defaultDisplayClassNames } from '../../defaults/classNames'
import { generateClassNames } from '../../utils/classNames'
import { useRichText } from '../../hooks/useRichText'
import { toShortUrl } from '../../utils/url'

// ─── Render Prop Types ───────────────────────────────────────────────────────

export interface MentionProps {
  /** The raw segment text (e.g. "@alice.bsky.social") */
  text: string
  /** The resolved DID of the mentioned account */
  did: string
  /** The mention facet feature */
  feature: MentionFeature
}

export interface LinkProps {
  /** The display text for the link (may be shortened) */
  text: string
  /** The full URL */
  uri: string
  /** The link facet feature */
  feature: LinkFeature
}

export interface TagProps {
  /** The display text including '#' (e.g. "#atproto") */
  text: string
  /** The tag value without '#' prefix (e.g. "atproto") */
  tag: string
  /** The tag facet feature */
  feature: TagFeature
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface RichTextDisplayProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /**
   * The richtext record to render.
   * Accepts `{ text, facets? }` — i.e. the raw AT Protocol record fields.
   */
  value: RichTextRecord | string

  /**
   * Custom renderer for @mention segments.
   * If not provided, renders a plain `<a>` linking to the profile.
   */
  renderMention?: (props: MentionProps) => ReactNode

  /**
   * Custom renderer for link segments.
   * If not provided, renders a plain `<a>` with the shortened URL as text.
   */
  renderLink?: (props: LinkProps) => ReactNode

  /**
   * Custom renderer for #hashtag segments.
   * If not provided, renders a plain `<a>` linking to the hashtag search.
   */
  renderTag?: (props: TagProps) => ReactNode

  /**
   * When true, all interactive facets (mentions, links, tags) are rendered
   * as plain text with no anchor elements.
   * @default false
   */
  disableLinks?: boolean

  /**
   * Props forwarded to every `<a>` element rendered by the default renderers.
   * Ignored when custom `renderMention` / `renderLink` / `renderTag` are used.
   */
  linkProps?: AnchorHTMLAttributes<HTMLAnchorElement>

  /**
   * CSS class names for each styleable part of the component.
   *
   * Use `generateClassNames()` to cleanly merge with the built-in defaults:
   * @example
   * ```tsx
   * import { generateClassNames, defaultDisplayClassNames } from 'bsky-richtext-react'
   *
   * <RichTextDisplay
   *   classNames={generateClassNames([
   *     defaultDisplayClassNames,
   *     { mention: 'text-blue-500 hover:underline' },
   *   ], cn)}
   * />
   * ```
   *
   * Or pass a completely custom object to opt out of the defaults entirely:
   * ```tsx
   * <RichTextDisplay classNames={{ root: 'my-richtext', mention: 'my-mention' }} />
   * ```
   */
  classNames?: Partial<DisplayClassNames>

  /**
   * Generate the `href` for @mention anchors.
   * Called with the mention's DID.
   * @default (did) => `https://bsky.app/profile/${did}`
   *
   * @example Route mentions to your own profile pages
   * ```tsx
   * mentionUrl={(did) => `/profile/${did}`}
   * ```
   */
  mentionUrl?: (did: string) => string

  /**
   * Generate the `href` for #hashtag anchors.
   * Called with the tag value (without the '#' prefix).
   * @default (tag) => `https://bsky.app/hashtag/${encodeURIComponent(tag)}`
   *
   * @example Route hashtags to your own search page
   * ```tsx
   * tagUrl={(tag) => `/search?tag=${encodeURIComponent(tag)}`}
   * ```
   */
  tagUrl?: (tag: string) => string

  /**
   * Transform a link URI before it is used as the anchor's `href`.
   * Useful for proxying external links or adding UTM parameters.
   * @default (uri) => uri  (identity — no transformation)
   *
   * @example Add a referral parameter
   * ```tsx
   * linkUrl={(uri) => `${uri}?ref=myapp`}
   * ```
   */
  linkUrl?: (uri: string) => string
}

// ─── Default Renderers ───────────────────────────────────────────────────────

interface DefaultMentionRendererProps extends MentionProps {
  mentionUrl?: (did: string) => string
  mentionClass?: string
  linkProps?: AnchorHTMLAttributes<HTMLAnchorElement>
}

function DefaultMentionRenderer({
  text,
  did,
  mentionUrl,
  mentionClass,
  linkProps,
}: DefaultMentionRendererProps) {
  const href = mentionUrl?.(did) ?? `https://bsky.app/profile/${did}`
  return (
    <a
      href={href}
      className={mentionClass}
      target="_blank"
      rel="noopener noreferrer"
      data-did={did}
      {...linkProps}
    >
      {text}
    </a>
  )
}

interface DefaultLinkRendererProps extends LinkProps {
  linkUrl?: (uri: string) => string
  linkClass?: string
  linkProps?: AnchorHTMLAttributes<HTMLAnchorElement>
}

function DefaultLinkRenderer({
  text,
  uri,
  linkUrl,
  linkClass,
  linkProps,
}: DefaultLinkRendererProps) {
  const href = linkUrl?.(uri) ?? uri
  return (
    <a
      href={href}
      className={linkClass}
      target="_blank"
      rel="noopener noreferrer"
      {...linkProps}
    >
      {toShortUrl(text)}
    </a>
  )
}

interface DefaultTagRendererProps extends TagProps {
  tagUrl?: (tag: string) => string
  tagClass?: string
  linkProps?: AnchorHTMLAttributes<HTMLAnchorElement>
}

function DefaultTagRenderer({
  text,
  tag,
  tagUrl,
  tagClass,
  linkProps,
}: DefaultTagRendererProps) {
  const href =
    tagUrl?.(tag) ?? `https://bsky.app/hashtag/${encodeURIComponent(tag)}`
  return (
    <a
      href={href}
      className={tagClass}
      target="_blank"
      rel="noopener noreferrer"
      data-tag={tag}
      {...linkProps}
    >
      {text}
    </a>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `RichTextDisplay` renders AT Protocol richtext content — a string with
 * optional `facets` that annotate byte ranges as mentions, links, or hashtags.
 *
 * @example Basic usage
 * ```tsx
 * <RichTextDisplay value={{ text: post.text, facets: post.facets }} />
 * ```
 *
 * @example With custom mention renderer
 * ```tsx
 * <RichTextDisplay
 *   value={post}
 *   renderMention={({ text, did }) => (
 *     <Link to={`/profile/${did}`}>{text}</Link>
 *   )}
 * />
 * ```
 *
 * @example With URL resolvers pointing to your own routes
 * ```tsx
 * <RichTextDisplay
 *   value={post}
 *   mentionUrl={(did) => `/profile/${did}`}
 *   tagUrl={(tag) => `/search?tag=${tag}`}
 * />
 * ```
 *
 * @example With classNames (using generateClassNames for clean merging)
 * ```tsx
 * import { generateClassNames, defaultDisplayClassNames } from 'bsky-richtext-react'
 *
 * <RichTextDisplay
 *   value={post}
 *   classNames={generateClassNames([
 *     defaultDisplayClassNames,
 *     { mention: 'text-blue-500 font-semibold' },
 *   ], cn)}
 * />
 * ```
 */
export function RichTextDisplay({
  value,
  renderMention,
  renderLink,
  renderTag,
  disableLinks = false,
  linkProps,
  classNames: classNamesProp,
  mentionUrl,
  tagUrl,
  linkUrl,
  ...spanProps
}: RichTextDisplayProps) {
  // Normalise plain string input into a RichTextRecord
  const record: RichTextRecord = typeof value === 'string' ? { text: value } : value

  // Merge provided classNames with defaults.
  // Memoized via JSON.stringify so inline object literals don't recalculate every render.
  const cn = useMemo(
    () => generateClassNames([defaultDisplayClassNames, classNamesProp]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(classNamesProp)],
  )

  const segments = useRichText(record)

  const children: ReactNode[] = segments.map((segment, index) => {
    const { text, feature } = segment

    if (!feature || disableLinks) {
      return text
    }

    if (isMentionFeature(feature)) {
      if (renderMention) {
        return (
          <span key={index} className={cn.mention}>
            {renderMention({ text, did: feature.did, feature })}
          </span>
        )
      }
      return (
        <DefaultMentionRenderer
          key={index}
          text={text}
          did={feature.did}
          feature={feature}
          {...(mentionUrl !== undefined ? { mentionUrl } : {})}
          {...(cn.mention !== undefined ? { mentionClass: cn.mention } : {})}
          {...(linkProps !== undefined ? { linkProps } : {})}
        />
      )
    }

    if (isLinkFeature(feature)) {
      if (renderLink) {
        return (
          <span key={index} className={cn.link}>
            {renderLink({ text, uri: feature.uri, feature })}
          </span>
        )
      }
      return (
        <DefaultLinkRenderer
          key={index}
          text={text}
          uri={feature.uri}
          feature={feature}
          {...(linkUrl !== undefined ? { linkUrl } : {})}
          {...(cn.link !== undefined ? { linkClass: cn.link } : {})}
          {...(linkProps !== undefined ? { linkProps } : {})}
        />
      )
    }

    if (isTagFeature(feature)) {
      if (renderTag) {
        return (
          <span key={index} className={cn.tag}>
            {renderTag({ text, tag: feature.tag, feature })}
          </span>
        )
      }
      return (
        <DefaultTagRenderer
          key={index}
          text={text}
          tag={feature.tag}
          feature={feature}
          {...(tagUrl !== undefined ? { tagUrl } : {})}
          {...(cn.tag !== undefined ? { tagClass: cn.tag } : {})}
          {...(linkProps !== undefined ? { linkProps } : {})}
        />
      )
    }

    // Unknown feature type — render plain text as fallback
    return text
  })

  return (
    <span className={cn.root} {...spanProps}>
      {children}
    </span>
  )
}
