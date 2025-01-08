module.exports = {
  apps: [
    {
      name: "manufacturing-flow-frontend",
      script: "npm",
      args: "run preview",
      cwd: "./", // 프론트엔드 디렉토리
      env_production: {
        NODE_ENV: "production",
        VITE_API_URL: "http://your-server-ip:3001"
      }
    },
    {
      name: "manufacturing-flow-backend",
      script: "./server/index.js",
      cwd: "./", // 프로젝트 루트 디렉토리
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
        FRONTEND_URL: "http://your-server-ip:5173" // Vite preview 서버 포트
      }
    }
  ]
}; 