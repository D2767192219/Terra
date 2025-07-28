// 全局变量
let scene, camera, renderer, earth, controls;
let raycaster, mouse;
let isLoading = true;
let markers = [];
let markerLabels = [];
let infoPopup = null;
let isNavigating = false; // 导航过程中暂停自转

// 视角参数 - 可以调整这些参数来改变视角
const viewSettings = {
    desktop: {
        cameraDistance: 1.8,        // 相机距离
        cameraHeight: 1.5,        // 相机高度
        minDistance: 1.5,         // 最小缩放距离
        maxDistance: 10           // 最大缩放距离
    },
    mobile: {
        cameraDistance: 3.2,      // 手机端相机距离 - 调整为更近
        cameraHeight: 1.2,        // 手机端相机高度 - 调低，更接近中心
        minDistance: 3.0,         // 手机端最小距离
        maxDistance: 5            // 手机端最大距离
    }
};

// 检查Three.js是否加载成功
function checkThreeJS() {
    if (typeof THREE === 'undefined') {
        console.error('Three.js 未加载，请检查网络连接');
        document.getElementById('loading').innerHTML = '<p style="color: red;">Three.js 加载失败，请刷新页面重试</p>';
        return false;
    }
    console.log('Three.js 版本:', THREE.REVISION);
    return true;
}

// 初始化3D场景
function init() {
    try {
        // 创建场景
        scene = new THREE.Scene();
        
        // 检测设备类型
        const isMobile = isMobileDevice();
        
        // 创建相机 - 根据设备类型使用不同参数
        camera = new THREE.PerspectiveCamera(
            isMobile ? 65 : 75,  // 移动设备使用更大视野角度
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        
        // 设置相机初始位置，正对地球，根据设备类型调整
        const settings = isMobile ? viewSettings.mobile : viewSettings.desktop;
        camera.position.set(0, settings.cameraHeight, settings.cameraDistance);
        camera.lookAt(0, 0, 0);
        
        console.log(`相机初始位置: 高度=${settings.cameraHeight}, 距离=${settings.cameraDistance}, 移动设备=${isMobile}`);
        
        // 创建渲染器
        const canvas = document.getElementById('earth-canvas');
        renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // 创建光源
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 3, 5);
        scene.add(directionalLight);
        
        // 创建地球
        createEarth();
        
        // 设置控制器 - 根据设备类型使用不同配置
        setupControls();
        
        // 设置鼠标交互
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        
        // 桌面端使用点击事件
        if (!isMobileDevice()) {
            renderer.domElement.addEventListener('click', onMouseClick, false);
        } else {
            // 移动端使用触摸事件
            console.log('移动设备：设置触摸事件');
            setupMobileTouchEvents();
        }
        
        // 监听窗口大小变化
        window.addEventListener('resize', onWindowResize, false);
        
        // 开始动画循环
        animate();
        
        // 为了确保初始渲染正常，设置初始旋转值使经度0度朝向用户
        if (earth) {
            earth.rotation.y = Math.PI; // 初始化时让经度0度（格林尼治）朝向用户
            
            // 禁用地球自动旋转一小段时间，确保初始化稳定
            const currentAutoRotate = controls.autoRotate;
            controls.autoRotate = false;
            setTimeout(() => {
                controls.autoRotate = currentAutoRotate;
            }, 1000);
        }
        
    } catch (error) {
        console.error('初始化失败:', error);
        document.getElementById('loading').innerHTML = '<p style="color: red;">初始化失败: ' + error.message + '</p>';
    }
}

// 设置光源
function setupLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // 定向光（模拟太阳光）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
}

// 创建地球
function createEarth() {
    // 创建球体几何
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    
    // 加载地球纹理
    const textureLoader = new THREE.TextureLoader();
    
    // 使用最简单的纹理加载方式
    const earthTexture = textureLoader.load(
        'textures/Blue_Marble_Next_Generation_+_topography_+_bathymetry.jpg',
        function() {
            // 纹理加载成功
            console.log('地球纹理加载成功');
            document.getElementById('loading').classList.add('hidden');
            isLoading = false;
        },
        undefined,
        function(error) {
            console.warn('地球纹理加载失败，使用备用纹理');
            // 使用备用纹理
            const backupTexture = createRealisticEarthTexture();
            earth.material.map = backupTexture;
            earth.material.needsUpdate = true;
            document.getElementById('loading').classList.add('hidden');
            isLoading = false;
        }
    );
    
    // 创建材质
    const material = new THREE.MeshPhongMaterial({
        map: earthTexture,
        shininess: 0.1
    });
    
    // 创建地球网格
    earth = new THREE.Mesh(geometry, material);
    scene.add(earth);
    
    // 创建大气层效果
    createAtmosphere();
    
    // 添加地标标记
    createMarkers();
}

// 加载备用地球纹理
function loadAlternativeEarthTexture() {
    const textureLoader = new THREE.TextureLoader();
    
    // 使用本地纹理文件
    const textureSources = [
        // 本地地球纹理
        'textures/earth_texture.jpg',
        'textures/Blue_Marble_Next_Generation_+_topography_+_bathymetry.jpg',
        // 使用程序生成的纹理作为最终备选
        'data:fallback'
    ];
    
    let currentIndex = 0;
    
    function tryLoadTexture() {
        if (currentIndex >= textureSources.length) {
            console.log('所有纹理源都失败，使用程序生成纹理');
            if (earth && earth.material) {
                earth.material.map = createRealisticEarthTexture();
                earth.material.needsUpdate = true;
            }
            return createRealisticEarthTexture();
        }
        
        const currentSource = textureSources[currentIndex];
        
        // 特殊处理：如果是fallback标记，直接使用程序生成纹理
        if (currentSource === 'data:fallback') {
            console.log('使用程序生成的地球纹理');
            const generatedTexture = createRealisticEarthTexture();
            if (earth && earth.material) {
                earth.material.map = generatedTexture;
                earth.material.needsUpdate = true;
            }
            return generatedTexture;
        }
        
        return textureLoader.load(
            currentSource,
            function(texture) {
                console.log('备用地球纹理加载成功：', currentSource);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                
                // 更新地球材质
                if (earth && earth.material) {
                    earth.material.map = texture;
                    earth.material.needsUpdate = true;
                }
                
                return texture;
            },
            undefined,
            function(error) {
                console.warn('纹理加载失败：', currentSource);
                currentIndex++;
                setTimeout(() => tryLoadTexture(), 500); // 延迟0.5秒后尝试下一个
            }
        );
    }
    
    return tryLoadTexture();
}

