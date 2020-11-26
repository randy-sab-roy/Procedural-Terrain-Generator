class Quad {
    
    gl = null;
    program = null;
    transforms = {}
    locations = {};
    RES = 500;

    async init(gl) {
        this.gl = gl;
        this.buffers = this.createBuffers();
        this.program = await GlUtils.createWebGLProgramFromPath(gl, "quad/quad_vertex.glsl", "quad/quad_fragment.glsl");
        gl.useProgram(this.program);

        this.bindLocations();
        gl.enable(gl.DEPTH_TEST);
    }

    draw() {
        const gl = this.gl;
        gl.useProgram(this.program);
        this.updateResolution();

        this.computeModelMatrix();
        this.computePerspectiveMatrix();
        this.updateAttributesAndUniforms();

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.drawElements(document.getElementById("wire").checked ? gl.LINES : gl.TRIANGLES, (this.RES * this.RES) * 6, gl.UNSIGNED_INT, 0);
    };

    updateResolution() {
        const newRes = document.getElementById("res").value * 1.0;
        if (newRes != this.RES) {
            this.RES = newRes
            this.regenQuad();
        }
    }

    computeModelMatrix() {
        const model = mat4.create();
        const inverseMat = mat4.create();
        
        mat4.translate(model, model, [0, -1.5, document.getElementById("camera").value]);
        mat4.scale(model, model, [5, 5, 5]);

        // Save rotation data in seperate matrix to allow shadows in vertex shader
        mat4.rotate(inverseMat, inverseMat, Math.PI / 2.8, [-1, 0, 0]);
        mat4.rotate(inverseMat, inverseMat, document.getElementById("rotation").value, [0, 0, 1]);
        mat4.mul(model, model, inverseMat);
        mat4.invert(inverseMat, inverseMat);

        const normalMat = mat4.create();
        mat4.invert(normalMat, model);
        mat4.transpose(normalMat, normalMat);
        
        this.transforms.model = model;
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
        const sunAngle = document.getElementById("ld").value;
        const light = [-Math.cos(sunAngle), -Math.sin(sunAngle), 0];
        gl.uniform3fv(this.locations.light, light);
        gl.uniform1f(this.locations.ka, document.getElementById("ka").value);
        gl.uniform1f(this.locations.kd, document.getElementById("kd").value);
        gl.uniform1f(this.locations.res, this.RES);
        gl.uniform1i(this.locations.mode, document.querySelector('input[name="mode"]:checked').value);
        gl.uniform1i(this.locations.shadows, document.getElementById("shadows").checked ? 0 : 1);

        // Terrain
        gl.uniform1f(this.locations.waterLevel, document.getElementById("waterLevel").value);
        gl.uniform1f(this.locations.sandLevel, document.getElementById("sandLevel").value);
        gl.uniform1f(this.locations.grassLevel, document.getElementById("grassLevel").value);
        gl.uniform1f(this.locations.rockAngle, document.getElementById("rockAngle").value);
        gl.uniform1f(this.locations.movement, document.getElementById("terrainOffset").value);
        gl.uniform1f(this.locations.rotation, document.getElementById("rotation").value);
        gl.uniform1f(this.locations.ld, document.getElementById("ld").value);

        // Indices
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