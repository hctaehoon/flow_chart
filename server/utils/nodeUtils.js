const PROCESS_POSITIONS = {
  '입고': { x: -1849, y: 0 },
  'FVI': { x: -733, y: 0 },
  'FQA': { x: 11, y: 0 },
  'PACKING': { x: 643, y: 0 },
  '출하 대기': { x: 1100, y: 0 },
  'AFVI': { x: -1214, y: 1500 },
  'Sorter_1': { x: -1326, y: 1292 },
  'Sorter_2': { x: -1100, y: 1292 }
};

const NODE_SPACING = {
  VERTICAL: 100,
  HORIZONTAL: 200
};

// 공정별 현재 등록된 노드 수를 추적하기 위한 전역 카운터
const processCounters = {
  '입고': 0,
  'FVI': 0,
  'FQA': 0,
  'AFVI': 0,
  'PACKING': 0,
  '출하 대기': 0
};

// Y 위치 추적을 위한 객체 추가
const processYPositions = {
  '입고': [],
  'FVI': [],
  'FQA': [],
  'AFVI': [],
  'PACKING': [],
  '출하 대기': []
};

// 공정별 카운터 초기화
export const resetProcessCounter = (processName) => {
  processCounters[processName] = 0;
};

// 공정별 카운터 감소
export const decrementProcessCounter = (processName) => {
  if (processCounters[processName] > 0) {
    processCounters[processName]--;
  }
};

// 공정별 카운터 증가
export const incrementProcessCounter = (processName) => {
  processCounters[processName]++;
};

// 노드 위치 계산
export const calculateNodePosition = (processName) => {
  const basePosition = PROCESS_POSITIONS[processName];
  if (!basePosition) return { x: 0, y: 0 };

  // AFVI 공정이나 설비인 경우
  if (processName === 'AFVI' || 
      processName.includes('BGA') || 
      processName.includes('IVS') || 
      processName.includes('Sorter')) {
    return {
      x: basePosition.x,
      y: basePosition.y + (processCounters[processName] * NODE_SPACING.VERTICAL)
    };
  }

  // 메인 공정들의 경우 (입고, FVI, FQA, PACKING, 출하 대기)
  // 제품 노드들만 수직으로 쌓이도록 함
  if (processName === '입고') {
    // 입고 공정은 조금 왼쪽으로 이동
    return {
      x: basePosition.x - 30,
      y: basePosition.y + (processCounters[processName] * NODE_SPACING.VERTICAL)
    };
  }

  // 나머지 메인 공정들
  return {
    x: basePosition.x,
    y: basePosition.y + (processCounters[processName] * NODE_SPACING.VERTICAL)
  };
};

// Y 위치 제거 함수 추가 및 export
export const removeYPosition = (processName, y) => {
  if (processYPositions[processName]) {
    const index = processYPositions[processName].indexOf(y);
    if (index > -1) {
      processYPositions[processName].splice(index, 1);
    }
  }
}; 