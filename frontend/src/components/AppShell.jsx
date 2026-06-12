// frontend/src/components/AppShell.jsx
import Topbar from './Topbar'
import Sidebar from './Sidebar'

export default function AppShell({ sidebarItems, children }) {
  return (
    <div className="flex flex-col h-screen bg-terra-bg dark:bg-[#0f1a0f]">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={sidebarItems} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
