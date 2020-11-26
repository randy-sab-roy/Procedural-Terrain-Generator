let gl = null;
let uints_for_indices;

let generator = null;
let quad = null;
let genView = null;
let capture = false;

let prevTime = Date.now();
let alpha = 0.99;
let fps = 60;
let genTime = 0;
let quadTime = 0;

function updateFps() {
    fps = alpha * fps + (1.0 - alpha) * Math.min(1000 / (Date.now() - prevTime), 9999);
    document.getElementById("fps").textContent = Math.trunc(fps);
    document.getElementById("fpsBox").style = document.getElementById("showFps").checked ? "" : "display:none;";
    prevTime = Date.now();
}

function draw() {
    updateFps();

    GlUtils.resizeCanvas(gl);
    
    generator.draw();
    genView.draw();
    quad.draw();

    requestAnimationFrame(draw);
}

async function init() {
    const mainCanvas = document.getElementById("drawCanvas");
    gl = GlUtils.createContext(mainCanvas);

    uints_for_indices = gl.getExtension("OES_element_index_uint");

    generator = new Generator();
    quad = new Quad();
    genView = new GeneratorView();

    await generator.init(gl);
    await quad.init(gl);
    await genView.init(gl);

    draw();
}