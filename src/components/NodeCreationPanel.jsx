import { useState } from 'react';
import { AFVI_SUB_PROCESSES } from '../constants/afviProcess';

// API URL을 환경변수에서 가져오기
const API_URL = import.meta.env.VITE_API_URL;

function NodeCreationPanel({ onClose }) {
  const [nodeName, setNodeName] = useState('');
  const [nodeType, setNodeType] = useState('process');
  const [subProcess, setSubProcess] = useState('3D_BGA');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // localhost 대신 환경변수 사용
      const response = await fetch(`${API_URL}/api/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: nodeType,
          data: {
            label: nodeName,
            subProcess: nodeType === 'process' ? subProcess : null
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create node');
      }

      const result = await response.json();
      console.log('Node created:', result);
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error creating node:', error);
      alert('노드 생성에 실패했습니다.');
    }
  };

  return (
    <div style={{ 
      padding: '15px',
      position: 'absolute',
      zIndex: 4,
      background: 'white',
      borderRadius: '5px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <input
        value={nodeName}
        onChange={(e) => setNodeName(e.target.value)}
        placeholder="노드 이름"
        style={{ marginRight: '5px' }}
      />
      <select 
        value={nodeType} 
        onChange={(e) => setNodeType(e.target.value)}
        style={{ marginRight: '5px' }}
      >
        <option value="process">공정 노드</option>
        <option value="product">제품 노드</option>
      </select>
      {nodeType === 'product' && (
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="수량"
          style={{ marginRight: '5px' }}
        />
      )}
      <button onClick={handleSubmit}>노드 생성</button>
    </div>
  );
}

export default NodeCreationPanel; 