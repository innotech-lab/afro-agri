// frontend/src/components/KpiCard.jsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KpiCard({ value, label, trend, trendDirection }) {
  const TrendIcon =
    trendDirection === 'up' ? TrendingUp :
    trendDirection === 'down' ? TrendingDown : Minus

  const trendColor =
    trendDirection === 'up' ? 'text-terra-medium' :
    trendDirection === 'down' ? 'text-red-500' : 'text-gray-400'

  return (
    <div className="bg-terra-surface dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 flex flex-col gap-1 shadow-sm">
      <span className="text-2xl font-extrabold text-terra-dark dark:text-[#e8f5e4]">
        {value ?? '—'}
      </span>
      <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
        {label}
      </span>
      {trend && (
        <span className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
          <TrendIcon size={12} />
          {trend}
        </span>
      )}
    </div>
  )
}
