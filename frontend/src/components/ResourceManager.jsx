import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Download, Pencil, Plus, Search, Trash2, X } from 'lucide-react'

const cardClass = 'bg-terra-surface dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl shadow-sm'
const inputClass = 'w-full rounded-lg border border-terra-border dark:border-terra-forest bg-white dark:bg-terra-forest/30 px-3 py-2 text-sm text-terra-dark dark:text-terra-light outline-none focus:ring-2 focus:ring-terra-light'

function normalize(data) {
  const value = data?.results ?? data ?? []
  return Array.isArray(value) ? value : []
}

function csvValue(value) {
  const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export default function ResourceManager({
  title,
  description,
  endpoint,
  idKey,
  columns,
  fields = [],
  readOnly = false,
  canCreate = !readOnly,
  canEdit = !readOnly,
  canDelete = !readOnly,
  filterData,
  createHref,
}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [options, setOptions] = useState({})
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    setError('')
    axios.get(endpoint)
      .then(({ data }) => {
        const next = normalize(data)
        setRows(filterData ? next.filter(filterData) : next)
      })
      .catch(err => setError(err.response?.data?.detail || 'Impossible de charger les données.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    axios.get(endpoint)
      .then(({ data }) => {
        if (!active) return
        const next = normalize(data)
        setRows(filterData ? next.filter(filterData) : next)
      })
      .catch(err => {
        if (active) setError(err.response?.data?.detail || 'Impossible de charger les données.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [endpoint, filterData])

  useEffect(() => {
    fields.filter(field => field.optionsEndpoint).forEach(field => {
      axios.get(field.optionsEndpoint).then(({ data }) => {
        setOptions(current => ({ ...current, [field.name]: normalize(data) }))
      }).catch(() => {})
    })
  }, [fields])

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(row => columns.some(column =>
      String(column.render ? column.render(row) : row[column.key] ?? '').toLowerCase().includes(needle)
    ))
  }, [rows, query, columns])

  const openCreate = () => {
    setEditing(null)
    setForm(Object.fromEntries(fields.map(field => [field.name, field.defaultValue ?? ''])))
    setModalOpen(true)
  }

  const openEdit = row => {
    setEditing(row)
    setForm(Object.fromEntries(fields.map(field => {
      const value = row[field.name]
      return [field.name, typeof value === 'object' ? value?.[field.valueKey || 'id'] ?? '' : value ?? '']
    })))
    setModalOpen(true)
  }

  const save = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      fields.forEach(field => {
        if (field.type === 'number' && payload[field.name] !== '') payload[field.name] = Number(payload[field.name])
        if (!editing && field.editOnly) delete payload[field.name]
        if (editing && field.createOnly) delete payload[field.name]
        if (editing && field.optionalOnEdit && !payload[field.name]) delete payload[field.name]
      })
      if (editing) await axios.patch(`${endpoint}${editing[idKey]}/`, payload)
      else await axios.post(endpoint, payload)
      setModalOpen(false)
      load()
    } catch (err) {
      const data = err.response?.data
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Enregistrement impossible.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async row => {
    if (!window.confirm('Confirmer la suppression de cet élément ?')) return
    try {
      await axios.delete(`${endpoint}${row[idKey]}/`)
      setRows(current => current.filter(item => item[idKey] !== row[idKey]))
    } catch {
      setError('Suppression impossible. Cet élément peut être lié à d’autres données.')
    }
  }

  const exportCsv = () => {
    const content = [
      columns.map(column => csvValue(column.label)).join(','),
      ...visibleRows.map(row => columns.map(column =>
        csvValue(column.render ? column.render(row) : row[column.key])
      ).join(',')),
    ].join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
    link.download = `${title.toLowerCase().replaceAll(' ', '-')}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-terra-dark dark:text-[#e8f5e4]">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-terra-border dark:border-terra-forest text-sm font-semibold text-terra-medium hover:bg-terra-bg dark:hover:bg-terra-forest">
            <Download size={15} /> Exporter CSV
          </button>
          {canCreate && (
            <button onClick={() => createHref ? window.location.assign(createHref) : openCreate()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-terra-dark text-terra-gold text-sm font-semibold hover:bg-terra-forest">
              <Plus size={15} /> Ajouter
            </button>
          )}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className={`${cardClass} overflow-hidden`}>
        <div className="p-4 border-b border-terra-border dark:border-terra-forest">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher..." className={`${inputClass} pl-9`} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-terra-bg dark:bg-terra-forest/30 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {columns.map(column => <th key={column.key || column.label} className="px-4 py-3 font-semibold">{column.label}</th>)}
                {(canEdit || canDelete) && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-terra-border dark:divide-terra-forest">
              {loading ? (
                <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center text-gray-400">Chargement...</td></tr>
              ) : visibleRows.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center text-gray-400">Aucune donnée disponible</td></tr>
              ) : visibleRows.map(row => (
                <tr key={row[idKey]} className="hover:bg-terra-bg/60 dark:hover:bg-terra-forest/20">
                  {columns.map(column => (
                    <td key={column.key || column.label} className="px-4 py-3 text-terra-dark dark:text-[#e8f5e4] whitespace-nowrap">
                      {column.render ? column.render(row) : row[column.key] ?? '—'}
                    </td>
                  ))}
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {canEdit && <button onClick={() => openEdit(row)} title="Modifier" className="p-2 rounded-lg text-terra-medium hover:bg-terra-bg dark:hover:bg-terra-forest"><Pencil size={15} /></button>}
                        {canDelete && <button onClick={() => remove(row)} title="Supprimer" className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-terra-border dark:border-terra-forest text-xs text-gray-500">
          {visibleRows.length} élément{visibleRows.length !== 1 ? 's' : ''}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={save} className={`${cardClass} w-full max-w-lg max-h-[90vh] overflow-y-auto p-5`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-terra-dark dark:text-terra-light">{editing ? 'Modifier' : 'Ajouter'} — {title}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-gray-400"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.filter(field => !(editing && field.createOnly) && !(!editing && field.editOnly)).map(field => (
                <label key={field.name} className={field.fullWidth ? 'sm:col-span-2' : ''}>
                  <span className="block text-xs font-semibold text-gray-500 mb-1.5">{field.label}</span>
                  {field.type === 'select' ? (
                    <select required={field.required !== false} value={form[field.name] ?? ''} onChange={event => setForm(current => ({ ...current, [field.name]: event.target.value }))} className={inputClass}>
                      <option value="">Sélectionner</option>
                      {(field.options || options[field.name] || []).map(option => (
                        <option key={option[field.optionValue || 'value']} value={option[field.optionValue || 'value']}>
                          {option[field.optionLabel || 'label']}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea rows="3" required={field.required !== false} value={form[field.name] ?? ''} onChange={event => setForm(current => ({ ...current, [field.name]: event.target.value }))} className={inputClass} />
                  ) : (
                    <input type={field.type || 'text'} step={field.step} required={field.required !== false && !(editing && field.optionalOnEdit)} value={form[field.name] ?? ''} onChange={event => setForm(current => ({ ...current, [field.name]: event.target.value }))} className={inputClass} />
                  )}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-terra-border text-sm font-semibold text-gray-500">Annuler</button>
              <button disabled={saving} className="px-4 py-2 rounded-lg bg-terra-dark text-terra-gold text-sm font-semibold disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
