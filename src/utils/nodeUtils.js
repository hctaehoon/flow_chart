import { 
  PROCESS_POSITIONS, 
  NODE_SPACING, 
  PROCESS_Y_START,
  INCOMING_NODE_SPACING 
} from '../constants/processPositions';

const API_URL = 'http://43.203.179.67:3001/api';

// 공정별 현재 등록된 노드 수를 추적하기 위한 전역 카운터
const processCounters = {
  '입고': 0,
  'FVI': 0,
  'FQA': 0,
  'AFVI': 0,
  'PACKING': 0,
  '출하 대기': 0
};

// 공정별 현재 등록된 노드의 Y 위치를 추적
const processYPositions = {
  '입고': [],
  'FVI': [],
  'FQA': [],
  'AFVI': [],
  'PACKING': [],
  '출하 대기': []
};

// 노드 높이 상수 (제품 노드의 실제 높이 + 여백)
const NODE_HEIGHT = 235 + 30; // 실제 노드 높이 235px + 30px 여백

// AFVI 공정 노드 위치 관리를 위한 객체
const AFVINodePositions = {
  positions: new Map(), // nodeId -> initial Y position
  
  // 노드의 초기 Y 위치 설정
  setInitialPosition(nodeId, y) {
    this.positions.set(nodeId, y);
  },
  
  // 노드의 초기 Y 위치 가져오기
  getInitialPosition(nodeId) {
    return this.positions.get(nodeId);
  },
  
  // 노드 제거
  removeNode(nodeId) {
    this.positions.delete(nodeId);
  }
};

// AFVI 공정 상태 관리를 위한 객체 추가
const AFVIProcessState = {
  mainProcess: [], // AFVI 메인 공정의 노드들
  subProcesses: {  // 각 서브 프로세스별 노드들
    '3D_BGA': [],
    '2D_BGA': [],
    'IVS': [],
    'Sorter': []
  },
  
  // 노드의 현재 위치 추적
  getNodeLocation(nodeId) {
    if (this.mainProcess.includes(nodeId)) return 'main';
    
    for (const [process, nodes] of Object.entries(this.subProcesses)) {
      if (nodes.includes(nodeId)) return process;
    }
    return null;
  },
  
  // 노드를 서브 프로세스로 이동
  moveToSubProcess(nodeId, subProcess) {
    // 기존 위치에서 제거
    this.removeNode(nodeId);
    
    // 새로운 서브 프로세스에 추가
    this.subProcesses[subProcess].push(nodeId);
  },
  
  // 노드를 메인 프로세스로 이동
  moveToMainProcess(nodeId) {
    // 기존 위치에서 제거
    this.removeNode(nodeId);
    
    // 메인 프로세스에 추가
    this.mainProcess.push(nodeId);
  },
  
  // 노드 제거
  removeNode(nodeId) {
    this.mainProcess = this.mainProcess.filter(id => id !== nodeId);
    Object.keys(this.subProcesses).forEach(process => {
      this.subProcesses[process] = this.subProcesses[process].filter(id => id !== nodeId);
    });
  }
};

export const calculateNodePosition = (processName) => {
  const basePosition = PROCESS_POSITIONS[processName];
  if (!basePosition) return { x: 0, y: 0 };

  // 입고 공정의 경우 특별 처리
  if (processName === '입고') {
    if (!processYPositions[processName]) {
      processYPositions[processName] = [];
    }

    const startY = basePosition.y + 150;
    let newY = startY;
    
    while (processYPositions[processName].includes(newY)) {
      newY += INCOMING_NODE_SPACING.VERTICAL;  // 입고 공정용 간격 사용
    }

    processYPositions[processName].push(newY);
    return {
      x: basePosition.x - 30,
      y: newY
    };
  }

  // 다른 공정들은 기존 간격 사용
  const startY = basePosition.y + (PROCESS_Y_START[processName] || 100);
  let newY = startY;
  
  while (processYPositions[processName].includes(newY)) {
    newY += NODE_SPACING.VERTICAL;
  }

  processYPositions[processName].push(newY);
  return {
    x: basePosition.x,
    y: newY
  };
};

// 공정별 카운터 초기화 (기존 기능)
export const resetProcessCounter = (processName) => {
  processCounters[processName] = 0;
};

// 공정별 카운터 감소 (기존 기능)
export const decrementProcessCounter = (processName) => {
  if (processCounters[processName] > 0) {
    processCounters[processName]--;
  }
};

// 공정별 카운터 증가 (기존 기능)
export const incrementProcessCounter = (processName) => {
  processCounters[processName]++;
};

