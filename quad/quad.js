class Quad {
    RES = 255;
    LIGHT_COLOR_A = [1, 0.73, 0.44]
    LIGHT_COLOR_D = [1, 0.9, 0.7]
    LIGHT_DIR = [1, -1, -1]

    /** @type {WebGLRenderingContext} */
    gl = null;
    program = null;
    transforms = {}
    locations = {};
    time = 0;
    rotation = 0;

    // Controlled by UI
    enableWire;
    KA;
    KD;
    KS;
    SV;
    amp;
    animationSpeed;
    cameraPos;
    useGen;
    mode;

    async init(gl) {
        this.gl = gl;
        this.buffers = await this.createBuffers();
        this.program = await GlUtils.createWebGLProgramFromPath(gl, "quad/quad_vertex.glsl", "quad/quad_fragment.glsl");
        gl.useProgram(this.program);
        this.bindLocations();
        gl.enable(gl.DEPTH_TEST);
    }

    draw() {
        const gl = this.gl;
        GlUtils.resetView(gl);
        gl.useProgram(this.program);
        this.getValuesFromControls();

        this.computeModelMatrix();
        this.computePerspectiveMatrix();
        this.updateAttributesAndUniforms();

        gl.drawElements(this.enableWire ? gl.LINE_STRIP : gl.TRIANGLES, (this.RES * this.RES) * 6, gl.UNSIGNED_SHORT, 0);
        this.time += this.animationSpeed;
    };

    getValuesFromControls() {
        this.enableWire = document.getElementById("wire").checked;
        this.KA = document.getElementById("ka").value;
        this.KD = document.getElementById("kd").value;
        this.KS = document.getElementById("ks").value;
        this.SV = document.getElementById("sv").value;
        this.amp = document.getElementById("amp").value;
        this.animationSpeed = document.getElementById("animSpeed").value;
        this.cameraPos = document.getElementById("camera").value;
        this.useGen = document.getElementById("useGen").checked;
        this.mode = document.querySelector('input[name="mode"]:checked').value;
    }

    computeModelMatrix() {
        const model = mat4.create();
        this.rotation += this.animationSpeed * 1;

        mat4.translate(model, model, [0, 0, this.cameraPos]);
        mat4.scale(model, model, [5, 5, 5]);
        mat4.rotate(model, model, Math.PI / 3, [-1, 0, 0]);
        mat4.rotate(model, model, this.rotation, [0, 0, 1]);

        this.transforms.model = model;

        const normalMat = mat4.create();
        mat4.invert(normalMat, model);
        mat4.transpose(normalMat, normalMat);

        this.transforms.normalMat = normalMat;
    };

    computePerspectiveMatrix() {
        const fieldOfViewInRadians = Math.PI * 0.35;
        const aspectRatio = this.gl.canvas.width / this.gl.canvas.height;
        const nearClippingPlaneDistance = 1;
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
        gl.uniformMatrix4fv(this.locations.projection, false, new Float32Array(this.transforms.projection));

        // Time
        gl.uniform1f(this.locations.time, this.time);

        // Texture
        gl.uniform1i(this.locations.heightMap, this.useGen ? 1 : 0);
        gl.enableVertexAttribArray(this.locations.uv);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uv);
        gl.vertexAttribPointer(this.locations.uv, 2, gl.FLOAT, false, 0, 0);

        // Positions
        gl.enableVertexAttribArray(this.locations.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positions);
        gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);
        gl.uniform1f(this.locations.amp, this.amp)

        // Colors
        gl.enableVertexAttribArray(this.locations.color);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.colors);
        gl.vertexAttribPointer(this.locations.color, 4, gl.FLOAT, false, 0, 0);

        // Light
        gl.uniform1f(this.locations.ka, this.KA);
        gl.uniform1f(this.locations.kd, this.KD);
        gl.uniform1f(this.locations.ks, this.KS);
        gl.uniform1f(this.locations.sv, this.SV);
        gl.uniform3fv(this.locations.lightColorA, this.LIGHT_COLOR_A);
        gl.uniform3fv(this.locations.lightColorD, this.LIGHT_COLOR_D);
        gl.uniform3fv(this.locations.lightDir, this.LIGHT_DIR);
        gl.uniform1f(this.locations.res, this.RES);
        gl.uniform1i(this.locations.mode, this.mode);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.elements);
    };


    async createBuffers() {
        const gl = this.gl;
        const image = await GlUtils.loadImageAsync("sample/terrain.png");
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
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quad.elements), gl.STATIC_DRAW);

        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

        return {
            positions: positions,
            elements: elements,
            colors: colors,
            uv: uv,
            heightMap: texture
        }
    }

    bindLocations() {
        this.locations.model = gl.getUniformLocation(this.program, "model");
        this.locations.normalMat = gl.getUniformLocation(this.program, "normalMat");
        this.locations.projection = gl.getUniformLocation(this.program, "projection");
        this.locations.time = gl.getUniformLocation(this.program, "time");
        this.locations.heightMap = gl.getUniformLocation(this.program, "heightMap");
        this.locations.position = gl.getAttribLocation(this.program, "position");
        this.locations.color = gl.getAttribLocation(this.program, "color");
        this.locations.uv = gl.getAttribLocation(this.program, "uv");
        this.locations.ka = gl.getUniformLocation(this.program, "Ka");
        this.locations.kd = gl.getUniformLocation(this.program, "Kd");
        this.locations.ks = gl.getUniformLocation(this.program, "Ks");
        this.locations.sv = gl.getUniformLocation(this.program, "Sv");
        this.locations.amp = gl.getUniformLocation(this.program, "amp");
        this.locations.lightColorA = gl.getUniformLocation(this.program, "lightColorA");
        this.locations.lightColorD = gl.getUniformLocation(this.program, "lightColorD");
        this.locations.lightDir = gl.getUniformLocation(this.program, "lightDir");
        this.locations.res = gl.getUniformLocation(this.program, "res");
        this.locations.mode = gl.getUniformLocation(this.program, "mode");
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
                colors.push(i / (2 * this.RES), (i + j) / (4 * this.RES), j / (2 * this.RES), 1);
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