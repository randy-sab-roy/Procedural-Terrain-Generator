class Generator {
    gl = null;

    program = null;
    locations = {};
    RES = 500;
    capture = false;
    offset = 0;
    tempAmp = 0;
    time = 0.0;
    startTime;
    newTime;


    async init(gl) {
        this.startTime = new Date();
        this.gl = gl;
        this.buffers = await this.createBuffers();
        this.program = await GlUtils.createWebGLProgramFromPath(gl, "generator/generator_vertex.glsl", "generator/generator_fragment.glsl");
        gl.useProgram(this.program);

        this.locations.position = gl.getAttribLocation(this.program, "position");
        this.locations.uv = gl.getAttribLocation(this.program, "uv");
        this.locations.time = gl.getUniformLocation(this.program, "time");
        this.locations.terrainOffset = gl.getUniformLocation(this.program, "terrainOffset");
        this.locations.terrainScale = gl.getUniformLocation(this.program, "terrainScale");
        this.locations.noise = gl.getUniformLocation(this.program, "noise");
        this.locations.h = gl.getUniformLocation(this.program, "H");
        this.locations.globalContrast = gl.getUniformLocation(this.program, "globalContrast");
        this.locations.globalBrightness = gl.getUniformLocation(this.program, "globalBrightness");
        this.locations.nOctaves = gl.getUniformLocation(this.program, "nOctaves");
        this.locations.fAmp = gl.getUniformLocation(this.program, "fAmp");
        this.locations.fContrast = gl.getUniformLocation(this.program, "fContrast");
        this.locations.h1Amp = gl.getUniformLocation(this.program, "h1Amp");
        this.locations.h1Contrast = gl.getUniformLocation(this.program, "h1Contrast");
        this.locations.h2Amp = gl.getUniformLocation(this.program, "h2Amp");
        this.locations.h2Contrast = gl.getUniformLocation(this.program, "h2Contrast");
        this.locations.h3Amp = gl.getUniformLocation(this.program, "h3Amp");
        this.locations.h3Contrast = gl.getUniformLocation(this.program, "h3Contrast");
        this.locations.waterLevel = gl.getUniformLocation(this.program, "waterLevel");

        gl.enable(gl.DEPTH_TEST);
    }

    draw() {
        const gl = this.gl;
        gl.useProgram(this.program);
        const newRes = document.getElementById("res").value * 1.0;
        if (this.RES != newRes) {
            this.RES = newRes;
            gl.bindTexture(gl.TEXTURE_2D, this.buffers.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.RES, this.RES, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }

        gl.viewport(0, 0, this.RES, this.RES);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.updateAttributesAndUniforms();

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffers.frame);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        this.checkCaptureStatus();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    
    checkCaptureStatus() {
        if (this.capture == true) {
            this.capture = false;
            const res = this.RES;
            const pixels = new Uint8Array(this.RES * this.RES * 4);
            gl.readPixels(0, 0, this.RES, this.RES, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

            const bitEnc = [1, 1 / 255, 1 / 65025, 1 / 16581375];
            for (let i = 0; i < this.RES * this.RES; i++) {
                let val = 0;
                for(let j = 0; j < 4; j++) {
                    val += pixels[(i*4)+j] * bitEnc[j];
                }
                for(let j = 0; j < 3; j++) {
                    pixels[(i*4)+j] = val;
                }
                pixels[(i*4)+3] = 255;
            }


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
        this.newTime = new Date();
        this.time = (this.newTime - this.startTime) / 1000.0;
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
        gl.uniform1f(this.locations.time, this.time);
        gl.uniform1f(this.locations.terrainScale, document.getElementById("terrainScale").value);
        gl.uniform1f(this.locations.h, document.getElementById("h").value);
        gl.uniform1f(this.locations.globalContrast, document.getElementById("gContrast").value);
        gl.uniform1f(this.locations.globalBrightness, document.getElementById("gBrightness").value);
        gl.uniform1i(this.locations.nOctaves, document.getElementById("octaves").value);
        gl.uniform1i(this.locations.noise, document.querySelector('input[name="noise"]:checked').value);

        this.tempAmp = document.getElementById("showFbm").checked ? document.getElementById("fAmp").value : 0.0;
        gl.uniform1f(this.locations.fAmp, this.tempAmp);
        gl.uniform1f(this.locations.fContrast, document.getElementById("fContrast").value);

        this.tempAmp = document.getElementById("showH1").checked ? document.getElementById("h1Amp").value : 0.0;
        gl.uniform1f(this.locations.h1Amp, this.tempAmp);
        gl.uniform1f(this.locations.h1Contrast, document.getElementById("h1Contrast").value);


        this.tempAmp = document.getElementById("showH2").checked ? document.getElementById("h2Amp").value : 0.0;
        gl.uniform1f(this.locations.h2Amp, this.tempAmp);
        gl.uniform1f(this.locations.h2Contrast, document.getElementById("h2Contrast").value);

        this.tempAmp = document.getElementById("showH3").checked ? document.getElementById("h3Amp").value : 0.0;
        gl.uniform1f(this.locations.h3Amp, this.tempAmp);
        gl.uniform1f(this.locations.h3Contrast, document.getElementById("h3Contrast").value);
        //
        gl.uniform1f(this.locations.waterLevel, document.getElementById("waterLevel").value);

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
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.RES, this.RES, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
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