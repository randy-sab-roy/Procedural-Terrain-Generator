class Quad {
    RES = 100;
    ANIMATION_SPEED = 3;
    ENABLE_WIRE = false;
    DELTA_TIME = 0.01;

    /** @type {WebGLRenderingContext} */
    gl = null;
    program = null;
    transforms = {}
    locations = {};
    time = 0;

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
        gl.enable(gl.DEPTH_TEST);
    }

    draw() {
        /** @type {WebGLRenderingContext} */
        gl.useProgram(this.program);

        this.computeModelMatrix();
        this.computePerspectiveMatrix();
        this.updateAttributesAndUniforms();

        gl.drawElements(this.ENABLE_WIRE ? gl.LINE_STRIP : gl.TRIANGLES, (this.RES * this.RES) * 6, gl.UNSIGNED_SHORT, 0);
        this.time += this.DELTA_TIME;
    };

    computeModelMatrix() {
        const scale = MatUtils.scaleMatrix(10, 10, 10);
        const rotateX = MatUtils.rotateXMatrix(Math.PI / 2);
        const rotateY = MatUtils.rotateYMatrix(Date.now() * this.ANIMATION_SPEED * 0.0001);
        const rotateX2 = MatUtils.rotateXMatrix(-Math.PI / 8);
        const position = MatUtils.translateMatrix(0, -8, -25);

        this.transforms.model = MatUtils.multiplyArrayOfMatrices([
            position,
            rotateX2,
            rotateY,
            rotateX,
            scale
        ]);
    };

    computePerspectiveMatrix() {
        const fieldOfViewInRadians = Math.PI * 0.5;
        const aspectRatio = this.gl.canvas.width / this.gl.canvas.height;
        const nearClippingPlaneDistance = 1;
        const farClippingPlaneDistance = 50;

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

        // Positions
        gl.enableVertexAttribArray(this.locations.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positions);
        gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);

        // Colors
        gl.enableVertexAttribArray(this.locations.color);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.colors);
        gl.vertexAttribPointer(this.locations.color, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.elements);
    };


    async createBuffers() {
        const gl = this.gl;
        const quad = this.createQuadData();

        const positions = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positions);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.positions), gl.STATIC_DRAW);

        const colors = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colors);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.colors), gl.STATIC_DRAW);

        const elements = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quad.elements), gl.STATIC_DRAW);

        const image = await GlUtils.loadImageAsync("sample/terrain.png");
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

        return {
            positions: positions,
            elements: elements,
            colors: colors,
            heightMap: texture
        }
    }

    createQuadData() {
        const positions = [];
        const colors = [];
        const elements = []

        for (let i = 0; i <= this.RES; i++) {
            for (let j = 0; j <= this.RES; j++) {
                positions.push((2 * j - this.RES) / this.RES);
                positions.push((2 * i - this.RES) / this.RES);
                positions.push(0);
                colors.push(i / this.RES, 0, j / this.RES, 1);

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
            colors: colors
        }
    }
}