class Generator {

    /** @type {WebGLRenderingContext} */
    gl = null;

    program = null;
    locations = {};
    res = 255;
    capture = false;
    offset = 0;

    async init(gl) {
        this.gl = gl;
        this.buffers = await this.createBuffers();
        this.program = await GlUtils.createWebGLProgramFromPath(gl, "generator/generator_vertex.glsl", "generator/generator_fragment.glsl");
        gl.useProgram(this.program);

        this.locations.position = gl.getAttribLocation(this.program, "position");
        this.locations.uv = gl.getAttribLocation(this.program, "uv");
        this.locations.terrainOffset = gl.getUniformLocation(this.program, "terrainOffset");
        this.locations.terrainScale = gl.getUniformLocation(this.program, "terrainScale");
        this.locations.noise = gl.getUniformLocation(this.program, "noise");
        this.locations.h = gl.getUniformLocation(this.program, "H");
        this.locations.globalContrast = gl.getUniformLocation(this.program, "globalContrast");
        this.locations.globalBrightness = gl.getUniformLocation(this.program, "globalBrightness");
        this.locations.nOctaves = gl.getUniformLocation(this.program, "nOctaves");
        gl.enable(gl.DEPTH_TEST);
    }

    draw() {
        const gl = this.gl;
        gl.useProgram(this.program);
        
        gl.viewport(0, 0, this.res, this.res);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.updateAttributesAndUniforms();
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffers.frame);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        this.checkCaptureStatus();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        if(document.getElementById("showGen").checked) {
            gl.viewport(gl.canvas.width - this.res - 10, 10, this.res, this.res);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }
    };
    
    checkCaptureStatus() {
        if (this.capture == true) {
            this.capture = false;
            const res = 255;
            const pixels = new Uint8Array(this.res * this.res * 4);
            gl.readPixels(0, 0, this.res, this.res, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = res;
            canvas.height = res;
            const data = context.createImageData(res, res);
            data.data.set(pixels);
            context.putImageData(data, 0, 0);
            const imgUrl = canvas.toDataURL();
    
            const link = document.createElement("a");
            link.setAttribute("download", "height_map.png");
            link.setAttribute("href", imgUrl);
            link.click();
            link.remove();
            canvas.remove();
        }
    }


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

        this.offset += document.getElementById("terrainOffset").value * 1;
        gl.uniform1f(this.locations.terrainOffset, this.offset);
        gl.uniform1f(this.locations.terrainScale, document.getElementById("terrainScale").value);
        gl.uniform1f(this.locations.h, document.getElementById("h").value);
        gl.uniform1f(this.locations.globalContrast, document.getElementById("gContrast").value);
        gl.uniform1f(this.locations.globalBrightness, document.getElementById("gBrightness").value);
        gl.uniform1i(this.locations.nOctaves, document.getElementById("octaves").value);
        gl.uniform1i(this.locations.noise, document.querySelector('input[name="noise"]:checked').value);

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
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.res, this.res, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

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