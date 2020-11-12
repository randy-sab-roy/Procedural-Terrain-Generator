class Quad {

    transforms = {}
    locations = {};

    program = null;
    gl = null;

    async init(gl) {
        this.gl = gl;
        this.buffers = this.createBuffers(gl);
        this.program = await GlUtils.createWebGLProgramFromPath(gl, "quad/quad_vertex.glsl", "quad/quad_fragment.glsl");
        gl.useProgram(this.program);

        this.locations.model = gl.getUniformLocation(this.program, "model");
        this.locations.projection = gl.getUniformLocation(this.program, "projection");
        this.locations.position = gl.getAttribLocation(this.program, "position");
        gl.enable(gl.DEPTH_TEST);
    }

    draw() {
        var gl = this.gl;
        gl.useProgram(this.program);

        this.computeModelMatrix();
        this.computePerspectiveMatrix();
        this.updateAttributesAndUniforms();

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };

    computeModelMatrix() {
        var scale = MatUtils.scaleMatrix(10, 10, 10);
        var rotateX = MatUtils.rotateXMatrix(1);
        var position = MatUtils.translateMatrix(0, -5, -25);

        this.transforms.model = MatUtils.multiplyArrayOfMatrices([
            position,
            rotateX,
            scale
        ]);
    };

    computePerspectiveMatrix() {
        var fieldOfViewInRadians = Math.PI * 0.5;
        var aspectRatio = this.gl.canvas.width / this.gl.canvas.height;
        var nearClippingPlaneDistance = 1;
        var farClippingPlaneDistance = 50;

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

        // Positions
        gl.enableVertexAttribArray(this.locations.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positions);
        gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.elements);
    };


    createBuffers(gl) {
        const quad = this.createQuadData();

        const positions = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positions);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.positions), gl.STATIC_DRAW);

        const elements = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quad.elements), gl.STATIC_DRAW);

        return {
            positions: positions,
            elements: elements
        }
    }

    createQuadData() {
        const positions = [
            -1.0, -1.0, 0.0,
            1.0, -1.0, 0.0,
            1.0, 1.0, 0.0,
            -1.0, 1.0, 0.0,
        ];

        const elements = [0, 1, 2, 0, 2, 3]

        return {
            positions: positions,
            elements: elements
        }
    }
}