// 공정별 Y 위치 초기화 (새로운 기능)
export const resetProcessYPositions = () => {
  Object.keys(processYPositions).forEach(key => {
    processYPositions[key] = [];
  });
};

// 특정 위치 제거 (새로운 기능)
export const removeYPosition = (processName, y) => {
  if (processYPositions[processName]) {
    const index = processYPositions[processName].indexOf(y);
    if (index > -1) {
      processYPositions[processName].splice(index, 1);
    }
  }
};

// 기존 노드들의 위치 정보로 Y 위치 배열 초기화 (새로운 기능)
export const initializeYPositions = (nodes) => {
  // 모든 공정의 Y 위치 배열 초기화
  Object.keys(processYPositions).forEach(key => {
    processYPositions[key] = [];
  });
  
  // 기존 제품 노드의 Y 위치 등록
  nodes
    .filter(node => node.type === 'product' && node.data.status === 'registered')
    .forEach(node => {
      const processName = node.data.currentPosition;
      if (processName && processYPositions[processName]) {
        processYPositions[processName].push(node.position.y);
      }
    });
};

// 공정 내 노드들 재정렬 함수 수정
const reorderProcessNodes = async (processName, nodes) => {
  try {
    // AFVI 공정의 경우 특별 처리
    if (processName === 'AFVI') {
      return await reorderAFVINodes(nodes);
    }

    // 다른 공정들은 기존 로직 유지
    const processNodes = nodes
      .filter(node => 
        node.type === 'product' && 
        node.data.currentPosition === processName &&
        node.data.status === 'registered'
      )
      .sort((a, b) => a.position.y - b.position.y);

    if (processNodes.length === 0) return;

    // Y 위치 배열 초기화
    processYPositions[processName] = [];
    
    const basePosition = PROCESS_POSITIONS[processName];
    const startY = basePosition.y + (PROCESS_Y_START[processName] || 100);
    
    const updates = processNodes.map((node, index) => {
      const spacing = processName === '입고' ? 
        INCOMING_NODE_SPACING.VERTICAL : NODE_SPACING.VERTICAL;
      const xOffset = processName === '입고' ? -30 : 0;
      
      const newY = startY + (index * spacing);
      processYPositions[processName].push(newY);

      return {
        id: node.id,
        position: {
          x: basePosition.x + xOffset,
          y: newY
        }
      };
    });

    await updateNodePositions(updates);
  } catch (error) {
    console.error('Error in reorderProcessNodes:', error);
  }
};

// AFVI 공정 노드 재정렬 함수 수정
const reorderAFVINodes = async (nodes) => {
  try {
    const afviNodes = nodes.filter(node => 
      node.type === 'product' && 
      node.data.currentPosition === 'AFVI' &&
      node.data.status === 'registered'
    );

    if (afviNodes.length === 0) return;

    const updates = [];
    const basePosition = PROCESS_POSITIONS['AFVI'];
    let currentY = basePosition.y + 300;

    // 새로운 노드들의 위치 계산
    for (const node of afviNodes) {
      let nodeY;
      
      // 이미 위치가 할당된 노드인지 확인
      if (AFVINodePositions.getInitialPosition(node.id)) {
        // 기존 위치 유지
        nodeY = AFVINodePositions.getInitialPosition(node.id);
      } else {
        // 새로운 위치 할당
        while (Array.from(AFVINodePositions.positions.values()).includes(currentY)) {
          currentY += 250; // 기본 간격
        }
        nodeY = currentY;
        AFVINodePositions.setInitialPosition(node.id, nodeY);
        currentY += 250;
      }

      updates.push({
        id: node.id,
        position: {
          x: basePosition.x,
          y: nodeY
        }
      });
    }

    // 노드 위치 업데이트
    await updateNodePositions(updates);

    // 더 이상 AFVI에 없는 노드들의 위치 정보 제거
    const currentAfviNodeIds = new Set(afviNodes.map(node => node.id));
    for (const nodeId of AFVINodePositions.positions.keys()) {
      if (!currentAfviNodeIds.has(nodeId)) {
        AFVINodePositions.removeNode(nodeId);
      }
    }
  } catch (error) {
    console.error('Error in reorderAFVINodes:', error);
  }
};

// 노드 위치 업데이트 함수
const updateNodePositions = async (updates) => {
  if (updates.length === 0) return;

  try {
    // db.json 업데이트
    await fetch(`${API_URL}/nodes/batch-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    // products.json 업데이트
    for (const update of updates) {
      await fetch(`${API_URL}/products/${update.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: update.position })
      });
    }
  } catch (error) {
    console.error('Error updating node positions:', error);
  }
};