// 创建真实的地球纹理
function createRealisticEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // 创建海洋背景
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGradient.addColorStop(0, '#1e3c72');
    oceanGradient.addColorStop(0.5, '#2a5298');
    oceanGradient.addColorStop(1, '#1e3c72');
    
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制大陆 - 提高可见度
    
    // 亚洲 - 使用更明显的形状和颜色
    ctx.fillStyle = '#3CB371'; // 中等海绿色，更鲜明
    ctx.beginPath();
    // 放大亚洲形状，使其更加突出
    ctx.moveTo(315, 60);  // 更靠上，更靠左
    ctx.quadraticCurveTo(350, 40, 400, 50);  
    ctx.quadraticCurveTo(440, 70, 460, 110);  // 更靠右
    ctx.quadraticCurveTo(450, 150, 410, 160);
    ctx.quadraticCurveTo(370, 170, 330, 150);
    ctx.quadraticCurveTo(310, 110, 315, 60);
    ctx.fill();
    
    // 欧洲 - 与亚洲衔接
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.ellipse(280, 80, 45, 35, 0, 0, 2 * Math.PI); // 略微增大
    ctx.fill();
    
    // 非洲
    ctx.fillStyle = '#DAA520';
    ctx.beginPath();
    ctx.ellipse(300, 150, 30, 60, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // 北美洲
    ctx.fillStyle = '#8FBC8F';
    ctx.beginPath();
    ctx.ellipse(120, 100, 50, 40, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // 南美洲
    ctx.fillStyle = '#9ACD32';
    ctx.beginPath();
    ctx.ellipse(150, 180, 25, 50, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // 澳洲 - 更明显的形状和颜色
    ctx.fillStyle = '#E9C397'; // 更亮的橙棕色
    ctx.beginPath();
    // 使更接近澳大利亚形状的路径更加突出
    ctx.moveTo(400, 185);
    ctx.quadraticCurveTo(420, 175, 440, 180);
    ctx.quadraticCurveTo(455, 190, 450, 215);
    ctx.quadraticCurveTo(430, 230, 405, 225);
    ctx.quadraticCurveTo(390, 210, 400, 185);
    ctx.fill();
    
    // 添加高亮效果到亚洲地区，使其更加醒目
    const asiaGradient = ctx.createRadialGradient(380, 100, 10, 380, 100, 80);
    asiaGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    asiaGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = asiaGradient;
    ctx.beginPath();
    ctx.arc(380, 100, 80, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加边界线以提高视觉分离度，使用更粗的线条
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#333333';
    
    // 为亚洲添加边界线（使用相同的亚洲形状）
    ctx.beginPath();
    ctx.moveTo(315, 60);
    ctx.quadraticCurveTo(350, 40, 400, 50);  
    ctx.quadraticCurveTo(440, 70, 460, 110);
    ctx.quadraticCurveTo(450, 150, 410, 160);
    ctx.quadraticCurveTo(370, 170, 330, 150);
    ctx.quadraticCurveTo(310, 110, 315, 60);
    ctx.stroke();
    
    // 为亚洲添加第二个高亮边界，使其更加突出
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke(); // 再次描边，添加高亮效果
    
    // 其他大陆边界
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#333333';
    
    ctx.beginPath();
    ctx.ellipse(280, 80, 45, 35, 0, 0, 2 * Math.PI); // 欧洲
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(300, 150, 30, 60, 0, 0, 2 * Math.PI); // 非洲
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(120, 100, 50, 40, 0, 0, 2 * Math.PI); // 北美洲
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(150, 180, 25, 50, 0, 0, 2 * Math.PI); // 南美洲
    ctx.stroke();
    
    ctx.beginPath();
    // 澳洲边界线（与形状一致）
    ctx.moveTo(400, 185);
    ctx.quadraticCurveTo(420, 175, 440, 180);
    ctx.quadraticCurveTo(455, 190, 450, 215);
    ctx.quadraticCurveTo(430, 230, 405, 225);
    ctx.quadraticCurveTo(390, 210, 400, 185);
    ctx.stroke();
    
    // 添加亚洲地标标记 - 确保中国区域特别醒目
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(380, 90, 5, 0, Math.PI * 2); // 中国区域标记
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
}

// 创建大气层效果
function createAtmosphere() {
    // 创建大气层 - 保持现有的大气层效果
    const atmosphereGeometry = new THREE.SphereGeometry(1.025, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide
    });
    
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
    
    // 添加云层 - 使用现有的云层纹理
    const textureLoader = new THREE.TextureLoader();
    
    // 尝试多个云层纹理源
    const tryLoadCloudTexture = () => {
        // 尝试不同的纹理路径
        const texturePaths = [
            'textures/earth_clouds.png',  // 本地文件
            '/textures/earth_clouds.png', // 绝对路径
            './textures/earth_clouds.png', // 相对路径
            'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png' // 远程备用
        ];
        
        // 尝试加载第一个纹理
        return tryNextTexture(0);
        
        function tryNextTexture(index) {
            if (index >= texturePaths.length) {
                // 所有纹理都失败，创建备用纹理
                return createFallbackCloudTexture();
            }
            
            console.log(`尝试加载云层纹理: ${texturePaths[index]}`);
            return textureLoader.load(
                texturePaths[index],
                function(texture) {
                    console.log(`云层纹理加载成功: ${texturePaths[index]}`);
                    
                    // 成功加载后立即更新材质
                    if (window.cloudLayer && window.cloudLayer.material) {
                        window.cloudLayer.material.map = texture;
                        window.cloudLayer.material.needsUpdate = true;
                        console.log('云层材质已更新');
                    }
                },
                undefined,
                function(error) {
                    console.warn(`云层纹理加载失败: ${texturePaths[index]}`, error);
                    // 尝试下一个纹理
                    return tryNextTexture(index + 1);
                }
            );
        }
    };
    
    // 创建备用云层纹理
    const createFallbackCloudTexture = () => {
        console.log('创建备用云层纹理');
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1024;
        const context = canvas.getContext('2d');
        
        // 创建一个更明显的云效果
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 添加随机云
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = 20 + Math.random() * 50;
            
            const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(255,255,255,0.7)');
            gradient.addColorStop(0.4, 'rgba(255,255,255,0.4)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }
        
        return new THREE.CanvasTexture(canvas);
    };
    
    // 尝试加载纹理
    const cloudTexture = tryLoadCloudTexture();
    
    // 创建云层几何体 - 稍微大于地球表面
    const cloudGeometry = new THREE.SphereGeometry(1.015, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.45,  // 进一步增加不透明度
        depthWrite: false,  
        side: THREE.FrontSide,
        color: 0xffffff,
        shininess: 5,
        specular: 0x222222 // 轻微镜面高光
    });
    
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    
    // 将云层作为地球的子对象，以便跟随地球移动
    earth.add(clouds);
    
    // 保存云层引用
    window.cloudLayer = clouds;
    
    // 添加云层可见度控制函数
    window.setCloudOpacity = function(value) {
        if (window.cloudLayer && window.cloudLayer.material) {
            const opacity = Math.max(0, Math.min(1, value)); // 限制在0-1之间
            window.cloudLayer.material.opacity = opacity;
            console.log(`云层不透明度设置为: ${opacity}`);
        } else {
            console.warn('云层未找到');
        }
    };
    
    // 确保云层总是优先渲染
    clouds.renderOrder = 10;
    
    // 添加调试信息
    console.log('云层创建完成，参数:', {
        geometry: cloudGeometry.parameters,
        opacity: cloudMaterial.opacity,
        texture: cloudMaterial.map ? '已加载' : '未加载',
        position: clouds.position,
        visible: clouds.visible
    });
    
    // 在控制台中提供调试命令
    console.log('调试命令: 输入 window.setCloudOpacity(0.8) 增加云层可见度');
}

// 扩展的地标数据 - 更多著名城市和地理景观
const landmarkData = [
    // 亚洲城市
    { lat: 39.9042, lng: 116.4074, name: "北京", type: "city", description: "中国首都，拥有悠久历史的文化名城，有故宫、长城等世界著名景点", aiPrompt: "告诉我北京的历史和文化", priority: 1 },
    { lat: 31.2304, lng: 121.4737, name: "上海", type: "city", description: "中国最大的城市", aiPrompt: "上海是如何成为国际金融中心的？", priority: 1 },
    { lat: 35.6762, lng: 139.6503, name: "东京", type: "city", description: "日本首都", aiPrompt: "介绍一下东京的科技和文化", priority: 1 },
    { lat: 22.3193, lng: 114.1694, name: "香港", type: "city", description: "国际金融中心", aiPrompt: "香港在全球金融中扮演什么角色？", priority: 2 },
    { lat: 1.3521, lng: 103.8198, name: "新加坡", type: "city", description: "东南亚城邦国家", aiPrompt: "新加坡是如何变得如此繁荣的？", priority: 2 },
    { lat: 37.5665, lng: 126.9780, name: "首尔", type: "city", description: "韩国首都", aiPrompt: "告诉我首尔的科技产业" },
    { lat: 28.6139, lng: 77.2090, name: "新德里", type: "city", description: "印度首都", aiPrompt: "新德里在印度历史中的意义是什么？" },
    
    // 欧洲城市
    { lat: 51.5074, lng: -0.1278, name: "伦敦", type: "city", description: "英国首都", aiPrompt: "是什么让伦敦成为全球化城市？", priority: 1 },
    { lat: 48.8566, lng: 2.3522, name: "巴黎", type: "city", description: "法国首都", aiPrompt: "告诉我巴黎的艺术和文化场景", priority: 1 },
    { lat: 52.5200, lng: 13.4050, name: "柏林", type: "city", description: "德国首都", aiPrompt: "自德国统一以来柏林发生了哪些变化？", priority: 2 },
    { lat: 55.7558, lng: 37.6176, name: "莫斯科", type: "city", description: "俄罗斯首都", aiPrompt: "莫斯科的历史重要性是什么？" },
    { lat: 41.9028, lng: 12.4964, name: "罗马", type: "city", description: "意大利首都", aiPrompt: "告诉我古罗马的遗产" },
    
    // 北美城市
    { lat: 40.7128, lng: -74.0060, name: "纽约", type: "city", description: "美国最大城市", aiPrompt: "为什么纽约被称为'大苹果'？", priority: 1 },
    { lat: 34.0522, lng: -118.2437, name: "洛杉矶", type: "city", description: "娱乐之都", aiPrompt: "洛杉矶是如何成为娱乐之都的？", priority: 2 },
    { lat: 41.8781, lng: -87.6298, name: "芝加哥", type: "city", description: "风城", aiPrompt: "芝加哥以什么著名？" },
    { lat: 45.5017, lng: -73.5673, name: "蒙特利尔", type: "city", description: "魁北克最大城市", aiPrompt: "告诉我蒙特利尔的双语文化" },
    
    // 南美城市
    { lat: -23.5505, lng: -46.6333, name: "圣保罗", type: "city", description: "巴西最大城市", aiPrompt: "是什么让圣保罗成为经济强国？" },
    { lat: -22.9068, lng: -43.1729, name: "里约热内卢", type: "city", description: "奇妙城市", aiPrompt: "告诉我里约的狂欢节和海滩" },
    { lat: -34.6037, lng: -58.3816, name: "布宜诺斯艾利斯", type: "city", description: "阿根廷首都", aiPrompt: "布宜诺斯艾利斯的文化意义是什么？" },
    
    // 非洲城市和景点
    { lat: 30.0444, lng: 31.2357, name: "开罗", type: "city", description: "埃及首都", aiPrompt: "告诉我开罗的古代历史", priority: 1 },
    { lat: -26.2041, lng: 28.0473, name: "约翰内斯堡", type: "city", description: "南非经济中心", aiPrompt: "约翰内斯堡的采矿历史是什么？", priority: 2 },
    { lat: 9.0765, lng: 7.3986, name: "阿布贾", type: "city", description: "尼日利亚首都", aiPrompt: "阿布贾的城市规划有何特点？", priority: 2 },
    { lat: 33.9716, lng: -6.8498, name: "拉巴特", type: "city", description: "摩洛哥首都", aiPrompt: "拉巴特有哪些历史文化特色？" },
    { lat: 31.6295, lng: -7.9811, name: "马拉喀什", type: "city", description: "摩洛哥著名旅游城市", aiPrompt: "马拉喀什的集市有什么特色？" },
    { lat: -1.2921, lng: 36.8219, name: "内罗毕", type: "city", description: "肯尼亚首都", aiPrompt: "内罗毕如何融合现代与传统？" },
    { lat: 9.0057, lng: 38.7632, name: "亚的斯亚贝巴", type: "city", description: "埃塞俄比亚首都", aiPrompt: "亚的斯亚贝巴在非洲的政治地位是什么？" },
    { lat: -17.8252, lng: 25.8285, name: "维多利亚瀑布", type: "nature", description: "赞比亚与津巴布韦边境的壮观瀑布", aiPrompt: "维多利亚瀑布如何形成？", priority: 2 },
    { lat: -2.3333, lng: 34.8333, name: "塞伦盖蒂", type: "nature", description: "坦桑尼亚著名国家公园", aiPrompt: "塞伦盖蒂大迁徙是什么？", priority: 2 },
    { lat: -24.7282, lng: 15.4062, name: "纳米比亚沙漠", type: "nature", description: "非洲最古老的沙漠", aiPrompt: "纳米比亚沙漠的生态系统如何适应极端环境？" },
    
    // 中东地区城市和景点
    { lat: 25.2048, lng: 55.2708, name: "迪拜", type: "city", description: "阿联酋最大城市", aiPrompt: "迪拜如何在沙漠中崛起成为全球城市？", priority: 1 },
    { lat: 31.7683, lng: 35.2137, name: "耶路撒冷", type: "city", description: "历史悠久的宗教城市", aiPrompt: "耶路撒冷对三大宗教的意义是什么？", priority: 1 },
    { lat: 21.4225, lng: 39.8262, name: "麦加", type: "city", description: "伊斯兰教圣城", aiPrompt: "麦加在伊斯兰教中的地位是什么？", priority: 1 },
    { lat: 41.0082, lng: 28.9784, name: "伊斯坦布尔", type: "city", description: "横跨欧亚的土耳其大城市", aiPrompt: "伊斯坦布尔为何被称为东西方文明的桥梁？", priority: 2 },
    { lat: 33.3152, lng: 44.3661, name: "巴格达", type: "city", description: "伊拉克首都", aiPrompt: "巴格达在历史上的文化成就有哪些？", priority: 2 },
    { lat: 24.4539, lng: 54.3773, name: "阿布扎比", type: "city", description: "阿联酋首都", aiPrompt: "阿布扎比的现代化转型经历了什么？" },
    { lat: 30.0585, lng: 35.6153, name: "佩特拉", type: "heritage", description: "约旦古城，世界遗产", aiPrompt: "佩特拉古城是如何建造的？", priority: 2 },
    { lat: 31.5497, lng: 35.4963, name: "死海", type: "nature", description: "地球上最低的陆地区域", aiPrompt: "为什么人在死海中会浮起来？" },
    { lat: 35.6828, lng: 51.4238, name: "德黑兰", type: "city", description: "伊朗首都", aiPrompt: "德黑兰的历史发展经历了哪些阶段？" },
    { lat: 29.3759, lng: 47.9774, name: "科威特城", type: "city", description: "科威特首都", aiPrompt: "科威特的石油经济发展历程是怎样的？" },
    
    // 大洋洲城市
    { lat: -33.8688, lng: 151.2093, name: "悉尼", type: "city", description: "澳大利亚最大城市", aiPrompt: "是什么让悉尼港如此著名？" },
    { lat: -37.8136, lng: 144.9631, name: "墨尔本", type: "city", description: "澳大利亚文化之都", aiPrompt: "为什么墨尔本以咖啡文化著名？" },
    
    // 自然奇观
    { lat: 27.9881, lng: 86.9250, name: "珠穆朗玛峰", type: "nature", description: "世界最高峰", aiPrompt: "告诉我攀登珠穆朗玛峰的情况" },
    { lat: 36.0544, lng: -112.1401, name: "大峡谷", type: "nature", description: "科罗拉多大峡谷", aiPrompt: "大峡谷是如何形成的？" },
    { lat: -25.3444, lng: 131.0369, name: "乌鲁鲁", type: "nature", description: "澳洲神圣巨石", aiPrompt: "乌鲁鲁的文化意义是什么？" },
    { lat: 28.7041, lng: 86.9250, name: "喜马拉雅山脉", type: "nature", description: "世界最高山脉", aiPrompt: "告诉我喜马拉雅山脉的生态系统" },
    { lat: -13.1631, lng: -72.5450, name: "马丘比丘", type: "heritage", description: "古印加遗址", aiPrompt: "马丘比丘有什么谜团？" },
    { lat: 27.1751, lng: 78.0421, name: "泰姬陵", type: "heritage", description: "爱情纪念碑", aiPrompt: "告诉我泰姬陵背后的爱情故事" },
    { lat: 29.9792, lng: 31.1342, name: "吉萨金字塔", type: "heritage", description: "古埃及金字塔", aiPrompt: "金字塔是如何建造的？" },
    { lat: 40.4319, lng: 116.5704, name: "长城", type: "heritage", description: "中国古代防御工程", aiPrompt: "建造长城的目的是什么？" },
    { lat: 43.7230, lng: 10.3966, name: "比萨斜塔", type: "heritage", description: "意大利著名斜塔", aiPrompt: "比萨斜塔为什么倾斜？" },
    { lat: 50.1109, lng: 8.6821, name: "新天鹅堡", type: "heritage", description: "童话城堡", aiPrompt: "新天鹅堡的灵感来源是什么？" },
    
    // 地理奇观
    { lat: -24.5, lng: -69.25, name: "阿塔卡马沙漠", type: "nature", description: "世界最干燥沙漠", aiPrompt: "为什么阿塔卡马沙漠如此干燥？" },
    { lat: -3.4653, lng: -62.2159, name: "亚马逊雨林", type: "nature", description: "地球之肺", aiPrompt: "为什么亚马逊雨林很重要？" },
    { lat: 66.5, lng: -18.0, name: "北极圈", type: "nature", description: "北极地区", aiPrompt: "气候变化如何影响北极？" },
    { lat: 19.4326, lng: -155.5915, name: "基拉韦厄火山", type: "nature", description: "夏威夷活火山", aiPrompt: "火山岛是如何形成的？" },
    { lat: 64.0685, lng: -16.2587, name: "瓦特纳冰川", type: "nature", description: "冰岛最大冰川", aiPrompt: "冰川如何塑造地形？" },
    
    // 地质结构和构造
    { lat: -31.9789, lng: 115.9641, name: "澳大利亚西部克拉通", type: "geology", description: "世界最古老的地壳之一，存在约40亿年", aiPrompt: "地球上最古老的地质构造是如何形成和保存的？", priority: 2 },
    { lat: 36.1699, lng: -115.1398, name: "大盆地", type: "geology", description: "北美西部的盆岭省，由于地壳拉张形成的构造盆地", aiPrompt: "什么是盆岭省地形？大盆地的形成机制是什么？" },
    { lat: 0.7893, lng: -90.5808, name: "加拉帕戈斯热点", type: "geology", description: "形成加拉帕戈斯群岛的地幔柱", aiPrompt: "什么是热点？它们如何形成岛屿链？" },
    { lat: 31.2304, lng: 36.7593, name: "阿拉伯构造板块", type: "geology", description: "向北移动与欧亚板块碰撞形成阿尔卑斯-喜马拉雅造山带", aiPrompt: "板块构造理论如何解释山脉的形成？" },
    { lat: -0.5, lng: -80.0, name: "南美板块和纳斯卡板块边界", type: "geology", description: "安第斯山脉的形成区域，活跃的俯冲带", aiPrompt: "什么是俯冲带？安第斯山脉是如何形成的？", priority: 2 },
    { lat: 35.9078, lng: 14.4781, name: "地中海俯冲区", type: "geology", description: "非洲板块向北俯冲于欧亚板块之下的区域", aiPrompt: "地中海地区的地质构造是什么样的？" },
    { lat: 38.0306, lng: -119.0659, name: "长谷断层带", type: "geology", description: "北美最大的断层系统之一", aiPrompt: "断层如何影响地貌？长谷断层的特点是什么？" },
    { lat: -33.7817, lng: 150.3026, name: "蓝山褶皱带", type: "geology", description: "澳大利亚著名的褶皱构造", aiPrompt: "什么是地质褶皱？褶皱是如何形成的？" },
    { lat: 46.2044, lng: 6.1432, name: "阿尔卑斯造山带", type: "geology", description: "欧洲著名造山带，由非洲板块与欧亚板块碰撞形成", aiPrompt: "阿尔卑斯山脉的形成历史是什么？" },
    { lat: 64.7511, lng: -17.5938, name: "冰岛裂谷", type: "geology", description: "大西洋中脊的地表表现，板块分离区", aiPrompt: "大西洋中脊的形成机制是什么？冰岛为什么有如此多的地热活动？", priority: 2 },
    { lat: -19.9233, lng: -67.5755, name: "玻利维亚盐沼", type: "geology", description: "世界最大的盐沼，由远古湖泊蒸发形成", aiPrompt: "盐沼是如何形成的？玻利维亚盐沼有什么特别之处？" },
    { lat: 43.7696, lng: 11.2558, name: "亚平宁山脉", type: "geology", description: "意大利半岛的主要山脉，形成于阿尔卑斯造山运动", aiPrompt: "意大利的地质构造历史是什么？" },
    { lat: 36.2048, lng: -113.7690, name: "科罗拉多高原", type: "geology", description: "广阔的高原地区，展示了数十亿年的地质历史", aiPrompt: "科罗拉多高原的地层记录了哪些地质历史？", priority: 2 },
    { lat: 37.7749, lng: -122.4194, name: "圣安德烈亚斯断层", type: "geology", description: "北美洲和太平洋板块边界的转换断层", aiPrompt: "圣安德烈亚斯断层如何影响加州的地震活动？", priority: 2 },
    { lat: 23.4162, lng: 25.6628, name: "撒哈拉地盾", type: "geology", description: "非洲最古老的前寒武纪地盾区域", aiPrompt: "什么是地盾？撒哈拉地盾的形成年代和特征是什么？" },
    { lat: -34.6118, lng: -58.4173, name: "巴拉那盆地", type: "geology", description: "南美洲最大的沉积盆地之一", aiPrompt: "沉积盆地的形成机制是什么？巴拉那盆地有什么地质特点？" },
    { lat: 10.3833, lng: 123.9167, name: "菲律宾海板块", type: "geology", description: "太平洋板块和欧亚板块之间的小型构造板块", aiPrompt: "菲律宾海板块周边的俯冲带如何导致频繁地震和火山活动？" },
    { lat: -25.3635, lng: 131.0269, name: "艾尔斯岩单体山", type: "geology", description: "世界上最大的单体石头之一，展示了侵蚀作用", aiPrompt: "单体山是如何形成的？艾尔斯岩的地质历史和文化意义是什么？", priority: 2 },
    
    // 海洋特征
    { lat: 25.2744, lng: -77.8385, name: "巴哈马大浅滩", type: "ocean", description: "世界上最大的碳酸盐平台之一，浅水珊瑚礁生态系统", aiPrompt: "珊瑚礁如何形成？巴哈马大浅滩的特殊生态系统有哪些特点？", priority: 2 },
    { lat: 8.9806, lng: -79.5159, name: "巴拿马运河", type: "ocean", description: "连接大西洋与太平洋的人工水道", aiPrompt: "巴拿马运河的建造如何改变了全球航运？它是如何运作的？", priority: 1 },
    { lat: -8.3405, lng: 115.6913, name: "巴厘海峡", type: "ocean", description: "印度尼西亚群岛之间的重要水道，连接印度洋和太平洋", aiPrompt: "海峡对海洋环流有何影响？巴厘海峡的洋流特点是什么？" },
    { lat: 56.5000, lng: -167.5000, name: "白令海", type: "ocean", description: "连接太平洋和北冰洋的边缘海", aiPrompt: "边缘海的定义是什么？白令海在气候调节中扮演什么角色？" },
    { lat: 35.5500, lng: 18.5167, name: "地中海", type: "ocean", description: "世界上最大的内陆海，被欧洲、亚洲和非洲大陆包围", aiPrompt: "地中海的生态系统有哪些特点？它面临着哪些环境挑战？", priority: 2 },
    { lat: -5.3788, lng: -81.2077, name: "秘鲁寒流", type: "ocean", description: "沿南美洲西海岸北上的冷水洋流，富含营养物质", aiPrompt: "寒流如何影响气候和海洋生态？秘鲁寒流与厄尔尼诺现象有何关系？", priority: 2 },
    { lat: 26.5000, lng: -77.0000, name: "墨西哥湾流", type: "ocean", description: "北大西洋最强的海流之一，影响欧洲气候", aiPrompt: "海流如何形成？墨西哥湾流如何影响欧洲的气候？", priority: 1 },
    { lat: -30.0000, lng: 30.0000, name: "印度洋环流", type: "ocean", description: "印度洋的主要洋流系统，随季风变化", aiPrompt: "季风如何影响印度洋环流？这对气候和生态有何影响？" },
    { lat: 0.0000, lng: -25.0000, name: "大西洋中脊", type: "ocean", description: "贯穿大西洋的海底山脉，标志着板块分离的边界", aiPrompt: "大西洋中脊是如何形成的？它对海洋生态有何影响？", priority: 2 },
    { lat: 11.3548, lng: 142.1996, name: "马里亚纳海沟", type: "ocean", description: "地球上已知最深的海沟，位于太平洋西部", aiPrompt: "海沟是如何形成的？马里亚纳海沟的极端环境有什么特点？", priority: 1 },
    { lat: -77.5000, lng: 166.0000, name: "罗斯海", type: "ocean", description: "南极洲附近的边缘海，是重要的海洋生物栖息地", aiPrompt: "极地海洋生态系统有哪些特点？罗斯海的科研价值是什么？" },
    { lat: -5.0000, lng: 90.0000, name: "印度洋三联点", type: "ocean", description: "非洲、印度-澳大利亚和南极洲三大板块的交汇处", aiPrompt: "板块交界处在海底形成了什么样的地质特征？三联点有什么地质意义？" },
    
    // 气象特征
    { lat: 25.7617, lng: -80.1918, name: "飓风走廊", type: "meteorology", description: "大西洋热带气旋频繁经过的区域，影响北美和加勒比地区", aiPrompt: "热带气旋是如何形成的？飓风走廊的形成原因和特点是什么？", priority: 2 },
    { lat: -23.4425, lng: -58.4438, name: "南美季风区", type: "meteorology", description: "南美洲的季节性降雨系统，对亚马逊雨林至关重要", aiPrompt: "季风是如何形成的？南美季风对生态系统有何影响？" },
    { lat: 16.8409, lng: 75.7050, name: "印度季风", type: "meteorology", description: "世界上最著名的季风系统，影响南亚次大陆", aiPrompt: "印度季风的形成机制是什么？它如何影响当地农业和文化？", priority: 1 },
    { lat: 35.6762, lng: -117.5310, name: "沙漠热低压", type: "meteorology", description: "北美西南部沙漠地区形成的热低压系统", aiPrompt: "热低压如何形成？它如何影响局部气候和降水？" },
    { lat: -2.5000, lng: -140.0000, name: "厄尔尼诺南方涛动", type: "meteorology", description: "太平洋的周期性气候现象，影响全球天气模式", aiPrompt: "厄尔尼诺是什么？它如何影响全球气候？", priority: 1 },
    { lat: 60.0000, lng: -35.0000, name: "北大西洋涛动", type: "meteorology", description: "影响北美和欧洲气候的大气压力波动", aiPrompt: "大气涛动是如何影响天气的？北大西洋涛动的特点是什么？", priority: 2 },
    { lat: 38.0000, lng: 138.0000, name: "日本急流", type: "meteorology", description: "东亚上空的强大高空气流，影响东亚和太平洋地区气候", aiPrompt: "急流是什么？它如何影响天气系统的移动？" },
    { lat: -75.0000, lng: 0.0000, name: "极地涡旋", type: "meteorology", description: "南极洲上空的低压区，控制南半球高纬度地区的气候", aiPrompt: "极地涡旋如何影响全球气候？极地涡旋的减弱或增强会导致什么结果？", priority: 2 },
    { lat: 12.0000, lng: -15.0000, name: "热带辐合带", type: "meteorology", description: "靠近赤道的低压带，是世界上降雨最丰富的地区之一", aiPrompt: "热带辐合带是如何形成的？它如何影响全球降雨分布？", priority: 1 },
    { lat: 28.0000, lng: 88.0000, name: "亚洲高压", type: "meteorology", description: "冬季在亚洲内陆形成的强大高压系统", aiPrompt: "高压系统如何影响天气？亚洲高压与季风的关系是什么？" },
    { lat: -20.0000, lng: 125.0000, name: "澳大利亚热低压", type: "meteorology", description: "夏季在澳大利亚内陆形成的热低压系统", aiPrompt: "澳大利亚热低压如何影响当地的气候和降水模式？" }
];

// 将地标数据暴露到window对象
window.landmarkData = landmarkData;

// 创建地标标记
function createMarkers() {
    // 先创建所有标记的位置信息
    const markerPositions = [];
    
    // 定义特殊区域的地标
    const asiaLandmarks = ["北京", "上海", "东京", "香港", "新加坡", "首尔", "新德里", "珠穆朗玛峰", "喜马拉雅山脉", "泰姬陵", "长城"];
    const australiaLandmarks = ["悉尼", "墨尔本", "乌鲁鲁", "澳大利亚西部克拉通", "蓝山褶皱带", "艾尔斯岩单体山"];
    const africaLandmarks = ["开罗", "约翰内斯堡", "吉萨金字塔", "阿布贾", "拉巴特", "马拉喀什", "内罗毕", "亚的斯亚贝巴", "维多利亚瀑布", "塞伦盖蒂", "纳米比亚沙漠", "撒哈拉地盾"];
    const middleEastLandmarks = ["迪拜", "耶路撒冷", "麦加", "伊斯坦布尔", "巴格达", "阿布扎比", "佩特拉", "死海", "德黑兰", "科威特城", "阿拉伯构造板块"];
    const geologicalLandmarks = ["南美板块和纳斯卡板块边界", "冰岛裂谷", "科罗拉多高原", "圣安德烈亚斯断层"];
    const oceanLandmarks = ["马里亚纳海沟", "墨西哥湾流", "巴拿马运河", "大西洋中脊", "巴哈马大浅滩", "地中海", "秘鲁寒流"];
    const meteorologyLandmarks = ["厄尔尼诺南方涛动", "热带辐合带", "极地涡旋", "飓风走廊", "印度季风", "北大西洋涛动"];
    
    // 给所有非洲、中东、重要地质、海洋和气象地标设置更高优先级，确保它们被显示
    landmarkData.forEach((landmark, index) => {
        if ((africaLandmarks.includes(landmark.name) || middleEastLandmarks.includes(landmark.name)) && !landmark.priority) {
            landmark.priority = 2; // 给非洲和中东地标更高优先级
        }
        if (geologicalLandmarks.includes(landmark.name) && !landmark.priority) {
            landmark.priority = 2; // 给重要的地质地标更高优先级
        }
        if (oceanLandmarks.includes(landmark.name) && !landmark.priority) {
            landmark.priority = 2; // 给重要的海洋地标更高优先级
        }
        if (meteorologyLandmarks.includes(landmark.name) && !landmark.priority) {
            landmark.priority = 2; // 给重要的气象地标更高优先级
        }
        
        const position = calculateMarkerPosition(landmark.lat, landmark.lng);
        markerPositions.push({
            position,
            landmark,
            index,
            originalPosition: {...position},
            isSpecial: asiaLandmarks.includes(landmark.name) || 
                      africaLandmarks.includes(landmark.name) || 
                      middleEastLandmarks.includes(landmark.name) ||
                      australiaLandmarks.includes(landmark.name) ||
                      geologicalLandmarks.includes(landmark.name) ||
                      oceanLandmarks.includes(landmark.name) ||
                      meteorologyLandmarks.includes(landmark.name)
        });
    });
    
    // 调整重叠的标记位置
    adjustOverlappingMarkers(markerPositions);
    
    // 创建标记
    markerPositions.forEach((markerPos) => {
        const marker = createMarker(markerPos.position, markerPos.landmark);
        const label = createMarkerLabel(markerPos.position, markerPos.landmark.name);
        
        markers.push({
            mesh: marker,
            label: label,
            data: markerPos.landmark,
            id: markerPos.index,
            position: markerPos.position,
            isSpecial: markerPos.isSpecial
        });
    });
    
    console.log("创建了 " + markers.length + " 个地标");
}

// 计算标记的3D位置
function calculateMarkerPosition(lat, lng) {
    // 球面坐标转换 - 注意经纬度与Three.js坐标系的对应关系
    const phi = (90 - lat) * (Math.PI / 180); // 纬度转球面坐标φ角
    const theta = (lng + 180) * (Math.PI / 180); // 经度转球面坐标θ角，+180调整到0-360度
    
    // 将球面坐标转换为笛卡尔坐标
    // 坐标系变换：保持y轴向上，调整x和z使经度与地球旋转对应
    // 地球绕y轴旋转，当旋转角为0时，z轴指向屏幕外(经度0度)
    const radius = 1.03; // 标记略微位于地球表面之上
    const x = -radius * Math.sin(phi) * Math.cos(theta); // 负号使经度方向与地球旋转对应
    const y = radius * Math.cos(phi); // 北极在y轴正方向
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return { x, y, z };
}

// 调整重叠的标记位置
function adjustOverlappingMarkers(markerPositions) {
    // 亚洲和澳大利亚地标名称，用于特殊处理
    const asiaLandmarks = ["北京", "上海", "东京", "香港", "新加坡", "首尔", "新德里", "珠穆朗玛峰", "喜马拉雅山脉", "泰姬陵", "长城"];
    const australiaLandmarks = ["悉尼", "墨尔本", "乌鲁鲁"];
    const africaLandmarks = ["开罗", "约翰内斯堡", "吉萨金字塔", "阿布贾", "拉巴特", "马拉喀什", "内罗毕", "亚的斯亚贝巴", "维多利亚瀑布", "塞伦盖蒂", "纳米比亚沙漠"];
    const middleEastLandmarks = ["迪拜", "耶路撒冷", "麦加", "伊斯坦布尔", "巴格达", "阿布扎比", "佩特拉", "死海", "德黑兰", "科威特城"];
    
    const minDistance = 0.1; // 标准最小距离
    
    // 首先按大洲分组，然后按优先级排序
    const asiaMarkers = [];
    const australiaMarkers = [];
    const africaMarkers = [];
    const middleEastMarkers = [];
    const otherMarkers = [];
    
    markerPositions.forEach(marker => {
        const name = marker.landmark.name;
        if (asiaLandmarks.includes(name)) {
            asiaMarkers.push(marker);
        } else if (australiaLandmarks.includes(name)) {
            australiaMarkers.push(marker);
        } else if (africaLandmarks.includes(name)) {
            africaMarkers.push(marker);
        } else if (middleEastLandmarks.includes(name)) {
            middleEastMarkers.push(marker);
        } else {
            otherMarkers.push(marker);
        }
    });
    
    // 对各组按优先级排序
    const sortByPriority = (a, b) => {
        const priorityA = a.landmark.priority || 3;
        const priorityB = b.landmark.priority || 3;
        return priorityA - priorityB;
    };
    
    asiaMarkers.sort(sortByPriority);
    australiaMarkers.sort(sortByPriority);
    africaMarkers.sort(sortByPriority);
    middleEastMarkers.sort(sortByPriority);
    otherMarkers.sort(sortByPriority);
    
    // 为每个组分别调整位置 - 使用更小的调整系数以减少移动
    const adjustGroup = (group, localMinDistance) => {
        for (let iteration = 0; iteration < 2; iteration++) { // 减少迭代次数
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    const pos1 = group[i].position;
                    const pos2 = group[j].position;
                    
                    // 计算3D距离
                    const distance = Math.sqrt(
                        Math.pow(pos1.x - pos2.x, 2) +
                        Math.pow(pos1.y - pos2.y, 2) +
                        Math.pow(pos1.z - pos2.z, 2)
                    );
                    
                    if (distance < localMinDistance) {
                        // 计算分离向量
                        const separationVector = {
                            x: pos2.x - pos1.x,
                            y: pos2.y - pos1.y,
                            z: pos2.z - pos1.z
                        };
                        
                        // 规范化并调整距离
                        const length = Math.sqrt(separationVector.x ** 2 + separationVector.y ** 2 + separationVector.z ** 2);
                        if (length > 0) {
                            // 根据优先级决定移动比例
                            const priority1 = group[i].landmark.priority || 3;
                            const priority2 = group[j].landmark.priority || 3;
                            
                            // 优先级高的标记移动较少，优先级低的移动较多
                            let weight1 = 0.2, weight2 = 0.5; // 减小移动比例
                            
                            if (priority1 < priority2) {
                                // i的优先级更高，i移动更少
                                weight1 = 0.05;  // 降低高优先级的移动量
                                weight2 = 0.4;
                            } else if (priority1 > priority2) {
                                // j的优先级更高，j移动更少
                                weight1 = 0.4;
                                weight2 = 0.05;  // 降低高优先级的移动量
                            }
                            
                            const offset = (localMinDistance - distance) / length;
                            
                            // 移动标记，高优先级的移动较少
                            const moveVec1 = {
                                x: -separationVector.x * offset * weight1,
                                y: -separationVector.y * offset * weight1,
                                z: -separationVector.z * offset * weight1
                            };
                            
                            const moveVec2 = {
                                x: separationVector.x * offset * weight2,
                                y: separationVector.y * offset * weight2,
                                z: separationVector.z * offset * weight2
                            };
                            
                            pos1.x += moveVec1.x;
                            pos1.y += moveVec1.y;
                            pos1.z += moveVec1.z;
                            
                            pos2.x += moveVec2.x;
                            pos2.y += moveVec2.y;
                            pos2.z += moveVec2.z;
                            
                            // 重新规范化到地球表面
                            const radius = 1.03;
                            const len1 = Math.sqrt(pos1.x ** 2 + pos1.y ** 2 + pos1.z ** 2);
                            const len2 = Math.sqrt(pos2.x ** 2 + pos2.y ** 2 + pos2.z ** 2);
                            
                            if (len1 > 0 && len2 > 0) {
                                pos1.x = (pos1.x / len1) * radius;
                                pos1.y = (pos1.y / len1) * radius;
                                pos1.z = (pos1.z / len1) * radius;
                                
                                pos2.x = (pos2.x / len2) * radius;
                                pos2.y = (pos2.y / len2) * radius;
                                pos2.z = (pos2.z / len2) * radius;
                            }
                        }
                    }
                }
            }
        }
    };
    
    // 为亚洲、非洲和中东地标使用更大的距离阈值
    adjustGroup(asiaMarkers, minDistance * 1.2);
    adjustGroup(africaMarkers, minDistance * 1.2); 
    adjustGroup(middleEastMarkers, minDistance * 1.2);
    adjustGroup(australiaMarkers, minDistance * 1.1);
    adjustGroup(otherMarkers, minDistance);
    
    // 确保特殊地区的地标不会与其他区域的地标重叠
    const checkCrossRegionOverlap = (group1, group2, localMinDistance) => {
        for (let i = 0; i < group1.length; i++) {
            for (let j = 0; j < group2.length; j++) {
                const pos1 = group1[i].position;
                const pos2 = group2[j].position;
                
                const distance = Math.sqrt(
                    Math.pow(pos1.x - pos2.x, 2) +
                    Math.pow(pos1.y - pos2.y, 2) +
                    Math.pow(pos1.z - pos2.z, 2)
                );
                
                if (distance < localMinDistance) {
                    // 计算分离向量
                    const separationVector = {
                        x: pos2.x - pos1.x,
                        y: pos2.y - pos1.y,
                        z: pos2.z - pos1.z
                    };
                    
                    const length = Math.sqrt(separationVector.x ** 2 + separationVector.y ** 2 + separationVector.z ** 2);
                    if (length > 0) {
                        // 特殊区域地标几乎不移动
                        const weight1 = 0.03;  // 特殊区域地标权重
                        const weight2 = 0.97;  // 其他标记权重
                        
                        const offset = (localMinDistance - distance) / length;
                        
                        const moveVec1 = {
                            x: -separationVector.x * offset * weight1,
                            y: -separationVector.y * offset * weight1,
                            z: -separationVector.z * offset * weight1
                        };
                        
                        const moveVec2 = {
                            x: separationVector.x * offset * weight2,
                            y: separationVector.y * offset * weight2,
                            z: separationVector.z * offset * weight2
                        };
                        
                        pos1.x += moveVec1.x;
                        pos1.y += moveVec1.y;
                        pos1.z += moveVec1.z;
                        
                        pos2.x += moveVec2.x;
                        pos2.y += moveVec2.y;
                        pos2.z += moveVec2.z;
                        
                        // 重新规范化到地球表面
                        const radius = 1.03;
                        const len1 = Math.sqrt(pos1.x ** 2 + pos1.y ** 2 + pos1.z ** 2);
                        const len2 = Math.sqrt(pos2.x ** 2 + pos2.y ** 2 + pos2.z ** 2);
                        
                        if (len1 > 0 && len2 > 0) {
                            pos1.x = (pos1.x / len1) * radius;
                            pos1.y = (pos1.y / len1) * radius;
                            pos1.z = (pos1.z / len1) * radius;
                            
                            pos2.x = (pos2.x / len2) * radius;
                            pos2.y = (pos2.y / len2) * radius;
                            pos2.z = (pos2.z / len2) * radius;
                        }
                    }
                }
            }
        }
    };
    
    // 检查亚洲与其他地区的地标重叠
    checkCrossRegionOverlap(asiaMarkers, otherMarkers, minDistance * 1.2);
    
    // 检查非洲与其他地区的地标重叠
    checkCrossRegionOverlap(africaMarkers, otherMarkers, minDistance * 1.2);
    
    // 检查中东与其他地区的地标重叠
    checkCrossRegionOverlap(middleEastMarkers, otherMarkers, minDistance * 1.2);
    
    // 检查澳洲与其他地区的地标重叠
    checkCrossRegionOverlap(australiaMarkers, otherMarkers, minDistance * 1.2);
    
    // 保存每个标记的原始位置，用于动画效果
    [...asiaMarkers, ...africaMarkers, ...middleEastMarkers, ...australiaMarkers, ...otherMarkers].forEach(markerPos => {
        markerPos.originalPosition = {...markerPos.position};
    });
}

