class Generator {

    /** @type {WebGLRenderingContext} */
    gl = null;
    program = null;
    locations = {};

    async init(gl) {
        this.gl = gl;
        this.buffers = await this.createBuffers();
        this.program = await GlUtils.createWebGLProgramFromPath(gl, "generator/generator_vertex.glsl", "generator/generator_fragment.glsl");
        gl.useProgram(this.program);

        this.locations.position = gl.getAttribLocation(this.program, "position");
        this.locations.uv = gl.getAttribLocation(this.program, "uv");
        gl.enable(gl.DEPTH_TEST);
    }

    draw() {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffers.frame);
        
        gl.viewport(0, 0, 250, 250);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(this.program);
        this.updateAttributesAndUniforms();
        gl.drawElements(gl.TRIANGLE_STRIP, 6, gl.UNSIGNED_SHORT, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };


    updateAttributesAndUniforms() {
        const gl = this.gl;

        // Positions
        gl.enableVertexAttribArray(this.locations.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positions);
        gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);

        // Colors
        gl.enableVertexAttribArray(this.locations.uv);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uv);
        gl.vertexAttribPointer(this.locations.uv, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.elements);
    };


    async createBuffers() {
        const gl = this.gl;
        const gen = this.createGeneratorData();

        const positions = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positions);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gen.positions), gl.STATIC_DRAW);

        const uv = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uv);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gen.uv), gl.STATIC_DRAW);

        const elements = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(gen.elements), gl.STATIC_DRAW)

        const tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 250, 250, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);


        return {
            positions: positions,
            uv: uv,
            elements: elements,
            frame: fb,
            texture: tex
        }
    }

    createGeneratorData() {
        const positions = [
            -1, -1, 0,
            1, -1, 0,
            -1, 1, 0,
            1, 1, 0
        ];

        const uv = [
            0, 0,
            1, 0,
            0, 1
        ];

        const elements = [
            0, 1, 2, 1, 2, 3
        ]

        return {
            positions: positions,
            uv: uv,
            elements: elements
        }
    }
}