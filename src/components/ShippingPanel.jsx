import { useState, useEffect } from 'react';
import { getModelColor } from '../utils/colorUtils';
import HoldingMemoModal from './HoldingMemoModal';

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${minutes % 60}분`;
  }
  return `${minutes}분`;
}

function ShippingPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedModels, setExpandedModels] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHoldingModal, setShowHoldingModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 제품 데이터 로드 함수
  const loadProducts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/products');
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  // 1초마다 제품 목록 새로고침
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      loadProducts(); // 제품 목록도 함께 업데이트
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    loadProducts();
  }, []);

  const calculateWaitingTime = (registeredAt) => {
    const start = new Date(registeredAt);
    const now = currentTime;
    return formatDuration(now - start);
  };

  const toggleModel = (modelName) => {
    setExpandedModels(prev => ({
      ...prev,
      [modelName]: !prev[modelName]
    }));
  };

  // 모델별로 제품을 그룹화하는 함수
  const groupByModel = (products) => {
    return products.reduce((groups, product) => {
      const model = product.modelName;
      if (!groups[model]) {
        groups[model] = [];
      }
      groups[model].push(product);
      return groups;
    }, {});
  };

  // 검색 필터링 함수
  const filterProducts = (products) => {
    return products.filter(product => 
      product.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.lotNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 진행 중인 제품 (오래된 순)
  const registeredProducts = filterProducts(products.filter(p => p.status === 'registered'))
    .sort((a, b) => new Date(a.registeredAt) - new Date(b.registeredAt));

  // 출하 완료된 제품 (최신 순)
  const shippedProducts = filterProducts(products.filter(p => p.status === 'shipped'))
    .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
  
  const groupedShippedProducts = groupByModel(shippedProducts);

  // 출하 정보 분석 함수들
  const getShippingAnalytics = (shippedProducts) => {
    const analytics = {
      totalLots: shippedProducts.length,
      totalQuantity: shippedProducts.reduce((sum, product) => sum + Number(product.quantity), 0),
      averageProcessTime: 0,
      startDate: shippedProducts.length > 0 
        ? new Date(Math.min(...shippedProducts.map(p => new Date(p.registeredAt))))
        : null
    };

    // 평균 소요시간 계산
    const totalProcessTime = shippedProducts.reduce((sum, product) => {
      return sum + (new Date(product.shippedAt) - new Date(product.registeredAt));
    }, 0);

    analytics.averageProcessTime = formatDuration(totalProcessTime / shippedProducts.length);

    return analytics;
  };

  const analytics = getShippingAnalytics(shippedProducts);

  // 홀딩 상태 업데이트 함수
  const updateHoldingStatus = async (productId, isHolding, holdingMemo = null) => {
    try {
      console.log('Attempting to update holding status:', {
        productId,
        isHolding,
        holdingMemo
      });

      const response = await fetch(`http://localhost:3001/api/products/${productId}/holding`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          isHolding,
          holdingMemo
        })
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        let errorMessage;
        try {
          if (contentType?.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || 'Unknown error occurred';
          } else {
            const errorText = await response.text();
            errorMessage = `Server error: ${errorText}`;
          }
        } catch (e) {
          errorMessage = `Failed to update holding status (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Successfully updated holding status:', result);
      
      // 제품 목록 새로고침
      await loadProducts();
      return result;
    } catch (error) {
      console.error('Error in updateHoldingStatus:', error);
      throw error;
    }
  };

  // 홀딩 모달 저장 핸들러
  const handleHoldingSave = async (memo) => {
    try {
      await updateHoldingStatus(selectedProduct.id, true, memo);
      setShowHoldingModal(false);
      setSelectedProduct(null);
    } catch (error) {
      alert(`홀딩 상태 업데이트 실패: ${error.message}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      width: '300px',
      height: '100vh',
      backgroundColor: 'white',
      boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.3s ease',
      transform: isOpen ? 'translateX(0)' : 'translateX(270px)',
      zIndex: 1000
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          left: '-30px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '30px',
          height: '60px',
          backgroundColor: '#4a90e2',
          border: 'none',
          borderRadius: '5px 0 0 5px',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isOpen ? '▶' : '◀'}
      </button>

      <h2 style={{ 
        borderBottom: '2px solid #4a90e2', 
        padding: '20px',
        margin: 0,
        backgroundColor: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 1
      }}>
        제품 현황
      </h2>

      <div style={{ padding: '10px 20px' }}>
        <input
          type="text"
          placeholder="모델명 또는 LOT NO로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            marginBottom: '10px'
          }}
        />
      </div>
      
      <div style={{ 
        overflowY: 'auto',
        flex: 1,
        padding: '20px',
        height: 'calc(100vh - 80px)',
        boxSizing: 'border-box'
      }}>
        {/* 진행 중인 제품 */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ 
            position: 'sticky', 
            top: 0, 
            backgroundColor: 'white',
            padding: '10px 0',
            marginTop: 0
          }}>
            진행 중 ({registeredProducts.length})
          </h3>
          {registeredProducts.map(product => (
            <div key={product.id} style={{
              padding: '15px',
              marginBottom: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              backgroundColor: `${getModelColor(product.modelName)}11`,
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                right: '10px',
                top: '10px',
                cursor: 'pointer'
              }}>
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!product.isHolding) {
                      setSelectedProduct(product);
                      setShowHoldingModal(true);
                    } else {
                      updateHoldingStatus(product.id, false);
                    }
                  }}
                  style={{
                    color: product.isHolding ? 'red' : '#00000022',
                    fontSize: '20px',
                    cursor: 'pointer'
                  }}
                >
                  🚩
                </span>
              </div>
              
              <p><strong>모델명:</strong> {product.modelName}</p>
              <p><strong>LOT NO:</strong> {product.lotNo}</p>
              <p><strong>현재 공정:</strong> {product.currentPosition}</p>
              <p><strong>입고 시간:</strong> {new Date(product.registeredAt).toLocaleString()}</p>
              <p><strong>대기 시간:</strong> {calculateWaitingTime(product.registeredAt)}</p>
              {product.isHolding && product.holdingMemo && (
                <p style={{ color: 'red', marginTop: '10px' }}>
                  <strong>홀딩 사유:</strong> {product.holdingMemo}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* 출하 완료된 제품 */}
        <div>
          <h3 
            onClick={() => setShowCompleted(!showCompleted)}
            style={{ 
              position: 'sticky', 
              top: 0, 
              backgroundColor: 'white',
              padding: '10px 0',
              marginTop: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>출하 완료 ({shippedProducts.length})</span>
            <span>{showCompleted ? '▼' : '▶'}</span>
          </h3>
          {showCompleted && Object.entries(groupedShippedProducts).map(([modelName, products]) => (
            <div key={modelName} style={{ marginBottom: '20px' }}>
              <h4 
                onClick={() => toggleModel(modelName)}
                style={{
                  backgroundColor: `${getModelColor(modelName)}22`,
                  padding: '10px',
                  borderRadius: '5px',
                  margin: '10px 0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>{modelName} ({products.length})</span>
                <span>{expandedModels[modelName] ? '▼' : '▶'}</span>
              </h4>
              {expandedModels[modelName] && products.map(product => {
                const totalTime = formatDuration(
                  new Date(product.shippedAt) - new Date(product.registeredAt)
                );
                
                return (
                  <div key={product.id} style={{
                    padding: '15px',
                    marginBottom: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    backgroundColor: `${getModelColor(product.modelName)}11`
                  }}>
                    <p><strong>LOT NO:</strong> {product.lotNo}</p>
                    <p><strong>수량:</strong> {product.quantity}</p>
                    <p><strong>입고 시간:</strong> {new Date(product.registeredAt).toLocaleString()}</p>
                    <p><strong>출하 시간:</strong> {new Date(product.shippedAt).toLocaleString()}</p>
                    <p><strong>총 소요시간:</strong> {totalTime}</p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* 출하 정보 분석 섹션 */}
        <div style={{ marginTop: '30px' }}>
          <h3 
            onClick={() => setShowAnalytics(!showAnalytics)}
            style={{ 
              position: 'sticky', 
              top: 0, 
              backgroundColor: 'white',
              padding: '10px 0',
              marginTop: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2px solid #4a90e2'
            }}
          >
            <span>출하 정보 분석</span>
            <span>{showAnalytics ? '▼' : '▶'}</span>
          </h3>
          {showAnalytics && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '5px',
              marginTop: '10px'
            }}>
              <div style={{
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '5px',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#4a90e2' }}>분석 시작일</h4>
                <p style={{ fontSize: '16px', margin: 0 }}>
                  {analytics.startDate 
                    ? analytics.startDate.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : '데이터 없음'}
                </p>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '15px',
                textAlign: 'center'
              }}>
                <div style={{
                  padding: '15px',
                  backgroundColor: 'white',
                  borderRadius: '5px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#4a90e2' }}>출하 LOT 수</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    {analytics.totalLots}
                  </p>
                </div>
                <div style={{
                  padding: '15px',
                  backgroundColor: 'white',
                  borderRadius: '5px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#4a90e2' }}>평균 소요시간</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    {analytics.averageProcessTime}
                  </p>
                </div>
                <div style={{
                  padding: '15px',
                  backgroundColor: 'white',
                  borderRadius: '5px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#4a90e2' }}>총 출하 수량(UNIT)</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    {analytics.totalQuantity.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 홀딩 메모 모달 */}
      {showHoldingModal && selectedProduct && (
        <HoldingMemoModal
          onClose={() => {
            setShowHoldingModal(false);
            setSelectedProduct(null);
          }}
          onSave={handleHoldingSave}
        />
      )}
    </div>
  );
}

export default ShippingPanel; 