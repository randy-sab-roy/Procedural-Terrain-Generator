precision mediump float;

uniform sampler2D tex;

varying vec2 point;

// Allows to decode floating point values from vec4
float DecodeFloatRGBA (vec4 v) {
    return dot(v, 1./vec4(1.,255.,65025.,16581375.));
}

void main() {
    gl_FragColor = vec4(vec3(DecodeFloatRGBA(texture2D(tex, point))), 1.0);
    // gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}