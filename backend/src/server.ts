import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL allowed: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
