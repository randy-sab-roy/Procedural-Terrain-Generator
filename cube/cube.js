class Cube {
    transforms = {}
    locations = {};

    program = null;
    gl = null;

    async init(gl) {
        this.gl = gl;
        this.buffers = this.createBuffers(gl);
        this.program = await GlUtils.createWebGLProgramFromPath(gl, "cube/cube_vertex.glsl", "cube/cube_fragment.glsl");
        gl.useProgram(this.program);

        this.locations.model = gl.getUniformLocation(this.program, "model");
        this.locations.projection = gl.getUniformLocation(this.program, "projection");
        this.locations.position = gl.getAttribLocation(this.program, "position");
        this.locations.color = gl.getAttribLocation(this.program, "color");
        gl.enable(gl.DEPTH_TEST);
    }

    draw() {
        var gl = this.gl;
        var now = Date.now();
        gl.useProgram(this.program);

        this.computeModelMatrix(now);
        this.computePerspectiveMatrix();
        this.updateAttributesAndUniforms();

        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    };

    computeModelMatrix(now) {
        var scale = MatUtils.scaleMatrix(5, 5, 5);
        var rotateX = MatUtils.rotateXMatrix(now * 0.0003);
        var rotateY = MatUtils.rotateYMatrix(now * 0.0005);
        var position = MatUtils.translateMatrix(0, 0, -20);

        this.transforms.model = MatUtils.multiplyArrayOfMatrices([
            position,
            rotateY,
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

        // Colors
        gl.enableVertexAttribArray(this.locations.color);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.colors);
        gl.vertexAttribPointer(this.locations.color, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.elements);
    };


    createBuffers(gl) {
        const cube = this.createCubeData();
        const positions = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positions);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.positions), gl.STATIC_DRAW);

        var colors = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colors);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.colors), gl.STATIC_DRAW);

        var elements = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube.elements), gl.STATIC_DRAW);

        return {
            positions: positions,
            colors: colors,
            elements: elements
        }
    }

    createCubeData() {
        var positions = [
            // Front face
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, -1.0, -1.0,

            // Top face
            -1.0, 1.0, -1.0,
            -1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,

            // Right face
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, 1.0, 1.0,
            1.0, -1.0, 1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, 1.0, -1.0
        ];

        var colorsOfFaces = [
            [0.3, 1.0, 1.0, 1.0],    // Front face: cyan
            [1.0, 0.3, 0.3, 1.0],    // Back face: red
            [0.3, 1.0, 0.3, 1.0],    // Top face: green
            [0.3, 0.3, 1.0, 1.0],    // Bottom face: blue
            [1.0, 1.0, 0.3, 1.0],    // Right face: yellow
            [1.0, 0.3, 1.0, 1.0]     // Left face: purple
        ];

        var colors = [];

        for (var j = 0; j < 6; j++) {
            var polygonColor = colorsOfFaces[j];

            for (var i = 0; i < 4; i++) {
                colors = colors.concat(polygonColor);
            }
        }

        var elements = [
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // back
            8, 9, 10, 8, 10, 11,   // top
            12, 13, 14, 12, 14, 15,   // bottom
            16, 17, 18, 16, 18, 19,   // right
            20, 21, 22, 20, 22, 23    // left
        ]

        return {
            positions: positions,
            elements: elements,
            colors: colors
        }
    }
}