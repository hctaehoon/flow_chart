// 공정별 색상 정의
export const processColors = {
  '입고': '#FF6B6B',      // 빨간색 계열
  'FVI': '#4ECDC4',       // 청록색 계열
  'FQA': '#45B7D1',       // 하늘색 계열
  'PACKING': '#96CEB4',   // 민트색 계열
  '출하 대기': '#FFD93D', // 노란색 계열
  'AFVI': '#FF8B94'       // 분홍색 계열
};

// 모델별 색상 매핑 함수
export const getModelColor = (modelName) => {
  // 여기에 모델별 색상 로직 구현
  return '#4834d4';  // 기본 색상
};

// 노드 색상 가져오기
export const getNodeColor = (position) => {
  return processColors[position] || '#dfe6e9';  // 기본 색상
}; 