// 创建高科技风格的标记
function createMarker(position, data) {
    // 使用传入的3D坐标
    const { x, y, z } = position;
    
    // 创建标记组
    const markerGroup = new THREE.Group();
    
    // 主标记 - 白色发光球体
    const coreGeometry = new THREE.SphereGeometry(0.015, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 1.0
    });
    const coreMarker = new THREE.Mesh(coreGeometry, coreMaterial);
    
    // 外层光晕效果 - 根据标记类型设置颜色
    const markerColor = getMarkerColor(data.type);
    const glowGeometry = new THREE.SphereGeometry(0.025, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: markerColor,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending // 增加发光效果
    });
    const glowMarker = new THREE.Mesh(glowGeometry, glowMaterial);
    
    // 脉冲环效果
    const ringGeometry = new THREE.RingGeometry(0.03, 0.035, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.lookAt(new THREE.Vector3(0, 0, 0)); // 让环面朝向地心
    
    // 为高优先级标记添加额外的外环
    if (data.priority === 1) {
        const outerRingGeometry = new THREE.RingGeometry(0.04, 0.043, 32);
        const outerRingMaterial = new THREE.MeshBasicMaterial({
            color: markerColor,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        outerRing.lookAt(new THREE.Vector3(0, 0, 0));
        markerGroup.add(outerRing);
        
        // 保存用于动画
        markerGroup.userData.outerRing = outerRing;
    }
    
    // 组合标记
    markerGroup.add(coreMarker);
    markerGroup.add(glowMarker);
    markerGroup.add(ring);
    
    markerGroup.position.set(x, y, z);
    markerGroup.userData = data;
    
    // 保存动画相关对象
    markerGroup.userData.glow = glowMarker;
    markerGroup.userData.ring = ring;
    markerGroup.userData.core = coreMarker;
    
    // 将标记添加为地球的子对象
    earth.add(markerGroup);
    return markerGroup;
}

// 创建标记标签
function createMarkerLabel(position, name) {
    // 使用传入的3D坐标，标签稍微外一点
    const labelRadius = 1.08;
    const markerRadius = 1.03;
    const scale = labelRadius / markerRadius;
    
    const x = position.x * scale;
    const z = position.z * scale;
    const y = position.y * scale;
    
    // 创建高分辨率文字纹理
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // 根据设备像素比调整canvas分辨率，提升文字清晰度
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
    const baseWidth = 512;
    const baseHeight = 128;
    canvas.width = baseWidth * pixelRatio;
    canvas.height = baseHeight * pixelRatio;
    canvas.style.width = baseWidth + 'px';
    canvas.style.height = baseHeight + 'px';
    
    // 缩放context以匹配设备像素比
    context.scale(pixelRatio, pixelRatio);
    
    // 设置高质量文字渲染
    context.textRenderingOptimization = 'optimizeQuality';
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    
    // 设置字体和样式，根据像素比调整字体大小
    const fontSize = Math.max(28, 32 * Math.min(pixelRatio, 1.5));
    context.font = `bold ${fontSize}px "Segoe UI", -apple-system, BlinkMacSystemFont, Arial, sans-serif`;
    context.fillStyle = 'rgba(255, 255, 255, 0.95)';
    context.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    context.lineWidth = Math.max(2, 3 * (pixelRatio * 0.5));
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // 绘制半透明背景
    context.fillStyle = 'rgba(0, 0, 0, 0.4)';
    context.fillRect(0, 0, baseWidth, baseHeight);
    
    // 添加边框效果
    context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    context.lineWidth = 1;
    context.strokeRect(2, 2, baseWidth - 4, baseHeight - 4);
    
    // 绘制文字 - 先描边再填充，提升可读性
    const centerX = baseWidth / 2;
    const centerY = baseHeight / 2;
    
    context.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    context.lineWidth = Math.max(3, 4 * (pixelRatio * 0.5));
    context.strokeText(name, centerX, centerY);
    
    context.fillStyle = 'rgba(255, 255, 255, 0.95)';
    context.fillText(name, centerX, centerY);
    
    // 创建纹理和材质
    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.85,
        alphaTest: 0.1
    });
    
    // 创建精灵
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(x, y, z);
    sprite.scale.set(0.3, 0.075, 1);
    
    // 将标签添加为地球的子对象
    earth.add(sprite);
    return sprite;
}

