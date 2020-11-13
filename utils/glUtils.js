class GlUtils {
    static createShader(gl, source, type) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

            var info = gl.getShaderInfoLog(shader);
            throw "Could not compile WebGL program. \n\n" + info;
        }

        return shader
    }

    static linkProgram(gl, vertexShader, fragmentShader) {
        var program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            var info = gl.getProgramInfoLog(program);
            throw "Could not compile WebGL program. \n\n" + info;
        }

        return program;
    }

    static createWebGLProgram(gl, vertexSource, fragmentSource) {
        var vertexShader = GlUtils.createShader(gl, vertexSource, gl.VERTEX_SHADER);
        var fragmentShader = GlUtils.createShader(gl, fragmentSource, gl.FRAGMENT_SHADER);

        return GlUtils.linkProgram(gl, vertexShader, fragmentShader);
    }

    static async createWebGLProgramFromPath(gl, vertexSourcePath, fragmentSourcePath) {
        const vertexShaderSource = await (await fetch(vertexSourcePath)).text();
        const fragmentShaderSource = await (await fetch(fragmentSourcePath)).text();
        return GlUtils.createWebGLProgram(gl, vertexShaderSource, fragmentShaderSource);
    }

    static createContext(canvas) {
        let gl;

        try {
            gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        }
        catch (e) { }

        if (!gl) {
            var message = "Unable to initialize WebGL. Your browser may not support it.";
            alert(message);
            throw new Error(message);
        }

        return gl;
    }

    static resetView(gl) {
        const canvas = gl.canvas;
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        
        if (canvas.width != displayWidth || canvas.height != displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    static async loadImageAsync(src) {
        return new Promise((resolve, reject) => {
            let img = new Image()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = src
        })
    }
}

