import { useState } from 'react';

function NodeCreationPanel({ setNodes }) {
  const [nodeName, setNodeName] = useState('');
  const [nodeType, setNodeType] = useState('process');
  const [quantity, setQuantity] = useState('');

  const createNode = () => {
    const newNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: { 
        label: nodeName,
        ...(nodeType === 'product' && { quantity })
      }
    };

    setNodes((nodes) => {
      const updatedNodes = [...nodes, newNode];
      
      // 서버에 변경사항 저장
      fetch('http://43.203.179.67:3001/api/nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNodes),
      }).catch(console.error);

      return updatedNodes;
    });
    
    setNodeName('');
    setQuantity('');
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
      <button onClick={createNode}>노드 생성</button>
    </div>
  );
}

export default NodeCreationPanel; 