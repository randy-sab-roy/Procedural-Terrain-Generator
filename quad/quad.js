class Quad {
    RES = 500;

    /** @type {WebGLRenderingContext} */
    gl = null;
    program = null;
    transforms = {}
    locations = {};
    time = 0;

    // Controlled by UI
    enableWire;
    KA;
    KD;
    rotation;
    cameraPos;
    mode;
    shadows;
    light;

    forceDefaultvalues(){
        document.getElementById("waterLevel").value = document.getElementById("waterLevel").defaultValue;
    }

    async init(gl) {
        this.gl = gl;
        this.buffers = this.createBuffers();
        this.program = await GlUtils.createWebGLProgramFromPath(gl, "quad/quad_vertex.glsl", "quad/quad_fragment.glsl");
        gl.useProgram(this.program);
        this.bindLocations();
        this.forceDefaultvalues();
        gl.enable(gl.DEPTH_TEST);
    }

    draw() {
        const gl = this.gl;
        gl.useProgram(this.program);
        this.getValuesFromControls();

        this.computeModelMatrix();
        this.computePerspectiveMatrix();
        this.updateAttributesAndUniforms();

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.drawElements(this.enableWire ? gl.LINES : gl.TRIANGLES, (this.RES * this.RES) * 6, gl.UNSIGNED_INT, 0);
        this.time += 0.05;
    };

    getValuesFromControls() {
        const newRes = document.getElementById("res").value * 1.0;
        if (newRes != this.RES)
        {
            this.RES = newRes
            this.regenQuad();
        }
        this.enableWire = document.getElementById("wire").checked;
        this.KA = document.getElementById("ka").value;
        this.KD = document.getElementById("kd").value;
        this.rotation = document.getElementById("rotation").value;
        this.cameraPos = document.getElementById("camera").value;
        this.mode = document.querySelector('input[name="mode"]:checked').value;
        this.shadows = document.getElementById("shadows").checked ? 0.0:1.0;

        const sunAngle = document.getElementById("ld").value;
        this.light = [-Math.cos(sunAngle), -Math.sin(sunAngle), 0];

    }

    computeModelMatrix() {
        const model = mat4.create();

        mat4.translate(model, model, [0, -1.5, this.cameraPos]);
        mat4.scale(model, model, [5, 5, 5]);
        mat4.rotate(model, model, Math.PI / 2.8, [-1, 0, 0]);
        mat4.rotate(model, model, this.rotation, [0, 0, 1]);

        this.transforms.model = model;

        const inverseMat = mat4.create();
        mat4.invert(inverseMat, model);
        
        const normalMat = mat4.create();
        mat4.invert(normalMat, model);
        mat4.transpose(normalMat, normalMat);

        this.transforms.normalMat = normalMat;
        this.transforms.inverseMat = inverseMat;
    };

    computePerspectiveMatrix() {
        const fieldOfViewInRadians = Math.PI * 0.35;
        const aspectRatio = this.gl.canvas.width / this.gl.canvas.height;
        const nearClippingPlaneDistance = 0.01;
        const farClippingPlaneDistance = 100;

        const projection = mat4.create();
        mat4.perspective(projection, fieldOfViewInRadians, aspectRatio, nearClippingPlaneDistance, farClippingPlaneDistance);
        this.transforms.projection = projection;
    };

    updateAttributesAndUniforms() {
        const gl = this.gl;

        // MVP Matrices
        gl.uniformMatrix4fv(this.locations.model, false, new Float32Array(this.transforms.model));
        gl.uniformMatrix4fv(this.locations.normalMat, false, new Float32Array(this.transforms.normalMat));
        gl.uniformMatrix4fv(this.locations.inverseMat, false, new Float32Array(this.transforms.inverseMat));
        gl.uniformMatrix4fv(this.locations.projection, false, new Float32Array(this.transforms.projection));

        // Time
        gl.uniform1f(this.locations.time, this.time);

        // Texture
        gl.uniform1i(this.locations.heightMap, 0);
        gl.enableVertexAttribArray(this.locations.uv);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uv);
        gl.vertexAttribPointer(this.locations.uv, 2, gl.FLOAT, false, 0, 0);

        // Positions
        gl.enableVertexAttribArray(this.locations.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positions);
        gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);

        // Colors
        gl.enableVertexAttribArray(this.locations.color);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.colors);
        gl.vertexAttribPointer(this.locations.color, 4, gl.FLOAT, false, 0, 0);

        // Light
        gl.uniform1f(this.locations.ka, this.KA);
        gl.uniform1f(this.locations.kd, this.KD);
        gl.uniform1f(this.locations.res, this.RES);
        gl.uniform1i(this.locations.mode, this.mode);
        gl.uniform1i(this.locations.shadows, this.shadows);

        // Terrain
        gl.uniform1f(this.locations.waterLevel, document.getElementById("waterLevel").value);
        gl.uniform1f(this.locations.sandLevel, document.getElementById("sandLevel").value);
        gl.uniform1f(this.locations.grassLevel, document.getElementById("grassLevel").value);
        gl.uniform1f(this.locations.rockAngle, document.getElementById("rockAngle").value);
        gl.uniform1f(this.locations.movement, document.getElementById("terrainOffset").value);
        gl.uniform1f(this.locations.rotation, document.getElementById("rotation").value);
        gl.uniform1f(this.locations.ld, document.getElementById("ld").value);
        gl.uniform1f(this.locations.shadows, this.shadows);
        gl.uniform3fv(this.locations.light, this.light);



        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.elements);
    };


    createBuffers() {
        const gl = this.gl;
        const quad = this.createQuadData();

        const positions = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positions);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.positions), gl.STATIC_DRAW);

        const colors = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colors);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.colors), gl.STATIC_DRAW);

        const uv = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uv);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.uv), gl.STATIC_DRAW);

        const elements = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(quad.elements), gl.STATIC_DRAW);

        return {
            positions: positions,
            elements: elements,
            colors: colors,
            uv: uv
        }
    }

    regenQuad() {
        const gl = this.gl;
        const quad = this.createQuadData();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positions);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.positions), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.colors);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.colors), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uv);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.uv), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.elements);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(quad.elements), gl.STATIC_DRAW);
    }

    bindLocations() {
        this.locations.model = gl.getUniformLocation(this.program, "model");
        this.locations.normalMat = gl.getUniformLocation(this.program, "normalMat");
        this.locations.inverseMat = gl.getUniformLocation(this.program, "inverseMat");
        this.locations.projection = gl.getUniformLocation(this.program, "projection");
        this.locations.time = gl.getUniformLocation(this.program, "time");
        this.locations.heightMap = gl.getUniformLocation(this.program, "heightMap");
        this.locations.colorMap = gl.getUniformLocation(this.program, "colorMap");
        this.locations.position = gl.getAttribLocation(this.program, "position");
        this.locations.color = gl.getAttribLocation(this.program, "color");
        this.locations.uv = gl.getAttribLocation(this.program, "uv");
        this.locations.ka = gl.getUniformLocation(this.program, "Ka");
        this.locations.kd = gl.getUniformLocation(this.program, "Kd");
        this.locations.ks = gl.getUniformLocation(this.program, "Ks");
        this.locations.res = gl.getUniformLocation(this.program, "res");
        this.locations.mode = gl.getUniformLocation(this.program, "mode");
        this.locations.shadows = gl.getUniformLocation(this.program, "shadows");
        this.locations.waterLevel = gl.getUniformLocation(this.program, "waterLevel");
        this.locations.sandLevel = gl.getUniformLocation(this.program, "sandLevel");
        this.locations.grassLevel = gl.getUniformLocation(this.program, "grassLevel");
        this.locations.rockAngle = gl.getUniformLocation(this.program, "rockAngle");
        this.locations.movement = gl.getUniformLocation(this.program, "movement");
        this.locations.rotation = gl.getUniformLocation(this.program, "rotation");
        this.locations.light = gl.getUniformLocation(this.program, "light");
    }

    createQuadData() {
        const positions = [];
        const colors = [];
        const elements = [];
        const uv = [];

        for (let i = 0; i <= this.RES; i++) {
            for (let j = 0; j <= this.RES; j++) {
                positions.push((2 * j - this.RES) / this.RES);
                positions.push((2 * i - this.RES) / this.RES);
                positions.push(0);
                colors.push(i / this.RES, (i + j) / (2 * this.RES), j / this.RES, 1);
                uv.push(i / this.RES, j / this.RES);
            }
        }

        for (let i = 0; i < this.RES; i++) {
            for (let j = 0; j < this.RES; j++) {
                const p0 = (i * (this.RES + 1)) + j;
                const p1 = (i * (this.RES + 1)) + j + 1;
                const p2 = ((i + 1) * (this.RES + 1)) + j;
                const p3 = ((i + 1) * (this.RES + 1)) + j + 1;

                elements.push(p0, p1, p2, p2, p1, p3);
            }
        }

        return {
            positions: positions,
            elements: elements,
            colors: colors,
            uv: uv
        }
    }
}