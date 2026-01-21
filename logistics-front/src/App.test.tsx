import './index.css';

function App() {
  console.log('App is rendering!');
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '24px', marginBottom: '10px' }}>
        Logistics Optimizer - OpenRouteService
      </h1>
      <p style={{ color: '#666' }}>
        Frontend está funcionando. Si ves este texto, React está cargando correctamente.
      </p>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
        <p>✅ React: OK</p>
        <p>✅ Vite: OK</p>
        <p>⏳ Verificando Tailwind CSS...</p>
      </div>
      <div className="bg-primary text-white p-4 rounded-lg mt-4">
        Si este texto aparece con fondo verde y texto blanco, Tailwind funciona.
      </div>
    </div>
  );
}

export default App;
