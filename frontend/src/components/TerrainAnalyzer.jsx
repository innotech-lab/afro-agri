import { useState, useRef, useCallback, useEffect } from 'react'
import axios from 'axios'
import { Upload, ImagePlus, Loader2, CheckCircle, AlertTriangle, XCircle, RefreshCw, Camera, X, Circle } from 'lucide-react'

export default function TerrainAnalyzer() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const inputRef = useRef()
  const videoRef = useRef()
  const streamRef = useRef()

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError('')
  }

  const openCamera = async () => {
    setCameraError('')
    setCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      setCameraError('Impossible d\'accéder à la caméra. Vérifiez les permissions.')
    }
  }

  const closeCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraOpen(false)
    setCameraError('')
  }, [])

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      handleFile(file)
      closeCamera()
    }, 'image/jpeg', 0.92)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const [coords, setCoords] = useState(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (err) => console.log('GPS init error:', err)
      )
    }
  }, [])

  const handleAnalyse = async () => {
    if (!image) return
    setLoading(true)
    setError('')
    
    let lat = coords?.latitude
    let lon = coords?.longitude

    if (!lat || !lon) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })
        lat = pos.coords.latitude
        lon = pos.coords.longitude
        setCoords({ latitude: lat, longitude: lon })
      } catch (e) {
        console.warn('Could not get geolocation dynamically', e)
      }
    }

    try {
      const form = new FormData()
      form.append('image', image)
      form.append('nom_plante', 'terrain')
      form.append('stade', 'analyse_achat')
      if (lat !== undefined && lon !== undefined) {
        form.append('latitude', lat)
        form.append('longitude', lon)
      }
      
      const { data } = await axios.post('/api/diagnostic/analyser/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      
      const ia = data.ia_analysis || {}
      const suggestions = data.suggestions_ia || {}
      
      const formattedResult = {
        est_saine: ia.est_saine !== undefined ? ia.est_saine : suggestions.est_saine,
        confiance_pct: `${ia.confiance !== undefined ? ia.confiance : (suggestions.confiance || 0)}%`,
        maladie: ia.maladie || suggestions.maladie_suspecte,
        plante_detectee: ia.plante || suggestions.plante_detectee,
        traitement: ia.traitement || suggestions.traitement_suggere,
        source_open_source: ia.github || suggestions.source || {},
        latitude: data.latitude !== undefined ? data.latitude : lat,
        longitude: data.longitude !== undefined ? data.longitude : lon
      }
      
      setResult(formattedResult)
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

          {/* Camera box — replaces drop zone when active */}
          {cameraOpen ? (
            <div className="rounded-2xl overflow-hidden border border-terra-border dark:border-terra-forest shadow-lg bg-terra-dark">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-terra-dark border-b border-terra-forest">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-terra-light text-xs font-semibold tracking-wide uppercase">
                    Caméra active
                  </span>
                </div>
                <button
                  onClick={closeCamera}
                  className="text-terra-medium hover:text-terra-light p-1 rounded-lg hover:bg-terra-forest transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Video stream */}
              <div className="relative bg-black" style={{ height: 280 }}>
                {cameraError ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
                    <XCircle size={32} className="text-red-400" />
                    <p className="text-terra-medium text-sm text-center">{cameraError}</p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Viewfinder */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative" style={{ width: 180, height: 140 }}>
                        <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-terra-gold rounded-tl" />
                        <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-terra-gold rounded-tr" />
                        <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-terra-gold rounded-bl" />
                        <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-terra-gold rounded-br" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer with shutter */}
              {!cameraError && (
                <div className="flex items-center justify-center gap-4 px-4 py-4 bg-terra-dark">
                  <span className="text-terra-medium text-xs flex-1 text-right">
                    Cadrez le terrain
                  </span>
                  <button
                    onClick={capturePhoto}
                    className="w-12 h-12 rounded-full bg-white border-4 border-terra-gold flex items-center justify-center hover:scale-95 active:scale-90 transition-transform shadow-md"
                    title="Capturer"
                  >
                    <div className="w-6 h-6 rounded-full bg-terra-dark" />
                  </button>
                  <span className="flex-1" />
                </div>
              )}
            </div>
          ) : (
          /* Drop zone */
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
          )}

          {/* Action buttons row */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={openCamera}
              className="flex items-center justify-center gap-2 border-2 border-terra-border dark:border-terra-forest bg-white dark:bg-terra-dark text-terra-dark dark:text-terra-light font-semibold rounded-xl py-3 text-sm hover:border-terra-medium hover:bg-terra-bg dark:hover:bg-terra-forest transition-colors"
            >
              <Camera size={17} />
              Prendre une photo
            </button>

            <button
              onClick={handleAnalyse}
              disabled={!image || loading}
              className="flex items-center justify-center gap-2 bg-terra-dark text-terra-gold font-bold rounded-xl py-3 text-sm hover:bg-terra-forest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 size={17} className="animate-spin" /> Analyse...</>
              ) : (
                <><Upload size={17} /> Analyser ce terrain</>
              )}
            </button>
          </div>

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

          {/* GPS Coordinates & Map */}
          {result.latitude !== undefined && result.longitude !== undefined && (
            <div className="bg-white dark:bg-terra-dark border border-terra-border dark:border-terra-forest rounded-xl p-4 flex flex-col gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                  Coordonnées GPS réelles
                </p>
                <p className="font-bold text-terra-dark dark:text-[#e8f5e4] text-sm">
                  {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                </p>
              </div>
              <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${result.latitude},${result.longitude}&z=13&output=embed`}
                  allowFullScreen
                />
              </div>
            </div>
          )}

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
