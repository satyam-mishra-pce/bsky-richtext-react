import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import type { RichTextRecord, MentionFeature, LinkFeature, TagFeature } from '../../types/facets'
import { isMentionFeature, isLinkFeature, isTagFeature } from '../../types/facets'
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
}

// ─── Default Renderers ───────────────────────────────────────────────────────

function DefaultMentionRenderer({
  text,
  did,
  linkProps,
}: MentionProps & { linkProps?: AnchorHTMLAttributes<HTMLAnchorElement> }) {
  return (
    <a
      href={`https://bsky.app/profile/${did}`}
      target="_blank"
      rel="noopener noreferrer"
      data-did={did}
      {...linkProps}
    >
      {text}
    </a>
  )
}

function DefaultLinkRenderer({
  text,
  uri,
  linkProps,
}: LinkProps & { linkProps?: AnchorHTMLAttributes<HTMLAnchorElement> }) {
  return (
    <a href={uri} target="_blank" rel="noopener noreferrer" {...linkProps}>
      {toShortUrl(text)}
    </a>
  )
}

function DefaultTagRenderer({
  text,
  tag,
  linkProps,
}: TagProps & { linkProps?: AnchorHTMLAttributes<HTMLAnchorElement> }) {
  return (
    <a
      href={`https://bsky.app/hashtag/${encodeURIComponent(tag)}`}
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
 * @example
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
 */
export function RichTextDisplay({
  value,
  renderMention,
  renderLink,
  renderTag,
  disableLinks = false,
  linkProps,
  ...spanProps
}: RichTextDisplayProps) {
  // Normalise plain string input into a RichTextRecord
  const record: RichTextRecord = typeof value === 'string' ? { text: value } : value

  const segments = useRichText(record)

  const children: ReactNode[] = segments.map((segment, index) => {
    const { text, feature } = segment

    if (!feature || disableLinks) {
      return text
    }

    if (isMentionFeature(feature)) {
      if (renderMention) {
        return (
          <span key={index} data-bsky-mention>
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
          {...(linkProps !== undefined ? { linkProps } : {})}
        />
      )
    }

    if (isLinkFeature(feature)) {
      if (renderLink) {
        return (
          <span key={index} data-bsky-link>
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
          {...(linkProps !== undefined ? { linkProps } : {})}
        />
      )
    }

    if (isTagFeature(feature)) {
      if (renderTag) {
        return (
          <span key={index} data-bsky-tag>
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
          {...(linkProps !== undefined ? { linkProps } : {})}
        />
      )
    }

    // Unknown feature type — render plain text as fallback
    return text
  })

  return (
    <span data-bsky-richtext {...spanProps}>
      {children}
    </span>
  )
}