// 根据类型获取标记颜色
function getMarkerColor(type) {
    const colors = {
        'city': 0x00bfff,      // 深天蓝
        'nature': 0x00ff7f,    // 春绿色
        'heritage': 0xffd700,  // 金色
        'geology': 0xff4500,   // 橙红色（地质特征）
        'ocean': 0x0066cc,     // 深蓝色（海洋特征）
        'meteorology': 0x9966ff // 紫色（气象特征）
    };
    return colors[type] || 0xffffff;
}

// 检测是否为移动设备
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768 || 
           ('ontouchstart' in window);
}

// 设置控制器
function setupControls() {
    const isMobile = isMobileDevice();
    const settings = isMobile ? viewSettings.mobile : viewSettings.desktop;
    
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        
        // 初始化时禁用自动旋转，稍后根据设备类型设置
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0.5;
        
        // 启用阻尼让交互更平滑
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        
        // 根据设备类型设置缩放限制
        controls.minDistance = settings.minDistance;
        controls.maxDistance = settings.maxDistance;
        
        if (isMobile) {
            console.log('移动设备控制器设置: 缩放限制=' + settings.minDistance + '-' + settings.maxDistance);
            
            // 移动设备：禁用旋转，只允许缩放
            controls.enableRotate = false;  // 禁用旋转
            controls.enablePan = false;     // 禁用平移
            controls.enableZoom = false;    // 禁用缩放
            
            // 触摸控制设置
            controls.touches = {
                ONE: null,            // 禁用单指拖拽旋转
                TWO: null             // 禁用双指缩放
            };
            
            console.log('移动设备控制器设置完成 - 禁用所有操作');
        } else {
            // 桌面设备：允许所有操作
            controls.enableRotate = true;
            controls.enablePan = true;
            controls.enableZoom = true;
            controls.maxPolarAngle = Math.PI; // 允许完全绕地球旋转
            
            console.log('桌面设备控制器设置完成 - 完整控制模式');
        }
    } else {
        console.warn('OrbitControls 不可用，使用基本控制');
    }
}

