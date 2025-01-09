import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  calculateNodePosition, 
  decrementProcessCounter, 
  incrementProcessCounter, 
  removeYPosition,
  resetProcessCounter 
} from './utils/nodeUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

// CORS 설정 수정
app.use(cors({
  origin: ['http://43.203.179.67:5173', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: false,
  allowedHeaders: ['Content-Type']
}));

// body-parser 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DB_PATH = path.join(__dirname, 'db.json');

// 제품 데이터를 저장할 경로 설정
const PRODUCTS_PATH = path.join(__dirname, 'products.json');

// 초기 DB 생성
const initDB = async () => {
  try {
    const exists = await fs.access(DB_PATH).then(() => true).catch(() => false);
    if (!exists) {
      await writeDB({ nodes: [], edges: [] });
    } else {
      // 파일이 존재하면 유효성 검사
      try {
        await readDB();
      } catch (error) {
        console.error('Invalid DB file, recreating...');
        await writeDB({ nodes: [], edges: [] });
      }
    }
  } catch (error) {
    console.error('Error initializing DB:', error);
    throw error;
  }
};

// DB 읽기
const readDB = async () => {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    if (!data) {
      // 빈 파일인 경우 기본 구조 반환
      return { nodes: [], edges: [] };
    }
    try {
      return JSON.parse(data);
    } catch (parseError) {
      console.error('Error parsing DB:', parseError);
      // JSON 파싱 에러 시 기본 구조로 복구
      const defaultDB = { nodes: [], edges: [] };
      await writeDB(defaultDB);
      return defaultDB;
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 파일이 없는 경우 기본 구조로 생성
      const defaultDB = { nodes: [], edges: [] };
      await writeDB(defaultDB);
      return defaultDB;
    }
    throw error;
  }
};

// DB 쓰기
const writeDB = async (data) => {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing DB:', error);
    throw error;
  }
};

// 초기 products.json 생성
const initProductsDB = async () => {
  try {
    const exists = await fs.access(PRODUCTS_PATH).then(() => true).catch(() => false);
    if (!exists) {
      // 초기 구조 생성
      await fs.writeFile(PRODUCTS_PATH, JSON.stringify({ products: [] }, null, 2));
    } else {
      // 파일이 존재하면 유효성 검사
      try {
        const data = await readProducts();
        if (!data || !data.products) {
          // 잘못된 구조면 재생성
          await fs.writeFile(PRODUCTS_PATH, JSON.stringify({ products: [] }, null, 2));
        }
      } catch (error) {
        console.error('Invalid products file, recreating...');
        await fs.writeFile(PRODUCTS_PATH, JSON.stringify({ products: [] }, null, 2));
      }
    }
  } catch (error) {
    console.error('Error initializing products DB:', error);
    throw error;
  }
};

