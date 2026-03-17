import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const CATEGORIAS = ['Todas', 'Bebidas', 'Carnes', 'Lácteos', 'Verduras', 'Granos', 'Salsas', 'Postres', 'Otros']

export default function App() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('Todas')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '', categoria: 'Bebidas', cantidad: 0, cantidad_minima: 5, unidad: 'unidades'
  })

  // Cargar productos desde Supabase
  const cargarProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre')
    if (!error) setProductos(data)
    setCargando(false)
  }

  useEffect(() => {
    cargarProductos()

    // Suscripción en tiempo real
    const canal = supabase
      .channel('productos-canal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
        cargarProductos()
      })
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [])

  // Agregar o editar producto
  const guardarProducto = async () => {
    if (!nuevoProducto.nombre.trim()) return
    setGuardando(true)

    if (editando) {
      await supabase.from('productos').update({
        nombre: nuevoProducto.nombre,
        categoria: nuevoProducto.categoria,
        cantidad: Number(nuevoProducto.cantidad),
        cantidad_minima: Number(nuevoProducto.cantidad_minima),
        unidad: nuevoProducto.unidad,
      }).eq('id', editando)
    } else {
      await supabase.from('productos').insert({
        nombre: nuevoProducto.nombre,
        categoria: nuevoProducto.categoria,
        cantidad: Number(nuevoProducto.cantidad),
        cantidad_minima: Number(nuevoProducto.cantidad_minima),
        unidad: nuevoProducto.unidad,
      })
    }

    setNuevoProducto({ nombre: '', categoria: 'Bebidas', cantidad: 0, cantidad_minima: 5, unidad: 'unidades' })
    setEditando(null)
    setMostrarForm(false)
    setGuardando(false)
  }

  // Actualizar cantidad
  const actualizarCantidad = async (id, delta) => {
    const producto = productos.find(p => p.id === id)
    const nuevaCantidad = Math.max(0, producto.cantidad + delta)
    await supabase.from('productos').update({ cantidad: nuevaCantidad }).eq('id', id)
  }

  // Eliminar producto
  const eliminarProducto = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      await supabase.from('productos').delete().eq('id', id)
    }
  }

  // Editar producto
  const abrirEditar = (producto) => {
    setNuevoProducto({ nombre: producto.nombre, categoria: producto.categoria, cantidad: producto.cantidad, cantidad_minima: producto.cantidad_minima, unidad: producto.unidad })
    setEditando(producto.id)
    setMostrarForm(true)
  }

  const productosFiltrados = productos.filter(p => {
    const matchFiltro = filtro === 'Todas' || p.categoria === filtro
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    return matchFiltro && matchBusqueda
  })

  const agotados = productos.filter(p => p.cantidad === 0).length
  const bajos = productos.filter(p => p.cantidad > 0 && p.cantidad <= p.cantidad_minima).length
  const ok = productos.filter(p => p.cantidad > p.cantidad_minima).length

  const getEstado = (p) => {
    if (p.cantidad === 0) return { color: '#ef4444', bg: '#fef2f2', label: '🔴 Agotado' }
    if (p.cantidad <= p.cantidad_minima) return { color: '#f59e0b', bg: '#fffbeb', label: '🟡 Stock bajo' }
    return { color: '#22c55e', bg: '#f0fdf4', label: '🟢 OK' }
  }

  const inputStyle = { width: '100%', padding: '10px 13px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fafafa' }
  const labelStyle = { fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ backgroundColor: '#111827', padding: '18px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#22c55e', borderRadius: '10px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📦</div>
          <div>
            <h1 style={{ color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 }}>Inventario</h1>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>Control de stock en tiempo real</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#6b7280', fontSize: '12px' }}>En vivo</span>
          </div>
          <button onClick={() => { setMostrarForm(!mostrarForm); setEditando(null); setNuevoProducto({ nombre: '', categoria: 'Bebidas', cantidad: 0, cantidad_minima: 5, unidad: 'unidades' }) }}
            style={{ backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
            {mostrarForm ? '✕ Cancelar' : '+ Agregar producto'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '25px 20px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '25px' }}>
          {[
            { label: 'Total productos', valor: productos.length, icon: '📦', color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Stock OK', valor: ok, icon: '✅', color: '#22c55e', bg: '#f0fdf4' },
            { label: 'Stock bajo', valor: bajos, icon: '⚠️', color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Agotados', valor: agotados, icon: '🔴', color: '#ef4444', bg: '#fef2f2' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: s.bg, borderRadius: '8px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: '22px', fontWeight: '700', color: s.color, margin: '0 0 2px 0' }}>{s.valor}</p>
                <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Alertas */}
        {(agotados > 0 || bajos > 0) && (
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <p style={{ color: '#92400e', fontSize: '14px', margin: 0 }}>
              {agotados > 0 && <strong>{agotados} producto{agotados > 1 ? 's' : ''} agotado{agotados > 1 ? 's' : ''}. </strong>}
              {bajos > 0 && <span>{bajos} producto{bajos > 1 ? 's' : ''} con stock bajo.</span>}
              {' '}Considera reabastecer pronto.
            </p>
          </div>
        )}

        {/* Formulario */}
        {mostrarForm && (
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '22px', marginBottom: '22px', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '15px', fontWeight: '600', color: '#111' }}>
              {editando ? '✏️ Editar producto' : '➕ Agregar nuevo producto'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Nombre del producto *</label>
                <input style={inputStyle} placeholder="Ej. Leche entera, Pollo, Tomate..." value={nuevoProducto.nombre} onChange={e => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })} onFocus={e => e.target.style.borderColor = '#22c55e'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} onKeyDown={e => e.key === 'Enter' && guardarProducto()} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Categoría</label>
                  <select style={inputStyle} value={nuevoProducto.categoria} onChange={e => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })}>
                    {CATEGORIAS.filter(c => c !== 'Todas').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Cantidad actual</label>
                  <input type="number" min="0" style={inputStyle} value={nuevoProducto.cantidad} onChange={e => setNuevoProducto({ ...nuevoProducto, cantidad: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Cantidad mínima</label>
                  <input type="number" min="0" style={inputStyle} value={nuevoProducto.cantidad_minima} onChange={e => setNuevoProducto({ ...nuevoProducto, cantidad_minima: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Unidad</label>
                  <select style={inputStyle} value={nuevoProducto.unidad} onChange={e => setNuevoProducto({ ...nuevoProducto, unidad: e.target.value })}>
                    {['unidades', 'kg', 'litros', 'gramos', 'cajas', 'bolsas', 'botellas', 'latas'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setMostrarForm(false); setEditando(null) }} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#666', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button onClick={guardarProducto} disabled={guardando} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#22c55e', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar producto'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={{ marginBottom: '18px' }}>
          <input style={{ ...inputStyle, marginBottom: '12px', backgroundColor: 'white' }} placeholder="🔍 Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} onFocus={e => e.target.style.borderColor = '#22c55e'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORIAS.map(cat => (
              <button key={cat} onClick={() => setFiltro(cat)} style={{ padding: '6px 14px', borderRadius: '20px', border: filtro === cat ? 'none' : '1px solid #e5e7eb', backgroundColor: filtro === cat ? '#22c55e' : 'white', color: filtro === cat ? 'white' : '#666', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de productos */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}>
            <div style={{ fontSize: '30px', marginBottom: '10px' }}>⏳</div>
            <p>Cargando inventario...</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '14px', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
            <p style={{ color: '#aaa' }}>No hay productos{filtro !== 'Todas' ? ` en ${filtro}` : ''}</p>
            <button onClick={() => setMostrarForm(true)} style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>
              + Agregar primer producto
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {productosFiltrados.map(producto => {
              const estado = getEstado(producto)
              return (
                <div key={producto.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 20px', border: `1px solid ${producto.cantidad === 0 ? '#fecaca' : producto.cantidad <= producto.cantidad_minima ? '#fde68a' : '#f0f0f0'}`, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                  {/* Indicador de estado */}
                  <div style={{ width: '4px', borderRadius: '4px', alignSelf: 'stretch', backgroundColor: estado.color, flexShrink: 0 }} />

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111', margin: 0 }}>{producto.nombre}</h3>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: estado.bg, color: estado.color, fontWeight: '600' }}>{estado.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', color: '#888' }}>📂 {producto.categoria}</span>
                      <span style={{ fontSize: '13px', color: '#888' }}>⚠️ Mínimo: {producto.cantidad_minima} {producto.unidad}</span>
                    </div>
                  </div>

                  {/* Contador */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => actualizarCantidad(producto.id, -1)} disabled={producto.cantidad === 0}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: 'white', fontSize: '18px', cursor: producto.cantidad === 0 ? 'not-allowed' : 'pointer', opacity: producto.cantidad === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>−</button>
                    <div style={{ textAlign: 'center', minWidth: '60px' }}>
                      <p style={{ fontSize: '22px', fontWeight: '700', color: estado.color, margin: 0 }}>{producto.cantidad}</p>
                      <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>{producto.unidad}</p>
                    </div>
                    <button onClick={() => actualizarCantidad(producto.id, 1)}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: '#22c55e', color: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>+</button>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => abrirEditar(producto)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
                    <button onClick={() => eliminarProducto(producto.id)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #fee2e2', backgroundColor: '#fef2f2', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