// 设置鼠标交互
function setupMouseInteraction() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // 桌面端点击事件
    renderer.domElement.addEventListener('click', onMouseClick, false);
    
    // 桌面端悬停效果
    if (!isMobileDevice()) {
        renderer.domElement.addEventListener('mousemove', onMouseMove, false);
        renderer.domElement.style.cursor = 'default';
    }
    
    // 移动端触摸点击事件
    if (isMobileDevice()) {
        console.log('移动设备检测：启用触摸控制');
        setupTouchClickDetection();
        
        // 直接添加触摸事件监听器到主渲染画布
        const canvas = document.getElementById('earth-canvas');
        if (canvas) {
            canvas.addEventListener('touchend', function(event) {
                event.preventDefault();
                if (event.changedTouches && event.changedTouches.length > 0) {
                    const touch = event.changedTouches[0];
                    console.log('触摸事件直接处理:', touch.clientX, touch.clientY);
                    
                    // 直接在触摸位置检测地标
                    checkLandmarkAtPosition(touch.clientX, touch.clientY, true);
                }
            }, false);
            console.log('已添加直接触摸事件监听器到画布');
        }
    }
}

// 全新函数：在指定位置检测地标
function checkLandmarkAtPosition(x, y, isTouch = false) {
    console.log(`在位置(${x}, ${y})检测地标${isTouch ? ' [触摸]' : ''}`);
    
    // 将屏幕坐标转换为标准化设备坐标
    const normalizedX = (x / window.innerWidth) * 2 - 1;
    const normalizedY = -(y / window.innerHeight) * 2 + 1;
    
    // 设置射线位置
    raycaster.setFromCamera({ x: normalizedX, y: normalizedY }, camera);
    
    // 获取所有可见标记
    const markerObjects = [];
    markers.forEach(marker => {
        if (marker.mesh && marker.mesh.visible) {
            markerObjects.push(marker.mesh);
        }
    });
    
    // 射线检测
    const intersects = raycaster.intersectObjects(markerObjects, true);
    
    console.log(`射线检测结果: ${intersects.length} 个相交物体`);
    
    // 如果有直接相交的地标
    if (intersects.length > 0) {
        for (const intersect of intersects) {
            // 获取相交物体或其父对象的userData
            let current = intersect.object;
            let userData = current.userData;
            
            while (current && (!userData || !userData.name) && current.parent) {
                current = current.parent;
                userData = current.userData;
            }
            
            if (userData && userData.name) {
                // 找到了有效的地标数据
                const landmarkData = markers.find(m => 
                    m.mesh === current || 
                    (m.data && m.data.name === userData.name)
                );
                
                if (landmarkData) {
                    console.log(`找到地标: ${userData.name}`);
                    showLandmarkInfo(userData, x, y);
                    updateCoordinatesDisplay(userData.lng, userData.lat);
                    return true;
                }
            }
        }
    }
    
    // 如果没有直接点击到地标，查找附近的地标
    const searchRadius = isTouch ? 60 : 30; // 触摸设备使用更大的搜索半径
    const nearbyMarkers = findNearbyMarkers(x, y, searchRadius);
    
    if (nearbyMarkers.length > 0) {
        const nearestMarker = nearbyMarkers[0].marker;
        if (nearestMarker && nearestMarker.data) {
            console.log(`找到附近地标: ${nearestMarker.data.name}, 距离: ${nearbyMarkers[0].actualDistance.toFixed(1)}px`);
            showLandmarkInfo(nearestMarker.data, x, y);
            updateCoordinatesDisplay(nearestMarker.data.lng, nearestMarker.data.lat);
            return true;
        }
    }
    
    // 没有找到地标，隐藏信息弹窗
    console.log('未找到地标');
    hideLandmarkInfo();
    return false;
}

// 重写移动端触摸点击检测
function setupTouchClickDetection() {
    const canvas = document.getElementById('earth-canvas');
    if (!canvas) return;
    
    console.log('设置移动端触摸检测');
    
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };
    
    // 触摸开始
    canvas.addEventListener('touchstart', function(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            touchStartTime = Date.now();
            touchStartPos.x = event.touches[0].clientX;
            touchStartPos.y = event.touches[0].clientY;
            console.log(`触摸开始: (${touchStartPos.x}, ${touchStartPos.y})`);
        }
    }, false);
    
    // 触摸结束
    canvas.addEventListener('touchend', function(event) {
        event.preventDefault();
        
        if (event.changedTouches.length === 1) {
            const touch = event.changedTouches[0];
            const touchEndPos = { x: touch.clientX, y: touch.clientY };
            const touchDuration = Date.now() - touchStartTime;
            const moveDistance = Math.sqrt(
                Math.pow(touchEndPos.x - touchStartPos.x, 2) + 
                Math.pow(touchEndPos.y - touchStartPos.y, 2)
            );
            
            console.log(`触摸结束: (${touchEndPos.x}, ${touchEndPos.y}), 移动: ${moveDistance.toFixed(1)}px, 时长: ${touchDuration}ms`);
            
            // 移动距离小，时长短，认为是点击
            if (moveDistance < 20 && touchDuration < 1000) {
                console.log('触摸符合点击条件，执行地标检测');
                
                // 直接在触摸位置检测地标
                checkLandmarkAtPosition(touchEndPos.x, touchEndPos.y, true);
            }
        }
    }, false);
    
    // 阻止默认的触摸移动行为（如页面滚动）
    canvas.addEventListener('touchmove', function(event) {
        if (event.touches.length === 1) {
            // 只有单指操作时阻止默认行为，允许多指操作（如缩放）
            event.preventDefault();
        }
    }, { passive: false });
    
    console.log('移动设备触摸事件设置完成');
}

// 鼠标移动处理（悬停效果）
function onMouseMove(event) {
    if (isLoading) return;
    
    // 计算鼠标位置
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // 更新射线
    raycaster.setFromCamera(mouse, camera);
    
    // 检测标记点
    const markerMeshes = markers.map(marker => marker.mesh);
    const markerIntersects = raycaster.intersectObjects(markerMeshes, true);
    
    // 重置所有标记的悬停状态
    markers.forEach(marker => {
        if (!marker.mesh.visible) return; // 跳过不可见的标记
        
        if (marker.mesh.userData.glow) {
            marker.mesh.userData.glow.material.opacity = 0.2 + 0.1 * Math.sin(Date.now() * 0.002);
            marker.mesh.scale.set(1, 1, 1);
            
            // 重置发光颜色
            const originalColor = getMarkerColor(marker.data.type);
            marker.mesh.userData.glow.material.color.set(originalColor);
        }
    });
    
    let hasHover = false;
    let hoveredMarker = null;
    
    // 首先尝试直接点击检测
    if (markerIntersects.length > 0) {
        // 查找悬停的标记
        for (const intersect of markerIntersects) {
            let current = intersect.object;
            let markerData = current.userData;
            
            // 向上查找到包含userData的父级组
            while (!markerData.name && current.parent) {
                current = current.parent;
                markerData = current.userData;
            }
            
            if (markerData.name) {
                // 找到对应的标记对象
                hoveredMarker = markers.find(m => m.data.name === markerData.name);
                if (hoveredMarker && hoveredMarker.mesh.userData.glow && hoveredMarker.mesh.visible) {
                    // 标记已找到
                    break;
                } else {
                    hoveredMarker = null;
                }
            }
        }
    }
    
    // 如果直接检测失败，尝试查找附近的标记
    if (!hoveredMarker) {
        const nearbyMarkers = findNearbyMarkers(event.clientX, event.clientY, 30);
        if (nearbyMarkers.length > 0) {
            // 只考虑可见的标记
            const visibleNearbyMarkers = nearbyMarkers.filter(item => item.marker.mesh.visible);
            if (visibleNearbyMarkers.length > 0) {
                hoveredMarker = visibleNearbyMarkers[0].marker;
            }
        }
    }
    
    // 应用悬停效果
    if (hoveredMarker && hoveredMarker.mesh.userData.glow) {
        // 增强悬停效果
        hoveredMarker.mesh.userData.glow.material.opacity = 0.8;
        hoveredMarker.mesh.userData.glow.material.color.set(0xffffff); // 高亮为白色
        hoveredMarker.mesh.scale.set(1.3, 1.3, 1.3);
        
        // 增加标签可见度
        if (hoveredMarker.label) {
            hoveredMarker.label.material.opacity = 1.0;
        }
        
        hasHover = true;
        
        // 如果有多个重叠标记，显示提示
        const overlapping = findOverlappingMarkers(hoveredMarker);
        if (overlapping.length > 1) {
            console.log(`此区域有 ${overlapping.length} 个重叠标记`);
            // 可以在这里实现更多的UI提示
        }
    }
    
    // 更新鼠标样式
    renderer.domElement.style.cursor = hasHover ? 'pointer' : 'default';
}

// 查找与给定标记重叠的其他标记
function findOverlappingMarkers(marker) {
    if (!marker || !marker.mesh) return [];
    
    const overlapping = [];
    const position = marker.position || marker.mesh.position;
    const threshold = 0.1; // 重叠阈值
    
    markers.forEach(other => {
        if (other.id === marker.id || !other.mesh.visible) return;
        
        const otherPosition = other.position || other.mesh.position;
        const distance = Math.sqrt(
            Math.pow(position.x - otherPosition.x, 2) +
            Math.pow(position.y - otherPosition.y, 2) +
            Math.pow(position.z - otherPosition.z, 2)
        );
        
        if (distance < threshold) {
            overlapping.push(other);
        }
    });
    
    // 添加当前标记
    overlapping.push(marker);
    
    return overlapping;
}