// 제품 데이터 읽기
const readProducts = async () => {
  try {
    const data = await fs.readFile(PRODUCTS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading products:', error);
    return { products: [] };
  }
};

// 제품 데이터 쓰기
const writeProducts = async (data) => {
  try {
    await fs.writeFile(PRODUCTS_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing products:', error);
    throw error;
  }
};

// 제품 관련 API 라우트들을 하나의 라우터로 그룹화
const productRouter = express.Router();

// 제품 목록 조회
productRouter.get('/', async (req, res) => {
  try {
    const data = await readProducts();
    res.json(data.products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 제품 등록
productRouter.post('/', async (req, res) => {
  try {
    const data = await readProducts();
    const newProduct = {
      ...req.body,
      id: `product-${Date.now()}`,
      registeredAt: new Date().toISOString(),
      status: 'registered',
      currentPosition: '입고',
      position: calculateNodePosition('입고'),
      isHolding: false,
      holdingMemo: null
    };
    
    data.products.push(newProduct);
    await writeProducts(data);
    
    const dbData = await readDB();
    dbData.nodes.push({
      id: newProduct.id,
      type: 'product',
      position: newProduct.position,
      data: {
        ...newProduct,
        label: newProduct.modelName
      }
    });
    await writeDB(dbData);
    
    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 홀딩 상태 업데이트
productRouter.patch('/:id/holding', async (req, res) => {
  try {
    const productId = req.params.id;
    console.log('Received holding request:', { productId, body: req.body });

    const data = await readProducts();
    const productIndex = data.products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ 
        error: `Product not found: ${productId}` 
      });
    }

    const updatedProduct = {
      ...data.products[productIndex],
      isHolding: req.body.isHolding,
      holdingMemo: req.body.isHolding ? req.body.holdingMemo : null
    };

    data.products[productIndex] = updatedProduct;
    await writeProducts(data);

    const dbData = await readDB();
    const nodeIndex = dbData.nodes.findIndex(n => n.id === productId);
    if (nodeIndex !== -1) {
      dbData.nodes[nodeIndex] = {
        ...dbData.nodes[nodeIndex],
        data: {
          ...dbData.nodes[nodeIndex].data,
          isHolding: req.body.isHolding,
          holdingMemo: req.body.isHolding ? req.body.holdingMemo : null
        }
      };
      await writeDB(dbData);
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating holding status:', error);
    res.status(500).json({ error: error.message });
  }
});

// 라우터 등록
app.use('/api/products', productRouter);

// 모든 노드와 엣지 가져오기
app.get('/api/flow', async (req, res) => {
  try {
    const data = await readDB();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 노드 업데이트
app.post('/api/nodes', async (req, res) => {
  try {
    const data = await readDB();
    data.nodes = req.body;
    await writeDB(data);
    res.json(data.nodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 엣지 업데이트
app.post('/api/edges', async (req, res) => {
  try {
    const data = await readDB();
    data.edges = req.body || []; // 빈 배열을 기본값으로 설정
    await writeDB(data);
    res.json(data.edges);
  } catch (error) {
    console.error('Error updating edges:', error);
    res.status(500).json({ error: error.message });
  }
});

// 제품 정보 업데이트 API
app.patch('/api/products/:id', async (req, res) => {
  try {
    const data = await readProducts();
    const productIndex = data.products.findIndex(p => p.id === req.params.id);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // 이전 위치에서 Y 값 제거
    const oldPosition = data.products[productIndex].currentPosition;
    const oldY = data.products[productIndex].position.y;
    if (oldPosition) {
      removeYPosition(oldPosition, oldY);
    }
    
    // 이전 공정의 카운터 감소
    if (oldPosition) {
      decrementProcessCounter(oldPosition);
    }
    
    // 새로운 공정의 카운터 증가
    if (req.body.currentPosition) {
      incrementProcessCounter(req.body.currentPosition);
    }
    
    // 제품 정보 업데이트
    data.products[productIndex] = {
      ...data.products[productIndex],
      ...req.body,
      position: req.body.position || data.products[productIndex].position
    };
    
    await writeProducts(data);
    
    // db.json의 nodes도 업데이트
    const dbData = await readDB();
    const nodeIndex = dbData.nodes.findIndex(n => n.id === req.params.id);
    if (nodeIndex !== -1) {
      dbData.nodes[nodeIndex] = {
        ...dbData.nodes[nodeIndex],
        position: req.body.position || dbData.nodes[nodeIndex].position,
        data: {
          ...dbData.nodes[nodeIndex].data,
          ...req.body,
          label: data.products[productIndex].modelName
        }
      };
      await writeDB(dbData);
    }
    
    res.json(data.products[productIndex]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// 제품을 출하 리스트로 이동
app.post('/api/products/:id/ship', async (req, res) => {
  try {
    const data = await readProducts();
    const productIndex = data.products.findIndex(p => p.id === req.params.id);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = data.products[productIndex];
    
    // 이전 공정의 카운터 감소
    decrementProcessCounter(product.currentPosition);
    
    product.status = 'shipped';
    product.shippedAt = new Date().toISOString();
    product.totalTime = new Date() - new Date(product.registeredAt);
    
    await writeProducts(data);

    // db.json에서 해당 노드 삭제
    const dbData = await readDB();
    dbData.nodes = dbData.nodes.filter(node => node.id !== req.params.id);
    await writeDB(dbData);

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error in shipping product:', error);
    res.status(500).json({ error: error.message });
  }
});

// 노드 일괄 업데이트 API
app.post('/api/nodes/batch-update', async (req, res) => {
  try {
    const updates = req.body;
    const data = await readDB();
    
    updates.forEach(update => {
      const nodeIndex = data.nodes.findIndex(node => node.id === update.id);
      if (nodeIndex !== -1) {
        data.nodes[nodeIndex].position = update.position;
      }
    });
    
    await writeDB(data);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in batch update:', error);
    res.status(500).json({ error: error.message });
  }
});

// 모든 노드 조회 API 추가
app.get('/api/nodes', async (req, res) => {
  try {
    const data = await readDB();
    res.json(data.nodes);
  } catch (error) {
    console.error('Error getting nodes:', error);
    res.status(500).json({ error: error.message });
  }
});

// 노드 데이터 업데이트 API 추가
app.patch('/api/nodes/:id', async (req, res) => {
  try {
    const data = await readDB();
    const nodeIndex = data.nodes.findIndex(node => node.id === req.params.id);
    
    if (nodeIndex === -1) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    // 기존 노드 데이터 유지하면서 새로운 데이터로 업데이트
    data.nodes[nodeIndex] = {
      ...data.nodes[nodeIndex],
      data: {
        ...data.nodes[nodeIndex].data,
        ...req.body
      }
    };
    
    await writeDB(data);
    res.json(data.nodes[nodeIndex]);
  } catch (error) {
    console.error('Error updating node:', error);
    res.status(500).json({ error: error.message });
  }
});

// 서버 초기화 및 시작
const initializeServer = async () => {
  try {
    await Promise.all([initDB(), initProductsDB()]);
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('API endpoints:');
      console.log('GET     /api/products');
      console.log('POST    /api/products');
      console.log('PATCH   /api/products/:id/holding');
    });
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
};

initializeServer(); 