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
        const vertexShaderSource = await(await fetch(vertexSourcePath)).text();
        const fragmentShaderSource = await(await fetch(fragmentSourcePath)).text();
        return GlUtils.createWebGLProgram(gl, vertexShaderSource, fragmentShaderSource);
    }

    static createContext(canvas) {
        var gl;

        try {
            gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        }
        catch (e) { }

        if (!gl) {
            var message = "Unable to initialize WebGL. Your browser may not support it.";
            alert(message);
            throw new Error(message);
            gl = null;
        }

        return gl;
    }
}

