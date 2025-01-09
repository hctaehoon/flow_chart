const API_URL = import.meta.env.VITE_API_URL;

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('Failed to register product');
    
    const result = await response.json();
    console.log('Product registered:', result);
    onClose();
    window.location.reload();
  } catch (error) {
    console.error('Error registering product:', error);
    alert('제품 등록에 실패했습니다.');
  }
}; 