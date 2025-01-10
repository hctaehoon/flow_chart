export const AFVI_SUB_PROCESSES = {
  '3D_BGA': {
    name: '3D_BGA',
    machines: ['3D_BGA_1', '3D_BGA_2'],
    nextProcess: '2D_BGA'
  },
  '2D_BGA': {
    name: '2D_BGA',
    machines: ['2D_BGA_1', '2D_BGA_2'],
    nextProcess: 'IVS'
  },
  'IVS': {
    name: 'IVS',
    machines: ['IVS'],  // 두 노드지만 하나의 프로세스로 관리
    nextProcess: 'Sorter'
  },

  
  'Sorter': {
    name: 'Sorter',
    machines: ['Sorter_1', 'Sorter_2'],
    nextProcess: null  // AFVI 마지막 공정
  }
};

// 노드 상태별 색상
export const MACHINE_STATUS_COLORS = {
  WORKING: '#2ecc71',    // 작업 중 (초록색)
  IDLE: '#f1c40f',      // 유휴 상태 (노란색)
  DISABLED: '#95a5a6'   // 비활성화 (회색)
}; 