// 설비 상태 업데이트 함수 수정
const updateMachineStatus = async (nodes) => {
  try {
    // AFVI 공정에서 현재 작업 중인 제품 노드들 찾기
    const afviNodes = nodes.filter(node => 
      node.type === 'product' && 
      node.data.currentPosition === 'AFVI' &&
      node.data.status === 'registered'
    );

    // 모든 설비 노드 찾기
    const machineNodes = nodes.filter(node => 
      node.type === 'process' && 
      ['3D_BGA_1', '3D_BGA_2', '2D_BGA_1', '2D_BGA_2', 'IVS', 'Sorter_1', 'Sorter_2'].includes(node.data.label)
    );

    // 먼저 모든 설비를 사용 가능 상태로 설정
    const updates = machineNodes.map(node => ({
      id: node.id,
      data: { ...node.data, status: 'available' }
    }));

    // 사용 중인 설비 상태 업데이트
    afviNodes.forEach(node => {
      if (node.data.afviStatus?.currentMachine) {
        const machineNode = updates.find(update => 
          update.data.label === node.data.afviStatus.currentMachine
        );
        if (machineNode) {
          machineNode.data.status = 'in-use';
        }
      }
    });

    // 설비 상태 일괄 업데이트
    for (const update of updates) {
      await fetch(`${API_URL}/nodes/${update.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: update.data })
      });
    }

    // 업데이트된 flow 데이터 반환
    const flowResponse = await fetch(`${API_URL}/flow`);
    if (!flowResponse.ok) throw new Error('Failed to get flow data');
    return await flowResponse.json();
  } catch (error) {
    console.error('Error updating machine status:', error);
    throw error;
  }
};

// AFVI 상태 업데이트 함수 수정
export const updateAFVIStatus = async (productId, afviStatus) => {
  try {
    // 상태 업데이트
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ afviStatus })
    });

    if (!response.ok) throw new Error('Failed to update AFVI status');

    // 노드 재정렬 및 설비 상태 업데이트
    const flowResponse = await fetch(`${API_URL}/flow`);
    if (!flowResponse.ok) throw new Error('Failed to get flow data');
    const flowData = await flowResponse.json();

    // 설비 상태 업데이트 후 새로운 flow 데이터 받기
    const updatedFlowData = await updateMachineStatus(flowData.nodes);
    
    // 노드 재정렬
    await reorderProcessNodes('AFVI', updatedFlowData.nodes);

    return await response.json();
  } catch (error) {
    console.error('Error updating AFVI status:', error);
    throw error;
  }
};

// 노드 데이터 업데이트 함수 추가
const updateNodeData = async (nodeId, newData) => {
  try {
    const response = await fetch(`${API_URL}/nodes/${nodeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newData)
    });

    if (!response.ok) {
      throw new Error('Failed to update node data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating node data:', error);
    throw error;
  }
};

// 기존 기능 유지
export const moveToShippingList = async (productId) => {
  try {
    const response = await fetch(`${API_URL}/products/${productId}/ship`, {
      method: 'POST',
    });
    
    if (!response.ok) throw new Error('Failed to move product to shipping list');
    
    return await response.json();
  } catch (error) {
    console.error('Error moving product to shipping list:', error);
    throw error;
  }
};

// 제품 위치 업데이트 함수 수정
export const updateProductPosition = async (productId, newProcess, newPosition) => {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPosition: newProcess,
        position: newPosition
      }),
    });
    
    if (!response.ok) throw new Error('Failed to update product position');
    const updatedProduct = await response.json();

    // AFVI 공정에 진입하는 경우
    if (newProcess === 'AFVI') {
      // 새로운 Y 위치 할당
      let newY = PROCESS_POSITIONS['AFVI'].y + 300;
      while (Array.from(AFVINodePositions.positions.values()).includes(newY)) {
        newY += 250;
      }
      AFVINodePositions.setInitialPosition(productId, newY);
    }
    // AFVI 공정을 떠나는 경우
    else if (updatedProduct.currentPosition === 'AFVI') {
      AFVINodePositions.removeNode(productId);
    }

    const flowResponse = await fetch(`${API_URL}/flow`);
    if (!flowResponse.ok) throw new Error('Failed to get flow data');
    const flowData = await flowResponse.json();

    await reorderProcessNodes(newProcess, flowData.nodes);
    
    return updatedProduct;
  } catch (error) {
    console.error('Error updating product position:', error);
    throw error;
  }
}; 