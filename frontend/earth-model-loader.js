// 3D地球模型加载器
// 如果您有地球的3D模型文件（.gltf, .obj等），可以使用这个加载器

// GLTF加载器示例
function loadEarth3DModel() {
    // 需要添加GLTF加载器脚本
    // <script src="https://unpkg.com/three@0.150.0/examples/js/loaders/GLTFLoader.js"></script>
    
    if (typeof THREE.GLTFLoader !== 'undefined') {
        const loader = new THREE.GLTFLoader();
        
        // 加载地球3D模型（您需要提供模型文件路径）
        loader.load(
            'models/earth.gltf', // 您的地球模型文件路径
            function(gltf) {
                const earthModel = gltf.scene;
                earthModel.scale.setScalar(1);
                earthModel.position.set(0, 0, 0);
                
                // 替换当前的地球
                if (earth) {
                    scene.remove(earth);
                }
                
                earth = earthModel;
                scene.add(earth);
                
                console.log('3D地球模型加载成功');
            },
            function(progress) {
                console.log('3D模型加载进度:', Math.round(progress.loaded / progress.total * 100) + '%');
            },
            function(error) {
                console.error('3D模型加载失败:', error);
            }
        );
    }
}

// OBJ加载器示例
function loadEarthOBJModel() {
    // 需要添加OBJ加载器脚本
    // <script src="https://unpkg.com/three@0.150.0/examples/js/loaders/OBJLoader.js"></script>
    
    if (typeof THREE.OBJLoader !== 'undefined') {
        const loader = new THREE.OBJLoader();
        
        loader.load(
            'models/earth.obj', // 您的地球OBJ文件路径
            function(object) {
                object.scale.setScalar(1);
                object.position.set(0, 0, 0);
                
                // 如果有材质文件，可以这样应用
                const textureLoader = new THREE.TextureLoader();
                const earthTexture = textureLoader.load('textures/earth_texture.jpg');
                
                object.traverse(function(child) {
                    if (child.isMesh) {
                        child.material = new THREE.MeshPhongMaterial({
                            map: earthTexture
                        });
                    }
                });
                
                // 替换当前的地球
                if (earth) {
                    scene.remove(earth);
                }
                
                earth = object;
                scene.add(earth);
                
                console.log('OBJ地球模型加载成功');
            },
            function(progress) {
                console.log('OBJ模型加载进度:', Math.round(progress.loaded / progress.total * 100) + '%');
            },
            function(error) {
                console.error('OBJ模型加载失败:', error);
            }
        );
    }
}

// 使用高质量地球纹理的现成方案
function createHighQualityEarth() {
    const geometry = new THREE.SphereGeometry(1, 128, 128);
    const textureLoader = new THREE.TextureLoader();
    
    // 高质量地球纹理套装
    const earthTextures = {
        // 基础颜色贴图
        map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'),
        
        // 法线贴图（用于细节）
        normalMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg'),
        
        // 高光贴图（水面反光）
        specularMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'),
        
        // 云层贴图
        clouds: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png')
    };
    
    // 地球材质
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTextures.map,
        normalMap: earthTextures.normalMap,
        specularMap: earthTextures.specularMap,
        shininess: 1000,
        transparent: false
    });
    
    // 创建地球
    const earthMesh = new THREE.Mesh(geometry, earthMaterial);
    
    // 创建云层
    const cloudGeometry = new THREE.SphereGeometry(1.01, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
        map: earthTextures.clouds,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    earthMesh.add(clouds);
    
    return earthMesh;
}

// 使用方法说明
/*
使用方法：

1. 如果您有地球的3D模型文件：
   - 将模型文件放在 models/ 文件夹中
   - 在HTML中添加相应的加载器脚本
   - 调用对应的加载函数

2. 使用高质量纹理：
   - 在 createEarth() 函数中调用 createHighQualityEarth()

3. 在HTML中添加模型加载器（如果需要）：
   <script src="https://unpkg.com/three@0.150.0/examples/js/loaders/GLTFLoader.js"></script>
   <script src="https://unpkg.com/three@0.150.0/examples/js/loaders/OBJLoader.js"></script>

示例：
// 在 createEarth() 函数中替换地球创建代码
earth = createHighQualityEarth();
scene.add(earth);

或者：
// 加载3D模型
loadEarth3DModel();
*/ 