// 鼠标点击处理
function onMouseClick(event) {
    handleClick(event);
}

// 触摸点击处理
function onTouchClick(event) {
    // 添加标识，表明这是触摸事件
    event.isTouchEvent = true;
    handleClick(event);
}

// 显示地标信息并集成AI聊天
function showLandmarkInfo(data, x, y) {
    hideLandmarkInfo();
    
    // 检测是否为移动设备
    const isMobile = isMobileDevice();
    
    // 为移动设备使用不同的弹窗类型
    if (isMobile) {
        showMobileLandmarkInfo(data);
    } else {
        showDesktopLandmarkInfo(data, x, y);
    }
    
    // 更新坐标显示
    updateCoordinatesDisplay(data.lng, data.lat);
}

// 为移动设备专门设计的弹窗
function showMobileLandmarkInfo(data) {
    console.log('创建移动设备弹窗');
    
    // 先删除可能存在的旧弹窗
    hideLandmarkInfo();
    
    // 创建一个新的容器，使用不同的类名避免样式冲突
    const mobilePopup = document.createElement('div');
    mobilePopup.className = 'mobile-landmark-popup';
    
    // 根据地标类型决定按钮文本
    let buttonText = "了解更多信息";
    if (data.type === 'geology' || data.type === 'ocean' || data.type === 'meteorology') {
        buttonText = "查看地球科学科普详情";
    }
    
    // 添加HTML内容
    mobilePopup.innerHTML = `
        <div class="popup-header">
            <h3>${data.name}</h3>
            <span class="popup-type ${data.type}">${getTypeLabel(data.type)}</span>
        </div>
        <div class="popup-content">
            <p>${data.description}</p>
            <div class="popup-coordinates">
                <small>📍 ${data.lat.toFixed(4)}°, ${data.lng.toFixed(4)}°</small>
            </div>
            <div class="popup-actions">
                <button class="ask-ai-btn" id="mobileAskButton">
                    🔬 ${buttonText}
                </button>
            </div>
        </div>
        <div class="popup-close" id="mobileCloseButton">×</div>
    `;
    
    // 使用内联样式，并添加!important确保优先级
    const inlineStyles = `
        position: fixed !important;
        left: 50% !important;
        bottom: 20px !important;
        transform: translateX(-50%) !important;
        width: 90% !important;
        max-width: 400px !important;
        margin: 0 auto !important;
        z-index: 9999 !important;
        background-color: rgba(0, 0, 0, 0.85) !important;
        color: white !important;
        padding: 15px !important;
        border-radius: 10px !important;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5) !important;
    `;
    
    mobilePopup.setAttribute('style', inlineStyles);
    
    // 添加到body最后，确保它在顶层
    document.body.appendChild(mobilePopup);
    
    // 保存引用
    infoPopup = mobilePopup;
    
    // 添加事件处理器
    document.getElementById('mobileCloseButton').addEventListener('click', hideLandmarkInfo, false);
    document.getElementById('mobileAskButton').addEventListener('click', function() {
        askAIAboutLandmark('请详细介绍' + data.name + '，包括历史、地理特点和重要意义', data.name);
    }, false);
    
    // 添加显示动画
    setTimeout(() => {
        mobilePopup.style.opacity = '1';
    }, 10);
}

// 为桌面设备设计的弹窗
function showDesktopLandmarkInfo(data, x, y) {
    infoPopup = document.createElement('div');
    infoPopup.className = 'landmark-popup';
    
    // 根据地标类型决定按钮文本
    let buttonText = "了解更多信息";
    if (data.type === 'geology' || data.type === 'ocean' || data.type === 'meteorology') {
        buttonText = "查看地球科学科普详情";
    }
    
    // 只显示基本信息
    infoPopup.innerHTML = `
        <div class="popup-header">
            <h3>${data.name}</h3>
            <span class="popup-type ${data.type}">${getTypeLabel(data.type)}</span>
        </div>
        <div class="popup-content">
            <p>${data.description}</p>
            <div class="popup-coordinates">
                <small>📍 ${data.lat.toFixed(4)}°, ${data.lng.toFixed(4)}°</small>
            </div>
            <div class="popup-actions">
                <button class="ask-ai-btn" onclick="askAIAboutLandmark('请详细介绍${data.name}，包括历史、地理特点和重要意义', '${data.name}')">
                    🔬 ${buttonText}
                </button>
            </div>
        </div>
        <div class="popup-close" onclick="hideLandmarkInfo()">×</div>
    `;
    
    // 桌面端按点击位置显示
    infoPopup.style.left = Math.min(x + 10, window.innerWidth - 350) + 'px';
    infoPopup.style.top = Math.min(y + 10, window.innerHeight - 250) + 'px';
    
    document.body.appendChild(infoPopup);
    
    setTimeout(() => {
        infoPopup.classList.add('show');
    }, 10);
}

// 隐藏地标信息弹窗
function hideLandmarkInfo() {
    // 移除任何现有的弹窗
    const popups = document.querySelectorAll('.landmark-popup, .mobile-landmark-popup');
    popups.forEach(popup => {
        popup.classList.remove('show');
        popup.parentNode.removeChild(popup);
    });
    
    infoPopup = null;
}

// 获取类型标签
function getTypeLabel(type) {
    const labels = {
        'city': '🏙️ 城市',
        'nature': '🏔️ 自然',
        'heritage': '🏛️ 文化遗产',
        'geology': '🌋 地质构造',
        'ocean': '🌊 海洋',
        'meteorology': '☁️ 气象'
    };
    return labels[type] || '📍 地标';
}

// 更新坐标显示
function updateCoordinatesDisplay(lng, lat) {
    const coordinatesElement = document.getElementById('coordinates');
    if (coordinatesElement) {
        coordinatesElement.textContent = `经度: ${lng.toFixed(2)}°, 纬度: ${lat.toFixed(2)}°`;
    }
}

// 基于缩放级别更新标记显示 - 简化版本，确保地球正常显示
function updateMarkerVisibility() {
    // 如果没有相机或标记，直接返回
    if (!camera || !markers || markers.length === 0) return;
    
    const cameraDistance = camera.position.length();
    const zoomLevel = Math.max(0, Math.min(1, (10 - cameraDistance) / (10 - 1.5)));
    
    // 遍历所有标记
    for (let i = 0; i < markers.length; i++) {
        const marker = markers[i];
        
        // 安全检查
        if (!marker || !marker.mesh || !marker.label || !marker.data) continue;
        
        const markerName = marker.data.name || "";
        const markerType = marker.data.type || ""; // city, nature, heritage
        const markerLat = marker.data.lat || 0;
        const markerLng = marker.data.lng || 0;
        
        try {
            // 检查标记是否在地球背面
            const markerPosition = marker.position || marker.mesh.position;
            if (!markerPosition) continue;
            
            const cameraDirection = camera.position.clone().normalize();
            const markerDirection = new THREE.Vector3(
                markerPosition.x, 
                markerPosition.y, 
                markerPosition.z
            ).normalize();
            
            const dotProduct = cameraDirection.dot(markerDirection);
            
            // 设置可见性阈值 - 放宽所有阈值
            let threshold = -0.5; // 默认阈值放宽
            
            // 特殊区域使用更宽松的阈值
            const asiaLandmarks = ["北京", "上海", "东京", "香港", "新加坡", "首尔", "新德里", "珠穆朗玛峰", "喜马拉雅山脉", "泰姬陵", "长城"];
            const australiaLandmarks = ["悉尼", "墨尔本", "乌鲁鲁"];
            const africaLandmarks = ["开罗", "约翰内斯堡", "吉萨金字塔", "阿布贾", "拉巴特", "马拉喀什", "内罗毕", "亚的斯亚贝巴", "维多利亚瀑布", "塞伦盖蒂", "纳米比亚沙漠"];
            const middleEastLandmarks = ["迪拜", "耶路撒冷", "麦加", "伊斯坦布尔", "巴格达", "阿布扎比", "佩特拉", "死海", "德黑兰", "科威特城"];
            
            // 基于纬度检测
            const isAsiaRegion = (markerLat > 0 && markerLat < 60 && markerLng > 60 && markerLng < 150);
            const isAfricaRegion = (markerLat > -35 && markerLat < 35 && markerLng > -20 && markerLng < 50);
            const isAustraliaRegion = (markerLat < 0 && markerLat > -45 && markerLng > 110 && markerLng < 155);
            const isMiddleEastRegion = (markerLat > 15 && markerLat < 42 && markerLng > 25 && markerLng < 60);
            
            const isAsiaLandmark = asiaLandmarks.includes(markerName) || isAsiaRegion;
            const isAustraliaLandmark = australiaLandmarks.includes(markerName) || isAustraliaRegion;
            const isAfricaLandmark = africaLandmarks.includes(markerName) || isAfricaRegion;
            const isMiddleEastLandmark = middleEastLandmarks.includes(markerName) || isMiddleEastRegion;
            
            if (markerType === "nature" || markerType === "heritage" || markerType === "geology" || markerType === "ocean" || markerType === "meteorology") {
                threshold = -0.6; // 自然、文化遗产、地质、海洋和气象更宽松
            }
            
            if (isAsiaLandmark) {
                threshold = -0.9; // 亚洲最宽松
            } else if (isAfricaLandmark) {
                threshold = -0.9; // 非洲与亚洲一样宽松
            } else if (isMiddleEastLandmark) {
                threshold = -0.9; // 中东与亚洲和非洲一样宽松
            } else if (isAustraliaLandmark) {
                threshold = -0.8; // 澳洲次之
            }
            
            // 应用可见性 - 添加特殊处理
            let isVisible = dotProduct > threshold;
            
            // 特殊处理某些重要地标
            if (["开罗", "约翰内斯堡", "迪拜", "耶路撒冷", "麦加", "上海", "北京", "珠穆朗玛峰", "泰姬陵", "吉萨金字塔", "南美板块和纳斯卡板块边界", "冰岛裂谷", "科罗拉多高原", "圣安德烈亚斯断层", "澳大利亚西部克拉通", "艾尔斯岩单体山", "马里亚纳海沟", "墨西哥湾流", "地中海", "厄尔尼诺南方涛动", "热带辐合带", "飓风走廊", "印度季风"].includes(markerName)) {
                isVisible = true; // 确保这些重要地标始终可见
            }
            
            marker.mesh.visible = isVisible;
            if (marker.label) marker.label.visible = isVisible;
            
            // 如果可见，调整大小和透明度
            if (isVisible) {
                // 设置大小
                const sizeBoost = (markerType === "nature" || markerType === "heritage" || markerType === "geology" || markerType === "ocean" || markerType === "meteorology") ? 1.2 : 1.0;
                const scale = Math.max(0.4, Math.min(1.2, (0.4 + zoomLevel * 0.7) * sizeBoost));
                marker.mesh.scale.set(scale, scale, scale);
                
                // 设置标签大小
                const labelScaleX = scale * 0.25;
                const labelScaleY = scale * 0.06;
                marker.label.scale.set(labelScaleX, labelScaleY, 1);
                
                // 设置透明度
                marker.label.material.opacity = 1.0;
            }
        } catch (err) {
            // 忽略错误，确保地球继续渲染
            continue;
        }
    }
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    try {
        // 更新控制器
        if (controls && controls.update) {
            controls.update();
        }
        
        // 地球自转，仅在非导航状态下进行
        if (earth && !isNavigating) {
            // 缓慢地球自转
            earth.rotation.y += 0.0008;
            
            // 云层独立旋转 - 现在云层是地球的子对象，所以使用相对旋转
            if (window.cloudLayer) {
                // 轻微递增云层的相对旋转，创造云层与地球表面相对运动的效果
                window.cloudLayer.rotation.y += 0.0002;
            }
            
            // 更新标记可见性
            updateMarkerVisibility();
            
            // 标记动画效果
            const time = Date.now() * 0.001;
            if (markers && markers.length) {
                for (let i = 0; i < markers.length; i++) {
                    const marker = markers[i];
                    if (!marker || !marker.mesh || !marker.mesh.visible) continue;
                    
                    const markerName = marker.data ? marker.data.name : "";
                    
                    // 亚洲、非洲、中东、澳洲、地质构造、海洋和气象地标特殊处理
                    const asiaLandmarks = ["北京", "上海", "东京", "香港", "新加坡", "首尔", "新德里", "珠穆朗玛峰", "喜马拉雅山脉", "泰姬陵", "长城"];
                    const australiaLandmarks = ["悉尼", "墨尔本", "乌鲁鲁", "澳大利亚西部克拉通", "蓝山褶皱带", "艾尔斯岩单体山"];
                    const africaLandmarks = ["开罗", "约翰内斯堡", "吉萨金字塔", "阿布贾", "拉巴特", "马拉喀什", "内罗毕", "亚的斯亚贝巴", "维多利亚瀑布", "塞伦盖蒂", "纳米比亚沙漠", "撒哈拉地盾"];
                    const middleEastLandmarks = ["迪拜", "耶路撒冷", "麦加", "伊斯坦布尔", "巴格达", "阿布扎比", "佩特拉", "死海", "德黑兰", "科威特城", "阿拉伯构造板块"];
                    const geologicalLandmarks = ["南美板块和纳斯卡板块边界", "冰岛裂谷", "科罗拉多高原", "圣安德烈亚斯断层"];
                    const oceanLandmarks = ["马里亚纳海沟", "墨西哥湾流", "巴拿马运河", "大西洋中脊", "巴哈马大浅滩", "地中海", "秘鲁寒流"];
                    const meteorologyLandmarks = ["厄尔尼诺南方涛动", "热带辐合带", "极地涡旋", "飓风走廊", "印度季风", "北大西洋涛动"];
                    
                    const isAsiaLandmark = asiaLandmarks.includes(markerName);
                    const isAustraliaLandmark = australiaLandmarks.includes(markerName);
                    const isAfricaLandmark = africaLandmarks.includes(markerName);
                    const isMiddleEastLandmark = middleEastLandmarks.includes(markerName);
                    const isGeologicalLandmark = geologicalLandmarks.includes(markerName);
                    const isOceanLandmark = oceanLandmarks.includes(markerName);
                    const isMeteorologyLandmark = meteorologyLandmarks.includes(markerName);
                    const isSpecialLandmark = isAsiaLandmark || isAustraliaLandmark || isAfricaLandmark || isMiddleEastLandmark || isGeologicalLandmark || isOceanLandmark || isMeteorologyLandmark;
                    
                    if (marker.mesh.userData.glow) {
                        // 光晕呼吸效果
                        marker.mesh.userData.glow.material.opacity = 0.2 + 0.1 * Math.sin(time * 2);
                        
                        // 给特殊地区地标添加更明显的光晕
                        if (isSpecialLandmark) {
                            marker.mesh.userData.glow.material.opacity = 0.3 + 0.15 * Math.sin(time * 2);
                            marker.mesh.userData.glow.scale.setScalar(1.1 + 0.05 * Math.sin(time * 2));
                        }
                    }
                    
                    if (marker.mesh.userData.ring) {
                        // 环形脉冲效果
                        const pulse = 0.6 + 0.2 * Math.sin(time * 3);
                        marker.mesh.userData.ring.material.opacity = pulse;
                        marker.mesh.userData.ring.scale.setScalar(1 + 0.1 * Math.sin(time * 2));
                        
                        // 给特殊地区地标添加更明显的脉冲
                        if (isSpecialLandmark) {
                            marker.mesh.userData.ring.material.opacity = pulse + 0.1;
                            marker.mesh.userData.ring.scale.setScalar(1.1 + 0.12 * Math.sin(time * 2));
                        }
                    }
                    
                    // 为高优先级标记添加额外的动画效果
                    if (marker.mesh.userData.outerRing && marker.data.priority === 1) {
                        marker.mesh.userData.outerRing.rotation.z = time * 0.5; // 缓慢旋转外环
                        marker.mesh.userData.outerRing.scale.setScalar(1 + 0.15 * Math.sin(time * 1.5));
                    }
                }
            }
        }
        
        // 渲染场景
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    } catch (error) {
        console.error('动画循环错误:', error);
    }
}

