class Quad {
    RES = 250;
    LIGHT_COLOR_A = [1, 0.73, 0.44]
    LIGHT_COLOR_D = [1, 0.9, 0.7]
    LIGHT_DIR = [-0.7, -1.0, -0.6]

    /** @type {WebGLRenderingContext} */
    gl = null;
    program = null;
    transforms = {}
    locations = {};
    time = 0;
    rotation = MatUtils.rotateYMatrix(0, 0, 0);

    // Controlled by UI
    enableWire;
    KA;
    KD;
    amp;
    animationSpeed;

    async init(gl) {
        this.gl = gl;
        this.buffers = await this.createBuffers();
        this.program = await GlUtils.createWebGLProgramFromPath(gl, "quad/quad_vertex.glsl", "quad/quad_fragment.glsl");
        gl.useProgram(this.program);

        this.locations.model = gl.getUniformLocation(this.program, "model");
        this.locations.projection = gl.getUniformLocation(this.program, "projection");
        this.locations.time = gl.getUniformLocation(this.program, "time");
        this.locations.heightMap = gl.getUniformLocation(this.program, "heightMap");
        this.locations.position = gl.getAttribLocation(this.program, "position");
        this.locations.color = gl.getAttribLocation(this.program, "color");
        this.locations.uv = gl.getAttribLocation(this.program, "uv");
        this.locations.ka = gl.getUniformLocation(this.program, "Ka");
        this.locations.kd = gl.getUniformLocation(this.program, "Kd");
        this.locations.amp = gl.getUniformLocation(this.program, "amp");
        this.locations.lightColorA = gl.getUniformLocation(this.program, "lightColorA");
        this.locations.lightColorD = gl.getUniformLocation(this.program, "lightColorD");
        this.locations.lightDir = gl.getUniformLocation(this.program, "lightDir");
        this.locations.res = gl.getUniformLocation(this.program, "res");
        gl.enable(gl.DEPTH_TEST);
    }

    draw() {
        /** @type {WebGLRenderingContext} */
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
        this.amp = document.getElementById("amp").value;
        this.animationSpeed = document.getElementById("animSpeed").value;
    }

    computeModelMatrix() {
        const scale = MatUtils.scaleMatrix(20, 20, 20);
        const rotateX = MatUtils.rotateXMatrix(Math.PI / 2);
        this.rotation = MatUtils.multiplyArrayOfMatrices([this.rotation, MatUtils.rotateYMatrix(this.animationSpeed)]);
        const rotateX2 = MatUtils.rotateXMatrix(-Math.PI / 6);
        const position = MatUtils.translateMatrix(0, 0, -30);

        this.transforms.model = MatUtils.multiplyArrayOfMatrices([
            position,
            rotateX2,
            this.rotation,
            rotateX,
            scale
        ]);
    };

    computePerspectiveMatrix() {
        const fieldOfViewInRadians = Math.PI * 0.5;
        const aspectRatio = this.gl.canvas.width / this.gl.canvas.height;
        const nearClippingPlaneDistance = 1;
        const farClippingPlaneDistance = 100;

        this.transforms.projection = MatUtils.perspectiveMatrix(
            fieldOfViewInRadians,
            aspectRatio,
            nearClippingPlaneDistance,
            farClippingPlaneDistance
        );
    };

    updateAttributesAndUniforms() {
        const gl = this.gl;

        // MVP Matrices
        gl.uniformMatrix4fv(this.locations.model, false, new Float32Array(this.transforms.model));
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
        gl.uniform1f(this.locations.amp, this.amp)

        // Colors
        gl.enableVertexAttribArray(this.locations.color);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.colors);
        gl.vertexAttribPointer(this.locations.color, 4, gl.FLOAT, false, 0, 0);

        // Light
        gl.uniform1f(this.locations.ka, this.KA);
        gl.uniform1f(this.locations.kd, this.KD);
        gl.uniform3fv(this.locations.lightColorA, this.LIGHT_COLOR_A);
        gl.uniform3fv(this.locations.lightColorD, this.LIGHT_COLOR_D);
        gl.uniform3fv(this.locations.lightDir, this.LIGHT_DIR);
        gl.uniform1f(this.locations.res, this.RES);

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

                if (i != this.RES && j != this.RES) {
                    const row1 = i * (this.RES + 1);
                    const row2 = (i + 1) * (this.RES + 1);
                    elements.push(row1 + j, row1 + j + 1, row2 + j + 1);
                    elements.push(row1 + j, row2 + j + 1, row2 + j);
                }
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