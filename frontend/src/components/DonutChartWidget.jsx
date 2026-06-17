// frontend/src/components/DonutChartWidget.jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#4a7c59', '#d4a843', '#7ec87a', '#2d5a3d', '#1a2e1a']

export default function DonutChartWidget({ title, data, nameKey = 'name', valueKey = 'value' }) {
  const normalized = data?.map(d => ({ name: d[nameKey], value: d[valueKey] })) ?? []

  return (
    <div className="bg-terra-surface dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 shadow-sm">
      {title && (
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-3">
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={normalized}
            cx="50%" cy="50%"
            innerRadius={45} outerRadius={70}
            paddingAngle={3}
            dataKey="value"
          >
            {normalized.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1a2e1a', border: 'none', borderRadius: 8,
              color: '#7ec87a', fontSize: 12,
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: '#4a7c59' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
