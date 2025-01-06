export const PROCESS_POSITIONS = {
  '입고': { x: -1815, y: 28 },
  'AFVI': { x: -1279, y: 50 },
  'FVI': { x: -698, y: 28 },
  'FQA': { x: -23, y: 30 },
  'PACKING': { x: 671, y: 32 },
  '출하 대기': { x: 1100, y: 32 }
};

// 각 공정별 노드 간격
export const NODE_SPACING = {
  VERTICAL: 250,  // 기본 간격
  HORIZONTAL: 200
}; 

// 입고 공정 전용 간격 설정
export const INCOMING_NODE_SPACING = {
  VERTICAL: 300  // 입고 공정 간격을 150에서 300으로 증가
}; 

// 제품 노드의 시작 Y 위치 설정
export const INITIAL_PRODUCT_Y_OFFSET = 80;

// 공정별 시작 위치 오프셋
export const PROCESS_Y_START = {
  '입고': 150,
  'AFVI': 100,
  'FVI': 100,
  'FQA': 100,
  'PACKING': 100,
  '출하 대기': 100
};

// 공정별 Y 위치 보정값
export const PROCESS_Y_ADJUSTMENTS = {
  '입고': -50,
  'AFVI': 0,
  'FVI': 0,
  'FQA': 0,
  'PACKING': 0,
  '출하 대기': 0
}; 