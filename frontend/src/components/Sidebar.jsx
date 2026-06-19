// frontend/src/components/Sidebar.jsx
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar({ items }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{ width: expanded ? 200 : 56, transition: 'width 200ms ease' }}
      className="flex-shrink-0 bg-terra-dark flex flex-col gap-1 py-4 overflow-hidden"
    >
      {items.map(({ icon: Icon, label, to }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `flex items-center gap-3 mx-2 px-2 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap
            ${isActive
              ? 'bg-terra-forest text-terra-light'
              : 'text-terra-medium hover:bg-terra-forest hover:text-terra-light'
            }`
          }
        >
          <Icon size={18} className="flex-shrink-0" />
          <span
            style={{
              opacity: expanded ? 1 : 0,
              transition: 'opacity 150ms ease',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
        </NavLink>
      ))}
    </aside>
  )
}
