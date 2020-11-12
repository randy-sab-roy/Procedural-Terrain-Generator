function resizeCanvasToDisplaySize(canvas) {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width != displayWidth || canvas.height != displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
}

async function init() {
    const canvas = document.getElementById("c");
    resizeCanvasToDisplaySize(canvas);
    
    /** @type {WebGLRenderingContext} */
    const gl = GlUtils.createContext(canvas)
    const cube = new Cube();
    await cube.init(gl);
    cube.draw();
}
