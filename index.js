/** @type {WebGLRenderingContext} */
let gl = null;

let generator = null;
let quad = null;
let capture = false;


function draw() {
    GlUtils.resizeCanvas(gl);

    generator.draw();
    quad.draw();

    requestAnimationFrame(draw);
}

async function init() {
    const mainCanvas = document.getElementById("drawCanvas");
    gl = GlUtils.createContext(mainCanvas);

    generator = new Generator();
    quad = new Quad();

    await generator.init(gl);
    await quad.init(gl);

    draw();
}

function downloadHeightMap() {
    generator.capture = true;
}

function record() {
    const time = 5000.0;
    var recordedChunks = [];

    var stream = gl.canvas.captureStream(30);
    mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm; codecs=vp9"
    });

    mediaRecorder.start(time || 4000);

    mediaRecorder.ondataavailable = function (e) {
        recordedChunks.push(e.data);
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }

    }

    mediaRecorder.onstop = function (event) {
        const blob = new Blob(recordedChunks, {
            type: "video/webm"
        });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("download", "record.webm");
        link.setAttribute("href", url);
        link.click();
        link.remove();
    }
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}