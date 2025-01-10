import { useState } from 'react';
import { ROUTE_OPTIONS } from '../constants/routes';
import { calculateNodePosition, updateProductPosition } from '../utils/nodeUtils';

function ProductRegistration({ onProductRegistered }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    modelName: '',
    lotNo: '',
    quantity: '',
    route: 'ROUTE1'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const position = calculateNodePosition('입고');
    
    try {
      const response = await fetch('http://43.203.179.67:3001/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          position,
          currentPosition: '입고',
          afviStatus: {
            currentSubProcess: null,
            currentMachine: null,
            startTime: null,
            history: []
          },
          isHolding: false,
          holdingMemo: null,
          registeredAt: new Date().toISOString(),
          status: 'registered'
        }),
      });

      if (!response.ok) throw new Error('Failed to register product');
      const newProduct = await response.json();
      
      // 제품 등록 후 자동으로 입고 공정으로 위치 재조정
      const adjustedPosition = calculateNodePosition('입고');
      await updateProductPosition(newProduct.id, '입고', adjustedPosition);
      
      setFormData({
        modelName: '',
        lotNo: '',
        quantity: '',
        route: 'ROUTE1'
      });
      
      onProductRegistered();
    } catch (error) {
      console.error('Error registering product:', error);
      alert('제품 등록에 실패했습니다.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '300px',
      backgroundColor: 'white',
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
      zIndex: 1000,
      transition: 'transform 0.3s ease',
      transform: isOpen ? 'translateX(0)' : 'translateX(-270px)'
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          right: '-30px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '30px',
          height: '60px',
          backgroundColor: '#4a90e2',
          border: 'none',
          borderRadius: '0 5px 5px 0',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isOpen ? '◀' : '▶'}
      </button>
      
      <div style={{ padding: '20px' }}>
        <h2 style={{ borderBottom: '2px solid #4a90e2', paddingBottom: '10px' }}>제품 등록</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>모델명:</label>
            <input
              type="text"
              value={formData.modelName}
              onChange={(e) => setFormData(prev => ({ ...prev, modelName: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>LOT NO:</label>
            <input
              type="text"
              value={formData.lotNo}
              onChange={(e) => setFormData(prev => ({ ...prev, lotNo: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>수량:</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>제품 루트:</label>
            <select
              value={formData.route}
              onChange={(e) => setFormData(prev => ({ ...prev, route: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="ROUTE1">{ROUTE_OPTIONS.ROUTE1.label}</option>
              <option value="ROUTE2">{ROUTE_OPTIONS.ROUTE2.label}</option>
            </select>
          </div>
          
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            등록
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProductRegistration; 