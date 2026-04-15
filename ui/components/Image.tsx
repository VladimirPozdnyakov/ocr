'use client'

import { useEffect, useRef, useState } from 'react'
import {
  cancelObjectUrlRevoke,
  convertToBlob,
  revokeObjectUrlLater,
} from '@/lib/util'

type ImageProps = {
  data?: Uint8Array
  visible?: boolean
  opacity?: number
  transition?: boolean
  dataKey?: string | number
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'>

const FADE_DURATION_MS = 180

export function Image({
  data,
  visible = true,
  opacity = 1,
  transition = true,
  dataKey,
  style,
  alt = '',
  ...props
}: ImageProps) {
  const dataDep = dataKey ?? data
  const [src, setSrc] = useState<string | undefined>()
  const [incoming, setIncoming] = useState<string | undefined>()
  const srcRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!dataDep || !data) {
      revokeObjectUrlLater(srcRef.current)
      srcRef.current = undefined
      setSrc(undefined)
      setIncoming(undefined)
      return
    }

    const blob = convertToBlob(data)
    const url = URL.createObjectURL(blob)
    cancelObjectUrlRevoke(url)

    if (!transition) {
      revokeObjectUrlLater(srcRef.current)
      srcRef.current = url
      setSrc(url)
      setIncoming(undefined)
      return () => {
        revokeObjectUrlLater(url)
        if (srcRef.current === url) srcRef.current = undefined
      }
    }

    let cancelled = false
    const preload = new window.Image()
    preload.onload = () => {
      if (cancelled) {
        revokeObjectUrlLater(url)
        return
      }
      if (!srcRef.current) {
        srcRef.current = url
        cancelObjectUrlRevoke(url)
        setSrc(url)
      } else {
        cancelObjectUrlRevoke(url)
        setIncoming(url)
      }
    }
    preload.src = url

    return () => {
      cancelled = true
      if (srcRef.current !== url) {
        revokeObjectUrlLater(url)
      }
    }
  }, [data, dataDep, transition])

  const promoteIncoming = () => {
    if (!incoming) return
    revokeObjectUrlLater(srcRef.current)
    srcRef.current = incoming
    setSrc(incoming)
    setIncoming(undefined)
  }

  useEffect(() => {
    return () => {
      revokeObjectUrlLater(srcRef.current)
    }
  }, [])

  if (!visible) return null

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    userSelect: 'none',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    ...style,
  }

  if (!transition) {
    if (!src) return null
    return (
      <img
        {...props}
        alt={alt}
        src={src}
        draggable={false}
        style={{ ...baseStyle, opacity }}
      />
    )
  }

  if (!src && !incoming) return null

  return (
    <>
      {src && (
        <img
          {...props}
          alt={alt}
          src={src}
          draggable={false}
          style={{
            ...baseStyle,
            opacity: incoming ? 0 : opacity,
            transition: incoming
              ? `opacity ${FADE_DURATION_MS}ms ease`
              : undefined,
          }}
        />
      )}
      {incoming && (
        <img
          {...props}
          alt={alt}
          src={incoming}
          draggable={false}
          onAnimationEnd={promoteIncoming}
          style={{
            ...baseStyle,
            opacity,
            animation: `image-crossfade-in ${FADE_DURATION_MS}ms ease`,
          }}
        />
      )}
    </>
  )
}
