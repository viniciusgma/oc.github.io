async function jumpFloodingGPU(samplePoints, width, height) {
    if (!navigator.gpu) { return;}
      
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {return ;}
      
    const device = await adapter.requestDevice();
    if (!device) { return;}

    // Shader code em WGSL https://www.w3.org/TR/WGSL/#shader-lifecycle
    // Programmable stages execute shaders, which are special programs designed to run on GPU hardware https://gpuweb.github.io/gpuweb/#shaders
        const shaderCode = `
        struct Grid {
            data: array<u32>
        };

        // Resource bindings that are constant from the shader point of view https://gpuweb.github.io/gpuweb/#programming-model-resource-usages
        struct Uniforms {
            step: u32,
            width: u32,
            height: u32,
        };
        // declaração das variáveis que armazenam grid e seeds acessadas pelo shader por meio do GPUBufferBinding https://gpuweb.github.io/gpuweb/#security-shader 
        @group(0) @binding(0) var<storage, read_write> grid : Grid;
        @group(0) @binding(1) var<storage, read_only> seeds : Grid;
        @group(0) @binding(2) var<uniform> uniforms : Uniforms;


        // Em WGSL funções são declaradas com fn https://google.github.io/tour-of-wgsl/functions/syntax/
        fn euclideanDistance(x1: u32, y1: u32, x2: u32, y2: u32) -> f32 {
            let dx = f32(x1) - f32(x2);
            let dy = f32(y1) - f32(y2);
            return sqrt(dx * dx + dy * dy);
        }
        
        // let == const em WGSL; var mutável https://webgpufundamentals.org/webgpu/lessons/webgpu-wgsl.html
        //shader tem 3 stágios https://www.w3.org/TR/WGSL/#shader-stage-attr compute, fragment, vertex
        @compute @workgroup_size(8, 8)
        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
            let x = id.x;
            let y = id.y;
            let index = y * uniforms.width + x;
        
            if (x < uniforms.width && y < uniforms.height) {
                var currentSeedId: u32 = grid.data[index]; // ID do seed atual
                var minDist: f32 = f32(uniforms.width + uniforms.height); // Distância máxima possível

                // Se o pixel não tem um seed inicial, atribuir o proprio pixel como seed
                if (currentSeedId == 0){
                   currentSeedId = index + 1;
                }
        
                // Iterar sobre os vizinhos
                for (var dx: i32 = -i32(uniforms.step); dx <= i32(uniforms.step); dx++) {
                    for (var dy: i32 = -i32(uniforms.step); dy <= i32(uniforms.step); dy++) {
                        let nx: i32 = i32(x) + dx;
                        let ny: i32 = i32(y) + dy;
        
                        if (nx >= 0 && ny >= 0 && nx < i32(uniforms.width) && ny < i32(uniforms.height)) {
                            let neighborIndex = u32(ny) * uniforms.width + u32(nx);
                            let neighborSeedId: u32 = grid.data[neighborIndex];
        
                            // Verificar se o vizinho tem um seed válido
                            if (neighborSeedId != 0) {
                                // Pegar as coordenadas do seed vizinho do buffer "seeds"
                                let seedX: u32 = seeds.data[(neighborSeedId - 1) * 2];
                                let seedY: u32 = seeds.data[(neighborSeedId - 1) * 2 + 1];
        
                                let dist = euclideanDistance(x, y, seedX, seedY);
                                if (dist < minDist) {
                                    minDist = dist;
                                    currentSeedId = neighborSeedId;
                                }
                            }
                        }
                    }
                }
        
                grid.data[index] = currentSeedId;
            }
        }`;

    // Buffer para os uniforms 
    const uniformBufferSize = 3 * 4; 
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const gridBuffer = device.createBuffer({
        size: width * height * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_READ,
    });

    const seedBuffer = device.createBuffer({
        size: samplePoints.length * 2 * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Preenche o buffer das seeds
    const seedData = new Uint32Array(samplePoints.length * 2);
    for (let i = 0; i < samplePoints.length; i++) {
        seedData[i * 2] = samplePoints[i][0];
        seedData[i * 2 + 1] = samplePoints[i][1];
    }

    device.queue.writeBuffer(seedBuffer, 0, seedData.buffer);

    // https://gpuweb.github.io/gpuweb/#shader-module-creation
    const shaderModule = device.createShaderModule({ code: shaderCode });

    // https://gpuweb.github.io/gpuweb/#pipeline  args: modulo shader, função decorada com @compute.  
    const pipeline = device.createComputePipeline({
        layout: "auto",
        compute: { module: shaderModule, entryPoint: "main" },
    });

    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: gridBuffer } },
            { binding: 1, resource: { buffer: seedBuffer } },
            { binding: 2, resource: { buffer: uniformBuffer } },
        ],
    });

    // cria encoder usado para enviar comandos para a GPU https://developer.mozilla.org/en-US/docs/Web/API/GPUCommandEncoder
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    // 
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);

    // Define os valores iniciais no grid
    const initialData = new Uint32Array(width * height);

    // estrutura writeBuffer(buffer, bufferOffset, data, dataOffset, size)     https://developer.mozilla.org/en-US/docs/Web/API/GPUQueue/writeBuffer
    device.queue.writeBuffer(gridBuffer, 0, initialData.buffer);

    // Define step pelo maior valor entre width e height
    let step = Math.floor(Math.max(width, height) / 2);

    while (step > 0) {
        // Atualizar o buffer uniforme com o novo valor de step
        const uniformData = new Uint32Array([step, width, height]);
        device.queue.writeBuffer(uniformBuffer, 0, uniformData.buffer);

        passEncoder.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8));
        step = Math.floor(step / 2);
    }

    passEncoder.end();

    // controla a execução dos comandos enviados pelo encoder
    //command buffers to queue for execution      https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/queue
    device.queue.submit([commandEncoder.finish()]);


    await device.queue.onSubmittedWorkDone();
    return gridBuffer;
}