import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ROUTE_OPTIONS } from '../constants/routes';
import { calculateNodePosition, updateProductPosition, moveToShippingList } from '../utils/nodeUtils';
import { getModelColor } from '../utils/colorUtils';
import EditProductModal from './EditProductModal';
import { useState } from 'react';
import { MACHINE_STATUS_COLORS } from '../constants/afviProcess';
import AfviProcessModal from './AfviProcessModal';
import { AFVI_SUB_PROCESSES } from '../constants/afviProcess';
import { getNodeColor } from '../utils/colorUtils';

// 공정별 색상 정의
const processColors = {
  '입고': '#FF6B6B',      // 빨간색 계열
  'FVI': '#4ECDC4',       // 청록색 계열
  'FQA': '#45B7D1',       // 하늘색 계열
  'PACKING': '#96CEB4',   // 민트색 계열
  '출하 대기': '#FFD93D', // 노란색 계열
  'AFVI': '#FF8B94'       // 분홍색 계열
};

export function ProcessNode({ data, products = [] }) {
  // AFVI 세부 공정 노드의 상태 확인
  const getNodeStatus = () => {
    if (!data.label.includes('_BGA') && !data.label.includes('IVS') && !data.label.includes('Sorter')) {
      return null;
    }

    // 현재 작업 중인 제품 찾기
    const workingProduct = products.find(p => 
      p.afviStatus?.currentMachine === data.label && 
      p.status === 'registered' &&
      p.afviStatus?.currentSubProcess
    );

    return workingProduct ? 'WORKING' : 'IDLE';
  };

  const nodeStatus = getNodeStatus();
  const backgroundColor = nodeStatus 
    ? MACHINE_STATUS_COLORS[nodeStatus]
    : (processColors[data.label] || '#fff');

  const borderColor = processColors[data.label] 
    ? processColors[data.label].replace(')', ', 0.5)').replace('rgb', 'rgba') 
    : '#777';

  return (
    <div
      style={{
        padding: '10px',
        border: `2px solid ${borderColor}`,
        borderRadius: '5px',
        background: backgroundColor,
        minWidth: '150px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: nodeStatus === 'WORKING' ? '#fff' : (processColors[data.label] ? '#fff' : '#000'),
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        pointerEvents: 'none'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div>
        <strong style={{ display: 'block' }}>{data.label}</strong>
        {data.details && <p style={{ margin: '5px 0' }}>{data.details}</p>}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export const ProductNode = memo(({ data, isConnectable }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAfviModal, setShowAfviModal] = useState(false);

  const handleNextProcess = async () => {
    // AFVI 공정일 경우의 특별 처리
    if (data.currentPosition === 'AFVI') {
      if (!data.afviStatus?.currentSubProcess) {
        // AFVI 첫 진입 시
        setShowAfviModal(true);
        return;
      }

      // 이미 AFVI 세부 공정 진행 중일 때
      const currentSubProcess = data.afviStatus.currentSubProcess;
      const nextSubProcess = AFVI_SUB_PROCESSES[currentSubProcess].nextProcess;

      if (nextSubProcess) {
        // 다음 세부 공정으로 이동
        setShowAfviModal(true);
        return;
      }

      // AFVI의 모든 세부 공정이 완료된 경우 다음 메인 공정으로 이동
      const currentRoute = ROUTE_OPTIONS[data.route].path;
      const currentIndex = currentRoute.indexOf(data.currentPosition);
      const nextProcess = currentRoute[currentIndex + 1];
      const newPosition = calculateNodePosition(nextProcess);

      try {
        const response = await fetch(`http://localhost:3001/api/products/${data.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPosition: nextProcess,
            position: newPosition,
            afviStatus: {
              currentSubProcess: null,
              currentMachine: null,
              startTime: null,
              history: [
                ...data.afviStatus.history,
                {
                  subProcess: data.afviStatus.currentSubProcess,
                  machine: data.afviStatus.currentMachine,
                  startTime: data.afviStatus.startTime,
                  endTime: new Date().toISOString()
                }
              ]
            }
          }),
        });

        if (!response.ok) throw new Error('Failed to update position');
        window.location.reload();
      } catch (error) {
        console.error('Error:', error);
        alert('작업 처리에 실패했습니다.');
      }
      return;
    }

    // 기존의 일반 공정 이동 로직 유지
    const currentRoute = ROUTE_OPTIONS[data.route].path;
    const currentIndex = currentRoute.indexOf(data.currentPosition);
    
    try {
      // 현재 출하 대기 상태라면 출하 처리
      if (data.currentPosition === '출하 대기') {
        const response = await fetch(`http://localhost:3001/api/products/${data.id}/ship`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to ship');
        }

        const result = await response.json();
        if (result.success) {
          window.location.reload();
        } else {
          throw new Error('Shipping process failed');
        }
        return;
      }

      // 마지막 공정이면 출하 대기로 이동
      if (currentIndex === currentRoute.length - 1) {
        const newPosition = calculateNodePosition('출하 대기');
        
        const response = await fetch(`http://localhost:3001/api/products/${data.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPosition: '출하 대기',
            position: newPosition
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to move to shipping wait');
        }

        window.location.reload();
        return;
      }

      // 일반적인 다음 공정으로 이동
      if (currentIndex < currentRoute.length - 1) {
        const nextProcess = currentRoute[currentIndex + 1];
        const newPosition = calculateNodePosition(nextProcess);
        
        const response = await fetch(`http://localhost:3001/api/products/${data.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPosition: nextProcess,
            position: newPosition
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update position');
        }

        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('작업 처리에 실패했습니다: ' + error.message);
    }
  };

  const handleClick = (e) => {
    if (e.detail === 2) {  // 더블클릭 감지
      e.preventDefault();
      e.stopPropagation();
      setShowEditModal(true);
    }
  };

  const handleSave = async (formData) => {
    try {
      // 선택된 공정의 새로운 위치 계산
      const newPosition = calculateNodePosition(formData.currentPosition);

      const response = await fetch(`http://localhost:3001/api/products/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: Number(formData.quantity),
          currentPosition: formData.currentPosition,
          position: newPosition
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('제품 정보 수정에 실패했습니다.');
    }
    setShowEditModal(false);
  };

  const handleAfviSave = async (afviData) => {
    try {
      const response = await fetch(`http://localhost:3001/api/products/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          afviStatus: {
            currentSubProcess: afviData.subProcess,
            currentMachine: afviData.machine,
            startTime: afviData.startTime,
            history: [
              ...(data.afviStatus?.history || []),
              data.afviStatus?.currentMachine ? {
                subProcess: data.afviStatus.currentSubProcess,
                machine: data.afviStatus.currentMachine,
                startTime: data.afviStatus.startTime,
                endTime: new Date().toISOString()
              } : null
            ].filter(Boolean)
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to update AFVI status');
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      alert('AFVI 공정 업데이트에 실패했습니다.');
    }
    setShowAfviModal(false);
  };

  const backgroundColor = getModelColor(data.modelName);
  
  return (
    <>
      <div 
        onClick={handleClick}
        style={{
          padding: '15px',
          border: `2px solid ${backgroundColor}`,
          borderRadius: '5px',
          background: `${backgroundColor}22`,
          minWidth: '200px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 1,
          pointerEvents: 'all'
        }}
      >
        <Handle 
          type="target" 
          position={Position.Top} 
          style={{ zIndex: 2 }}
        />
        <div style={{ pointerEvents: 'all' }}>
          <strong>{data.modelName}</strong>
          <p>LOT NO: {data.lotNo}</p>
          <p>수량: {data.quantity}</p>
          <p>현재 공정: {data.currentPosition}</p>
          {data.currentPosition === 'AFVI' && data.afviStatus?.currentMachine && (
            <p>현재 설비: {data.afviStatus.currentMachine}</p>
          )}
          <button onClick={handleNextProcess}>
            {data.currentPosition === '출하 대기' ? '출하 완료' : '다음 공정으로 이동'}
          </button>
        </div>
        <Handle 
          type="source" 
          position={Position.Bottom} 
          style={{ zIndex: 2 }}
        />
      </div>

      {showEditModal && (
        <EditProductModal
          product={data}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}

      {showAfviModal && (
        <AfviProcessModal
          product={data}
          onClose={() => setShowAfviModal(false)}
          onSave={handleAfviSave}
        />
      )}
    </>
  );
}); 