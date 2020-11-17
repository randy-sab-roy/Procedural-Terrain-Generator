class GeneratorView {

    /** @type {WebGLRenderingContext} */
    gl = null;

    program = null;
    locations = {};
    RES = 255;

    async init(gl) {
        this.gl = gl;
        this.buffers = await this.createBuffers();
        this.program = await GlUtils.createWebGLProgramFromPath(gl, "generatorView/generatorView_vertex.glsl", "generatorView/generatorView_fragment.glsl");
        gl.useProgram(this.program);

        this.locations.position = gl.getAttribLocation(this.program, "position");
        this.locations.uv = gl.getAttribLocation(this.program, "uv");
        this.locations.tex = gl.getUniformLocation(this.program, "tex");
    }

    draw() {
        if (document.getElementById("showGen").checked) {
            const gl = this.gl;
            gl.useProgram(this.program);
            this.updateAttributesAndUniforms();
            gl.viewport(gl.canvas.width - this.RES - 10, 10, this.RES, this.RES);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }
    };

    updateAttributesAndUniforms() {
        const gl = this.gl;

        // Positions
        gl.enableVertexAttribArray(this.locations.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positions);
        gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);

        // Texture
        gl.enableVertexAttribArray(this.locations.uv);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uv);
        gl.vertexAttribPointer(this.locations.uv, 2, gl.FLOAT, false, 0, 0);
        gl.uniform1i(this.locations.tex, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.elements);
    };


    async createBuffers() {
        const gl = this.gl;
        const gen = this.createQuad();

        const positions = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positions);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gen.positions), gl.STATIC_DRAW);

        const uv = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uv);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gen.uv), gl.STATIC_DRAW);

        const elements = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(gen.elements), gl.STATIC_DRAW)

        return {
            positions: positions,
            uv: uv,
            elements: elements
        }
    }

    createQuad() {
        const positions = [
            -1, -1, -1,
            1, -1, -1,
            -1, 1, -1,
            1, 1, -1
        ];

        const uv = [
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ];

        const elements = [
            3, 2, 1, 2, 1, 0
        ]

        return {
            positions: positions,
            uv: uv,
            elements: elements
        }
    }
}