// 窗口大小变化处理
function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        // 重新设置像素比以适应可能的设备旋转或缩放变化
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
        
        // 检查是否从桌面切换到移动端或反之，重新设置控制器
        const currentIsMobile = isMobileDevice();
        const wasConfiguredForMobile = controls && !controls.enableRotate;
        
        if (currentIsMobile !== wasConfiguredForMobile) {
            console.log('设备类型变化，重新配置控制器...');
            setupControls();
            updateControlsInfo();
        }
    }
}

// 切换信息面板显示
function toggleInfoPanel() {
    const panel = document.getElementById('info-panel');
    const toggle = document.getElementById('info-toggle');
    
    if (panel && toggle) {
        panel.classList.toggle('hidden');
        toggle.classList.toggle('active');
    }
}

// 切换地标列表显示
function toggleLandmarksList() {
    const panel = document.getElementById('landmarks-panel');
    if (panel) {
        // 如果是首次显示，生成地标列表内容
        if (panel.innerHTML.trim() === '' || panel.querySelectorAll('.landmark-item').length === 0) {
            generateLandmarksList(panel);
        }
        
        panel.classList.toggle('hidden');
    }
}

// 生成地标列表内容
function generateLandmarksList(panel) {
    // 创建列表容器
    panel.innerHTML = `
        <div class="landmarks-panel-header">
        <h3>🌍 全球地标列表</h3>
            <button class="close-btn" onclick="toggleLandmarksList()">×</button>
        </div>
        <div class="landmark-categories">
            <button class="category-btn active" data-type="all">全部</button>
            <button class="category-btn" data-type="city">城市</button>
            <button class="category-btn" data-type="nature">自然</button>
            <button class="category-btn" data-type="heritage">文化遗产</button>
            <button class="category-btn" data-type="geology">地质构造</button>
            <button class="category-btn" data-type="ocean">海洋</button>
            <button class="category-btn" data-type="meteorology">气象</button>
        </div>
        <div id="landmarks-list"></div>
    `;
    
    // 按类型分组地标
    const landmarksByType = {
        city: [],
        nature: [],
        heritage: [],
        geology: [],
        ocean: [],
        meteorology: []
    };
    
    // 按照优先级排序地标
    const sortedLandmarks = [...landmarkData].sort((a, b) => {
        const priorityA = a.priority || 3;
        const priorityB = b.priority || 3;
        return priorityA - priorityB;
    });
    
    // 填充分组数据
    sortedLandmarks.forEach(landmark => {
        if (landmarksByType[landmark.type]) {
            landmarksByType[landmark.type].push(landmark);
        }
    });
    
    // 渲染所有地标
    const listContainer = panel.querySelector('#landmarks-list');
    renderLandmarkItems(listContainer, sortedLandmarks);
    
    // 添加分类按钮点击事件
    const categoryButtons = panel.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 更新按钮状态
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 显示对应类型的地标
            const type = button.getAttribute('data-type');
            if (type === 'all') {
                renderLandmarkItems(listContainer, sortedLandmarks);
            } else {
                renderLandmarkItems(listContainer, landmarksByType[type]);
            }
        });
    });
}

// 渲染地标项目
function renderLandmarkItems(container, landmarks) {
    container.innerHTML = '';
    
    if (landmarks.length === 0) {
        container.innerHTML = '<div class="no-landmarks">没有找到地标</div>';
        return;
    }
    
    landmarks.forEach(landmark => {
        const item = document.createElement('div');
        item.className = 'landmark-item';
        item.onclick = () => navigateToLandmark(landmark.lat, landmark.lng, landmark.name);
        
        const typeLabel = getTypeLabel(landmark.type);
        const priorityClass = landmark.priority === 1 ? 'high-priority' : '';
        
        item.innerHTML = `
            <h4 class="${priorityClass}">${landmark.name}</h4>
            <p>${landmark.description}</p>
            <div class="landmark-meta">
                <span class="landmark-type ${landmark.type}">${typeLabel}</span>
                <span class="landmark-coords">📍 ${landmark.lat.toFixed(1)}°, ${landmark.lng.toFixed(1)}°</span>
            </div>
        `;
        
        container.appendChild(item);
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，开始初始化...');
    init();
    
    // 给搜索框添加回车键事件
    const searchInput = document.getElementById('landmark-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchLandmarks();
            }
        });
    }
});

// 更新操作说明显示
function updateControlsInfo() {
    const isMobile = isMobileDevice();
    const desktopControls = document.getElementById('desktop-controls');
    const mobileControls = document.getElementById('mobile-controls');
    
    if (desktopControls && mobileControls) {
        if (isMobile) {
            desktopControls.style.display = 'none';
            mobileControls.style.display = 'block';
        } else {
            desktopControls.style.display = 'block';
            mobileControls.style.display = 'none';
        }
    }
}

// 搜索地标功能
function searchLandmarks() {
    const searchInput = document.getElementById('landmark-search');
    const query = searchInput.value.trim().toLowerCase();
    
    if (query.length < 1) return;
    
    // 搜索结果
    const results = landmarkData.filter(landmark => {
        return landmark.name.toLowerCase().includes(query) || 
               landmark.description.toLowerCase().includes(query) ||
               landmark.type.toLowerCase().includes(query);
    });
    
    // 显示搜索结果
    showSearchResults(results, query);
}

// 显示搜索结果
function showSearchResults(results, query) {
    // 移除之前的结果面板
    const oldResults = document.querySelector('.search-results');
    if (oldResults) {
        oldResults.remove();
    }
    
    // 创建新的结果面板
    const resultsPanel = document.createElement('div');
    resultsPanel.className = 'search-results';
    
    let content = `
        <h3>搜索结果: "${query}"</h3>
        <button class="close-btn" onclick="closeSearchResults()">×</button>
    `;
    
    if (results.length > 0) {
        content += '<ul>';
        results.forEach(landmark => {
            content += `
                <li onclick="navigateToLandmark(${landmark.lat}, ${landmark.lng}, '${landmark.name}')">
                    <span class="result-name">${landmark.name}</span>
                    <span class="result-type">${getTypeLabel(landmark.type)}</span>
                    <div class="result-desc">${landmark.description}</div>
                </li>
            `;
        });
        content += '</ul>';
    } else {
        content += '<div class="no-results">没有找到匹配的地标</div>';
    }
    
    resultsPanel.innerHTML = content;
    document.body.appendChild(resultsPanel);
    
    // 显示动画
    setTimeout(() => {
        resultsPanel.classList.add('show');
    }, 10);
    
    // 记录搜索历史
    console.log(`搜索地标: "${query}", 找到 ${results.length} 个结果`);
}

// 关闭搜索结果
function closeSearchResults() {
    const resultsPanel = document.querySelector('.search-results');
    if (resultsPanel) {
        resultsPanel.classList.remove('show');
        setTimeout(() => {
            resultsPanel.remove();
        }, 300);
    }
}

