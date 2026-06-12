import { useState, useRef } from 'react'
import axios from 'axios'
import { Upload, ImagePlus, Loader2, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'

export default function TerrainAnalyzer() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleAnalyse = async () => {
    if (!image) return
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('image', image)
      form.append('nom_plante', 'terrain')
      form.append('stade', 'analyse_achat')
      const { data } = await axios.post('/api/diagnostic/analyser/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data.details)
    } catch (err) {
      setError(err.response?.data?.error ?? 'Erreur lors de l\'analyse. Vérifiez que le backend est lancé.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setImage(null)
    setPreview(null)
    setResult(null)
    setError('')
  }

  const HealthIcon = result?.est_saine
    ? CheckCircle
    : result?.est_saine === false
      ? XCircle
      : AlertTriangle

  const healthColor = result?.est_saine
    ? 'text-green-600'
    : result?.est_saine === false
      ? 'text-red-600'
      : 'text-yellow-500'

  const healthBg = result?.est_saine
    ? 'bg-green-50 border-green-200'
    : result?.est_saine === false
      ? 'bg-red-50 border-red-200'
      : 'bg-yellow-50 border-yellow-200'

  const healthLabel = result?.est_saine
    ? 'Terrain sain'
    : result?.est_saine === false
      ? 'Problème détecté'
      : 'Analyse incertaine'

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!result ? (
        <div className="flex flex-col gap-5">
          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden
              ${dragging
                ? 'border-terra-light bg-terra-forest/10 scale-[1.01]'
                : 'border-terra-border dark:border-terra-forest hover:border-terra-medium dark:hover:border-terra-light bg-white dark:bg-terra-dark'
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleFile(e.target.files[0])}
            />

            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Aperçu terrain"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
                  <span className="text-white text-sm font-medium">
                    Cliquez pour changer l'image
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 gap-3">
                <div className="w-16 h-16 bg-terra-bg dark:bg-terra-forest rounded-2xl flex items-center justify-center">
                  <ImagePlus size={28} className="text-terra-medium" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-terra-dark dark:text-[#e8f5e4] text-sm">
                    Déposez une photo du terrain ici
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    ou cliquez pour sélectionner · JPG, PNG, WEBP
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Analyse button */}
          <button
            onClick={handleAnalyse}
            disabled={!image || loading}
            className="flex items-center justify-center gap-2 bg-terra-dark text-terra-gold font-bold rounded-xl py-4 text-sm hover:bg-terra-forest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Analyse en cours...</>
            ) : (
              <><Upload size={18} /> Analyser ce terrain</>
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}
        </div>
      ) : (
        /* Results card */
        <div className="flex flex-col gap-4">
          {/* Verdict banner */}
          <div className={`flex items-center gap-3 border rounded-2xl px-5 py-4 ${healthBg}`}>
            <HealthIcon size={28} className={`flex-shrink-0 ${healthColor}`} />
            <div>
              <div className={`font-extrabold text-lg ${healthColor}`}>{healthLabel}</div>
              <div className="text-gray-600 text-sm mt-0.5">
                Confiance de l'analyse : <strong>{result.confiance_pct}</strong>
              </div>
            </div>
          </div>

          {/* Side by side: image + stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {preview && (
              <img
                src={preview}
                alt="Terrain analysé"
                className="rounded-xl w-full h-40 object-cover border border-terra-border"
              />
            )}

            <div className="flex flex-col gap-3">
              <div className="bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                  Élément détecté
                </p>
                <p className="font-bold text-terra-dark dark:text-[#e8f5e4] text-sm">
                  {result.maladie || result.plante_detectee || 'Aucun problème majeur'}
                </p>
              </div>

              {result.traitement && (
                <div className="bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                    Recommandation
                  </p>
                  <p className="text-terra-dark dark:text-[#e8f5e4] text-sm leading-relaxed">
                    {result.traitement}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Source */}
          {result.source_open_source?.url && (
            <div className="bg-terra-bg dark:bg-terra-forest/30 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 font-medium">
                Source scientifique :{' '}
                <a
                  href={result.source_open_source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terra-medium hover:text-terra-forest underline"
                >
                  {result.source_open_source.url}
                </a>
              </p>
            </div>
          )}

          {/* Reset */}
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 border-2 border-terra-border dark:border-terra-forest text-terra-dark dark:text-terra-light font-semibold rounded-xl py-3 text-sm hover:border-terra-medium hover:bg-terra-bg dark:hover:bg-terra-forest transition-colors"
          >
            <RefreshCw size={16} />
            Analyser un autre terrain
          </button>
        </div>
      )}
    </div>
  )
}
