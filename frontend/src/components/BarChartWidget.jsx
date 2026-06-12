// frontend/src/components/BarChartWidget.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const COLORS = ['#4a7c59', '#7ec87a', '#d4a843', '#2d5a3d', '#1a2e1a']

export default function BarChartWidget({ title, data, dataKey, nameKey = 'name' }) {
  return (
    <div className="bg-terra-surface dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 shadow-sm">
      {title && (
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-3">
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e8d8" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 10, fill: '#4a7c59' }} />
          <YAxis tick={{ fontSize: 10, fill: '#4a7c59' }} />
          <Tooltip
            contentStyle={{
              background: '#1a2e1a', border: 'none', borderRadius: 8,
              color: '#7ec87a', fontSize: 12,
            }}
          />
          <Bar dataKey={dataKey} fill="#4a7c59" radius={[4, 4, 0, 0]}>
            {data?.map((_, i) => (
              <rect key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