// 导航到特定地标
function navigateToLandmark(lat, lng, name) {
    // 查找对应的地标
    const landmark = landmarkData.find(item => item.name === name);
    if (!landmark) return;
    
    // 设置导航状态，停止自转
    isNavigating = true;
    
    console.log(`导航到地标: ${name}, 经度: ${lng}, 纬度: ${lat}`);
    
    // 移除任何箭头
    removeDirectionArrow();
    
    // 注意：经过分析，初始化时earth.rotation.y = Math.PI时，经度0°朝向用户
    // 因此我们需要调整公式，将地标旋转到相机前面
    
    // 1. 找到标记物在3D空间中的位置
    const marker = markers.find(m => m.data.name === name);
    if (!marker || !marker.mesh) return;
    
    // 2. 标记的3D位置（这已经包含了经纬度转换的信息）
    const markerPos = marker.mesh.position.clone();
    
    // 3. 计算标记物当前在XZ平面上的角度（相对于原点）
    const angleXZ = Math.atan2(markerPos.x, markerPos.z);
    
    // 4. 我们希望将这个点旋转到相机前方，相机位于(0,y,z)，因此目标是使点位于(-x,y,0)
    // 需要旋转的角度 = PI/2 - 当前角度
    const targetRotation = Math.PI - angleXZ + Math.PI/2+ Math.PI/4; // 加上90度(π/2)旋转
    
    // 5. 计算从当前旋转到目标旋转所需的角度变化（确保走最短路径）
    const currentRotation = earth.rotation.y;
    let deltaRotation = ((targetRotation - currentRotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    if (deltaRotation > Math.PI) {
        deltaRotation -= 2 * Math.PI;
    }
    
    console.log(`标记3D位置: (${markerPos.x.toFixed(2)}, ${markerPos.y.toFixed(2)}, ${markerPos.z.toFixed(2)})`);
    console.log(`XZ平面角度: ${(angleXZ * 180 / Math.PI).toFixed(2)}°`);
    console.log(`当前旋转: ${(currentRotation * 180 / Math.PI).toFixed(2)}°`);
    console.log(`目标旋转: ${(targetRotation * 180 / Math.PI).toFixed(2)}°`);
    console.log(`旋转差值: ${(deltaRotation * 180 / Math.PI).toFixed(2)}°`);
    
    // 使用动画平滑旋转地球
    const duration = 1000; // 动画持续时间（毫秒）
    const startTime = Date.now();
    
    // 平滑旋转动画函数
    function rotateEarth() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数使动画更自然
        const easeProgress = easeOutQuad(progress);
        
        // 计算当前旋转角度
        const newRotation = currentRotation + deltaRotation * easeProgress;
        earth.rotation.y = newRotation;
        
        // 如果动画未完成，继续执行
        if (progress < 1) {
            requestAnimationFrame(rotateEarth);
        } else {
            // 记录一下最终屏幕位置，用于调试
            if (marker && marker.mesh) {
                const finalPos = marker.mesh.position.clone();
                const screenPos = getScreenPosition(finalPos);
                const screenCenter = {
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2
                };
                
                console.log(`地标最终3D位置: (${finalPos.x.toFixed(2)}, ${finalPos.y.toFixed(2)}, ${finalPos.z.toFixed(2)})`);
                console.log(`地标屏幕坐标: (${screenPos.x.toFixed(0)}, ${screenPos.y.toFixed(0)})`);
                console.log(`屏幕中心: (${screenCenter.x.toFixed(0)}, ${screenCenter.y.toFixed(0)})`);
                console.log(`与中心的偏移: X=${(screenPos.x - screenCenter.x).toFixed(0)}px, Y=${(screenPos.y - screenCenter.y).toFixed(0)}px`);
                
                // 显示地标信息
                showLandmarkInfo(landmark, screenPos.x, screenPos.y);
            }
            
            // 延迟一段时间后恢复自转
            setTimeout(() => {
                isNavigating = false;
            }, 1000);
        }
    }
    
    // 开始旋转动画
    rotateEarth();
    
    // 更新坐标显示
    updateCoordinatesDisplay(lng, lat);
    
    // 关闭搜索结果
    closeSearchResults();
}

// 移除方向箭头
function removeDirectionArrow() {
    const arrow = scene.getObjectByName("directionArrow");
    if (arrow) {
        scene.remove(arrow);
    }
}

// 为箭头添加动画效果
function animateDirectionArrow(arrowGroup) {
    if (!arrowGroup) return;
    
    // 获取组件
    const ring = arrowGroup.children[0];
    const pulse = arrowGroup.children[3];
    
    // 创建动画
    let scale = 1.0;
    let increasing = true;
    let opacity = 1.0;
    
    // 脉冲动画函数
    function pulseAnimation() {
        if (!arrowGroup.parent) return; // 如果箭头被移除，停止动画
        
        // 缩放效果
        if (increasing) {
            scale += 0.01;
            if (scale >= 1.3) increasing = false;
        } else {
            scale -= 0.01;
            if (scale <= 0.8) increasing = true;
        }
        
        // 应用缩放
        pulse.scale.set(scale, scale, scale);
        
        // 旋转环
        ring.rotation.z += 0.02;
        
        // 继续动画循环
        requestAnimationFrame(pulseAnimation);
    }
    
    // 开始动画
    pulseAnimation();
}

// 淡出动画
function fadeOutArrow(arrowGroup) {
    if (!arrowGroup || !arrowGroup.parent) return;
    
    let opacity = 1.0;
    const fadeRate = 0.05;
    
    function fade() {
        opacity -= fadeRate;
        
        if (opacity <= 0) {
            scene.remove(arrowGroup);
            return;
        }
        
        // 应用透明度到所有子元素
        arrowGroup.children.forEach(child => {
            if (child.material) {
                child.material.opacity = opacity;
            }
        });
        
        requestAnimationFrame(fade);
    }
    
    fade();
}

// 获取3D对象在屏幕上的坐标
function getScreenPosition(position) {
    const vector = new THREE.Vector3(position.x, position.y, position.z);
    vector.project(camera);
    
    return {
        x: (vector.x * 0.5 + 0.5) * window.innerWidth,
        y: (-(vector.y * 0.5) + 0.5) * window.innerHeight
    };
}

// 缓动函数
function easeOutQuad(t) {
    return t * (2 - t);
}

// 重置视角到默认位置
function resetView() {
    if (!earth) return;
    
    // 设置导航状态，停止自转
    isNavigating = true;
    
    console.log("重置地球旋转...");
    
    // 使用动画平滑旋转地球回到初始位置
    const targetRotation = 0; // 目标旋转角度
    const duration = 800;     // 动画持续时间（毫秒）
    const startRotation = earth.rotation.y;
    const startTime = Date.now();
    
    // 计算最短旋转路径
    let rotationDiff = ((targetRotation - startRotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    if (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
    
    console.log(`重置旋转：从 ${(startRotation * 180 / Math.PI).toFixed(2)}° 到 ${(targetRotation * 180 / Math.PI).toFixed(2)}°, 差值: ${(rotationDiff * 180 / Math.PI).toFixed(2)}°`);
    
    // 平滑旋转动画函数
    function resetRotation() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数使动画更自然
        const easeProgress = easeOutQuad(progress);
        
        // 计算当前旋转角度
        const currentRotation = startRotation + rotationDiff * easeProgress;
        earth.rotation.y = currentRotation;
        
        // 如果动画未完成，继续执行
        if (progress < 1) {
            requestAnimationFrame(resetRotation);
        } else {
            // 重置完成后恢复自转
            setTimeout(() => {
                isNavigating = false;
            }, 500);
        }
    }
    
    // 开始重置动画
    resetRotation();
    
    // 移除任何方向箭头
    removeDirectionArrow();
    
    // 隐藏地标信息
    hideLandmarkInfo();
    
    // 重置坐标显示
    updateCoordinatesDisplay(0, 0);
}

// 全局函数声明
window.toggleLandmarksList = toggleLandmarksList;
window.toggleInfoPanel = toggleInfoPanel;
window.hideLandmarkInfo = hideLandmarkInfo;
window.askAIAboutLandmark = askAIAboutLandmark;
window.searchLandmarks = searchLandmarks;
window.closeSearchResults = closeSearchResults;
window.navigateToLandmark = navigateToLandmark;
window.resetView = resetView;

// 询问AI关于地标的信息 - 使用用户自己的聊天组件
async function askAIAboutLandmark(prompt, landmarkName) {
    console.log('查询地标详细信息:', landmarkName);
    
    // 隐藏地标信息弹窗
    hideLandmarkInfo();
    
    try {
        // 获取地标数据
        const landmark = landmarkData.find(item => item.name === landmarkName);
        
        // 基于地标类型定制提示
        let typeSpecificPrompt = "";
        let needsScience = false;
        
        if (landmark) {
            switch(landmark.type) {
                case 'geology':
                    typeSpecificPrompt = "作为地球科学科普老师，能否用生动有趣的方式介绍这个地质构造的形成过程？请解释它的地质特点、形成年代，以及对我们理解地球演化的意义。";
                    needsScience = true;
                    break;
                case 'ocean':
                    typeSpecificPrompt = "能否像科普老师一样，向我解释这个海洋特征的基本知识？我想了解它如何影响全球气候系统、海洋生态环境，以及它的独特海洋学特性。";
                    needsScience = true;
                    break;
                case 'meteorology':
                    typeSpecificPrompt = "请像气象科普专家一样，通俗地讲解这个气象现象的原理。我想了解它如何形成、如何影响我们的天气，以及它在全球气候系统中的作用。";
                    needsScience = true;
                    break;
                case 'city':
                    typeSpecificPrompt = "请简要介绍这个城市的基本信息，包括地理位置、人口和主要特点。在回答后，请另起一行，以[LINK]开头，直接粘贴一个完整的URL链接(例如https://example.com)，以[/LINK]结尾。请勿写'可以访问'或其他描述性文字，只需提供完整的URL。";
                    break;
                case 'nature':
                    typeSpecificPrompt = "请简要介绍这个自然景观的基本信息，包括地理位置、形成原因和主要特点。在回答后，请另起一行，以[LINK]开头，直接粘贴一个完整的URL链接(例如https://example.com)，以[/LINK]结尾。请勿写'可以访问'或其他描述性文字，只需提供完整的URL。";
                    break;
                case 'heritage':
                    typeSpecificPrompt = "请简要介绍这个文化遗产的基本信息，包括历史背景、文化价值和建筑特点。在回答后，请另起一行，以[LINK]开头，直接粘贴一个完整的URL链接(例如https://example.com)，以[/LINK]结尾。请勿写'可以访问'或其他描述性文字，只需提供完整的URL。";
                    break;
                default:
                    typeSpecificPrompt = "请简要介绍这个地标的基本信息，包括地理位置、历史和主要特点。在回答后，请另起一行，以[LINK]开头，直接粘贴一个完整的URL链接(例如https://example.com)，以[/LINK]结尾。请勿写'可以访问'或其他描述性文字，只需提供完整的URL。";
            }
        }
        
        // 根据地标类型构建提示词
        let enhancedPrompt;
        if (needsScience) {
            enhancedPrompt = `${prompt} ${typeSpecificPrompt} 请用通俗易懂的语言和生动的比喻来解释，使非专业人士也能理解这些地球科学知识。`;
        } else {
            enhancedPrompt = `请简要介绍${landmarkName}的基本情况。${typeSpecificPrompt} 链接格式非常重要，请确保链接格式正确，即[LINK]后面直接跟完整URL，然后是[/LINK]，不要包含任何其他描述文字。`;
        }
        
        // 打开聊天面板
        if (!window.toggleChat) {
            console.error('聊天功能未加载');
            return;
        }
        
        // 如果聊天面板未打开，先打开它
        const chatPanel = document.getElementById('chat-panel');
        if (chatPanel && chatPanel.classList.contains('hidden')) {
            await window.toggleChat();
            // 等待聊天面板初始化
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 自动填入问题并发送
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.value = enhancedPrompt;
            
            // 触发发送消息
            if (window.sendMessage) {
                setTimeout(() => {
                    window.sendMessage();
                }, 300);
            }
        }
    } catch (error) {
        console.error('发送消息到聊天组件失败:', error);
        alert('无法打开聊天窗口，请刷新页面后重试');
    }
}

// 处理点击事件（兼容鼠标和触摸）
function handleClick(event) {
    if (isLoading) return;
    
    console.log(`处理点击/触摸事件: (${event.clientX}, ${event.clientY})`);
    
    // 计算点击位置
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // 更新射线
    raycaster.setFromCamera(mouse, camera);
    
    // 获取所有可见标记
    const markerMeshes = markers.map(marker => marker.mesh).filter(mesh => mesh && mesh.visible);
    const markerIntersects = raycaster.intersectObjects(markerMeshes, true);
    
    let clickedMarker = null;
    
    // 检测点击的标记
    if (markerIntersects.length > 0) {
        console.log(`射线检测到 ${markerIntersects.length} 个相交物体`);
        
        for (const intersect of markerIntersects) {
            let current = intersect.object;
            let markerData = current.userData;
            
            // 向上查找到包含userData的父级组
            while (current && (!markerData || !markerData.name) && current.parent) {
                current = current.parent;
                markerData = current.userData;
            }
            
            if (markerData && markerData.name) {
                console.log(`找到标记: ${markerData.name}`);
                const matchedMarker = markers.find(m => m.data.name === markerData.name);
                if (matchedMarker && matchedMarker.mesh.visible) {
                    clickedMarker = matchedMarker.data;
                    break;
                }
            }
        }
    }
    
    // 如果没有直接点击到标记，查找附近的标记
    if (!clickedMarker) {
        console.log('尝试查找附近的标记');
        const searchRadius = isMobileDevice() ? 60 : 30; // 移动设备使用更大搜索半径
        const nearbyMarkers = findNearbyMarkers(event.clientX, event.clientY, searchRadius);
        
        if (nearbyMarkers.length > 0) {
            const visibleNearbyMarkers = nearbyMarkers.filter(item => item.marker.mesh.visible);
            if (visibleNearbyMarkers.length > 0) {
                clickedMarker = visibleNearbyMarkers[0].marker.data;
                console.log(`找到附近标记: ${clickedMarker.name}, 距离: ${visibleNearbyMarkers[0].actualDistance.toFixed(1)}px`);
            }
        }
    }
    
    // 处理点击结果
    if (clickedMarker) {
        console.log(`显示地标信息: ${clickedMarker.name}`);
        showLandmarkInfo(clickedMarker, event.clientX, event.clientY);
        updateCoordinatesDisplay(clickedMarker.lng, clickedMarker.lat);
    } else {
        console.log('未找到地标，隐藏信息弹窗');
        hideLandmarkInfo();
    }
}

// 专门为移动端设置触摸事件
function setupMobileTouchEvents() {
    const canvas = document.getElementById('earth-canvas');
    if (!canvas) {
        console.error('找不到画布元素');
        return;
    }
    
    console.log('为移动设备设置触摸事件');
    
    // 处理触摸结束事件(touchend) - 这相当于点击事件
    canvas.addEventListener('touchend', function(event) {
        event.preventDefault();
        
        console.log('触摸结束事件触发');
        
        if (event.changedTouches && event.changedTouches.length > 0) {
            const touch = event.changedTouches[0];
            const touchX = touch.clientX;
            const touchY = touch.clientY;
            
            console.log(`触摸坐标: (${touchX}, ${touchY})`);
            
            // 使用与点击事件相同的处理逻辑
            handleClick({
                clientX: touchX,
                clientY: touchY
            });
        }
    }, false);
    
    // 阻止触摸移动事件的默认行为（如页面滚动）
    canvas.addEventListener('touchmove', function(event) {
        event.preventDefault();
    }, { passive: false });
    
    console.log('移动设备触摸事件设置完成');
}