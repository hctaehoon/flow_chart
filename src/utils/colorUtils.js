// 모델별 색상을 저장할 객체
const modelColors = {};

// 공정별 색상 정의
export const processColors = {
  '입고': '#FF6B6B',      // 빨간색 계열
  'FVI': '#4ECDC4',       // 청록색 계열
  'FQA': '#45B7D1',       // 하늘색 계열
  'PACKING': '#96CEB4',   // 민트색 계열
  '출하 대기': '#FFD93D', // 노란색 계열
  'AFVI': '#FF8B94'       // 분홍색 계열
};

// 더 선명한 색상 팔레트
const colorPalette = [
  '#FF6B6B', // 밝은 빨강
  '#4ECDC4', // 청록색
  '#45B7D1', // 하늘색
  '#96CEB4', // 민트색
  '#FFD93D', // 밝은 노랑
  '#6C5CE7', // 보라색
  '#A8E6CF', // 연한 민트
  '#FF8B94', // 연한 분홍
  '#FDCB6E', // 골드
  '#74B9FF'  // 밝은 파랑
];

let colorIndex = 0;

// 모델명에 따른 색상 가져오기
export const getModelColor = (modelName) => {
  if (!modelName) return '#FFD93D'; // 기본 색상
  
  if (!modelColors[modelName]) {
    modelColors[modelName] = colorPalette[colorIndex % colorPalette.length];
    colorIndex++;
  }
  return modelColors[modelName];
};

// 노드 상태에 따른 색상 반환
export const getNodeColor = (nodeType, status) => {
  // 공정별 기본 색상
  const processColors = {
    '입고': '#FF6B6B',      // 빨간색 계열
    'FVI': '#4ECDC4',       // 청록색 계열
    'FQA': '#45B7D1',       // 하늘색 계열
    'PACKING': '#96CEB4',   // 민트색 계열
    '출하 대기': '#FFD93D', // 노란색 계열
    'AFVI': '#FF8B94'       // 분홍색 계열
  };

  // 설비 노드의 상태별 색상
  const machineStatusColors = {
    'available': '#FFA726', // 주황색 (사용 가능)
    'in-use': '#4CAF50'     // 초록색 (사용 중)
  };

  if (nodeType === 'process') {
    return status ? machineStatusColors[status] : '#FFA726';
  }

  return processColors[nodeType] || '#FFA726';
}; 