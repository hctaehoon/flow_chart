import { useState } from 'react';
import { ROUTE_OPTIONS } from '../constants/routes';

function EditProductModal({ product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    quantity: product.quantity,
    currentPosition: product.currentPosition
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // 현재 제품의 루트에 있는 모든 공정 가져오기
  const availableProcesses = ROUTE_OPTIONS[product.route]?.path || [];

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '5px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      <h2>제품 정보 수정</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            수량:
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                quantity: e.target.value
              }))}
            />
          </label>
        </div>
        <div>
          <label>
            현재 공정:
            <select
              value={formData.currentPosition}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                currentPosition: e.target.value
              }))}
            >
              {/* 현재 루트의 모든 공정을 선택 가능하도록 수정 */}
              {availableProcesses.map(process => (
                <option key={process} value={process}>
                  {process}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ marginTop: '20px' }}>
          <button type="submit">저장</button>
          <button type="button" onClick={onClose}>취소</button>
        </div>
      </form>
    </div>
  );
}

export default EditProductModal; 