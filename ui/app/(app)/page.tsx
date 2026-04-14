'use client'

import dynamic from 'next/dynamic'
import { ActivityBubble } from '@/components/ActivityBubble'
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import {
  PanelLoadingSkeleton,
  CanvasLoadingSkeleton,
  NavigatorLoadingSkeleton,
} from '@/components/ui/loading-skeleton'
import { NavigatorErrorBoundary } from '@/components/errors/NavigatorErrorBoundary'
import { CanvasErrorBoundary } from '@/components/errors/CanvasErrorBoundary'
import { PanelsErrorBoundary } from '@/components/errors/PanelsErrorBoundary'

// Lazy load heavy components for better performance
const Panels = dynamic(
  () => import('@/components/Panels').then((m) => ({ default: m.Panels })),
  {
    loading: () => <PanelLoadingSkeleton />,
    ssr: false,
  }
)

const Workspace = dynamic(
  () => import('@/components/Canvas').then((m) => ({ default: m.Workspace })),
  {
    loading: () => <CanvasLoadingSkeleton />,
    ssr: false,
  }
)

const StatusBar = dynamic(
  () => import('@/components/Canvas').then((m) => ({ default: m.StatusBar })),
  {
    loading: () => <div className='h-6 bg-border/20 animate-pulse' />,
    ssr: false,
  }
)

const Navigator = dynamic(
  () => import('@/components/Navigator').then((m) => ({ default: m.Navigator })),
  {
    loading: () => <NavigatorLoadingSkeleton />,
    ssr: false,
  }
)

const LAYOUT_ID = 'koharu-main-layout-v2'

export default function Page() {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: LAYOUT_ID,
    panelIds: ['left', 'center', 'right'],
  })

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <ActivityBubble />
      <Group
        orientation='horizontal'
        id={LAYOUT_ID}
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
        className='flex min-h-0 flex-1'
      >
        <Panel id='left' defaultSize={220} minSize={160} maxSize={360}>
          <NavigatorErrorBoundary>
            <Navigator />
          </NavigatorErrorBoundary>
        </Panel>
        <Separator className='bg-border/40 hover:bg-border w-1 transition-colors' />
        <Panel id='center' minSize={480}>
          <CanvasErrorBoundary>
            <div className='flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
              <Workspace />
              <StatusBar />
            </div>
          </CanvasErrorBoundary>
        </Panel>
        <Separator className='bg-border/40 hover:bg-border w-1 transition-colors' />
        <Panel id='right' defaultSize={320} minSize={320} maxSize={460}>
          <PanelsErrorBoundary>
            <Panels />
          </PanelsErrorBoundary>
        </Panel>
      </Group>
    </div>
  )
}
