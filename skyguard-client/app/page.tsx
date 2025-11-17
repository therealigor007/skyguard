'use client'

import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { FilterPanel } from '@/components/filter-panel'
import { Map } from '@/components/map'
import dynamic from 'next/dynamic'

export default function Home() {
  return (
    <main className="w-full h-screen bg-background overflow-hidden">
      <Header />
      <Sidebar />
      <FilterPanel />
      <Map />
    </main>
  )
}
