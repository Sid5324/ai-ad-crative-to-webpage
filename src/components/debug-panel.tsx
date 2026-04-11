export default function DebugPanel({ debug }: { debug: unknown }) {
  if (!debug) return null;

  return (
    <div className="card" style={{ padding: 24, marginTop: 24 }}>
      <h2>🔧 Debug Information</h2>
      <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', fontSize: '12px' }}>
        {JSON.stringify(debug, null, 2)}
      </pre>
    </div>
  );
}