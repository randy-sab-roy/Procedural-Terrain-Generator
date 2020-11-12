precision mediump float;

uniform float Ka;
uniform float Kd;
uniform vec4 lightColor;
uniform vec3 lightDir;

varying vec4 fcolor;
varying vec3 normal;
varying vec3 pos;

void main() {
    // gl_FragColor = vec4(0.25, 0.53, 0.96, 1.0);
    // gl_FragColor = fcolor;

    vec3 N = normalize(normal);
    vec3 L = normalize(lightDir);

    float lambertian = max(dot(N, L), 0.0);
    gl_FragColor = vec4(Ka * lightColor + Kd * lambertian * lightColor);
}