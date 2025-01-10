import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ProcessNode, ProductNode } from './components/CustomNodes';
import ProductRegistration from './components/ProductRegistration';
import ShippingPanel from './components/ShippingPanel';
import { PROCESS_POSITIONS } from './constants/processPositions';
import { resetProcessCounter, incrementProcessCounter, initializeYPositions } from './utils/nodeUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ProcessNode를 메모이제이션된 컴포넌트로 만듦
const MemoizedProcessNode = React.memo(({ products, ...props }) => (
  <ProcessNode {...props} products={products} />
));

// 기본 nodeTypes 정의
const baseNodeTypes = {
  product: ProductNode
};

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // nodeTypes를 products 의존성과 함께 메모이제이션
  const nodeTypes = useMemo(() => ({
    ...baseNodeTypes,
    process: (props) => <MemoizedProcessNode {...props} products={products} />
  }), [products]);

  // 2. 모든 callback hooks
  const onNodesChange = useCallback(
    (changes) => {
      const updatedNodes = applyNodeChanges(changes, nodes);
      setNodes(updatedNodes);
      
      fetchData(`${API_URL}/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNodes),
      });
    },
    [nodes]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(updatedEdges);

      fetchData(`${API_URL}/edges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEdges),
      });
    },
    [edges]
  );

  const onConnect = useCallback(
    (params) => {
      const updatedEdges = addEdge(params, edges);
      setEdges(updatedEdges);

      fetchData(`${API_URL}/edges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEdges),
      });
    },
    [edges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const deleteNode = useCallback((nodeId) => {
    setNodes((nds) => {
      const updatedNodes = nds.filter((node) => node.id !== nodeId);
      fetchData(`${API_URL}/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNodes),
      });
      return updatedNodes;
    });

    setEdges((eds) => {
      const updatedEdges = eds.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      fetchData(`${API_URL}/edges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEdges),
      });
      return updatedEdges;
    });
  }, []);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, ...newData },
          };
        }
        return node;
      })
    );
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      const productsData = await response.json();

      // 공정별 카운터 초기화
      Object.keys(PROCESS_POSITIONS).forEach(processName => {
        resetProcessCounter(processName);
      });

      // 현재 공정별 제품 수를 기준으로 카운터 설정
      productsData
        .filter(product => product.status === 'registered')
        .forEach(product => {
          incrementProcessCounter(product.currentPosition);
        });

      const productNodes = productsData
        .filter(product => product.status === 'registered')
        .map(product => ({
          id: product.id,
          type: 'product',
          position: product.position,
          data: {
            ...product,
            label: product.modelName
          }
        }));

      setNodes(prevNodes => {
        const processNodes = prevNodes.filter(node => node.type === 'process');
        return [...processNodes, ...productNodes];
      });
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error.message);
    }
  }, []);

  const handleProductRegistered = useCallback(() => {
    loadProducts();
  }, [loadProducts]);

  const onNodeDoubleClick = useCallback((event, node) => {
    if (node.type === 'product') {
      event.preventDefault();
      event.stopPropagation();
    }
  }, []);

  // 3. effect hooks
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const flowResponse = await fetch(`${API_URL}/flow`);
        if (!flowResponse.ok) {
          throw new Error('Failed to load flow data');
        }
        const flowData = await flowResponse.json();
        setNodes(flowData.nodes || []);
        setEdges(flowData.edges || []);
        
        // Y 위치 초기화는 여기서 한 번만 수행
        initializeYPositions(flowData.nodes || []);
        
        await loadProducts();
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [loadProducts]);

  // 주기적인 데이터 업데이트 (선택적)
  useEffect(() => {
    const interval = setInterval(() => {
      loadProducts();
    }, 5000); // 5초마다 업데이트

    return () => clearInterval(interval);
  }, [loadProducts]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ProductRegistration onProductRegistered={handleProductRegistered} />
      <ShippingPanel />
      {selectedNode && (
        <div style={{
          position: 'absolute',
          right: 10,
          top: 10,
          zIndex: 4,
          background: 'white',
          padding: '10px',
          borderRadius: '5px'
        }}>
          <h3>노드 정보</h3>
          <p>ID: {selectedNode.id}</p>
          <input
            value={selectedNode.data.label || ''}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
            placeholder="노드 이름"
          />
          {selectedNode.type === 'product' && (
            <input
              type="number"
              value={selectedNode.data.quantity || ''}
              onChange={(e) => updateNodeData(selectedNode.id, { quantity: e.target.value })}
              placeholder="수량"
            />
          )}
          {/* <button onClick={() => deleteNode(selectedNode.id)}>
            노드 삭제
          </button> */}
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export default App;
