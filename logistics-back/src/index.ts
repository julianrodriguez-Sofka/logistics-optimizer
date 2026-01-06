import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Logistics Backend running on http://localhost:${PORT}`);
  console.log(`📦 API endpoint: http://localhost:${PORT}/api/quotes`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

