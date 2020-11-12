let gl = null;
let cube = null;


function draw() {
    
    GlUtils.resetView(gl);
    cube.draw();

    requestAnimationFrame(draw);
}

async function init() {
    canvas = document.getElementById("c");
    
    /** @type {WebGLRenderingContext} */
    gl = GlUtils.createContext(canvas)
    cube = new Cube();

    await cube.init(gl);
    draw();
}
