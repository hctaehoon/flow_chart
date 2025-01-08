#!/bin/bash

# 프재 작업 디렉토리를 프로젝트 루트로 설정
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $PROJECT_DIR

# 기존 PM2 프로세스 중지
pm2 stop all

# 프론트엔드 빌드
echo "Installing frontend dependencies..."
npm install

echo "Building frontend..."
npm run build

# 백엔드 의존성 설치
echo "Installing backend dependencies..."
cd server
npm install
cd ..

# PM2로 서비스 시작
echo "Starting services with PM2..."
pm2 start ecosystem.config.js --env production

# PM2 상태 확인
echo "PM2 status:"
pm2 status

echo "Deployment completed!" 