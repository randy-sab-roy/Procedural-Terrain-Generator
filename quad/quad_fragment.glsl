precision mediump float;

uniform float Ka;
uniform float Kd;
uniform float Ks;
uniform float Sv;

uniform vec3 lightColorA;
uniform vec3 lightColorD;
uniform vec3 lightDir;

varying vec4 fcolor;
varying vec3 normal;
varying vec3 pos;

vec4 getLightColor() {
    vec3 N = normalize(normal);
    vec3 L = normalize(lightDir);

    float lambertian = max(dot(N, L), 0.0);

    float specular = 0.0;
    if(lambertian > 0.0) {
        vec3 R = reflect(-L, N);
        vec3 V = normalize(-pos);
        float specAngle = max(dot(R, V), 0.0);
        specular = pow(specAngle, Sv);
    }

    return vec4(Ka * vec3(fcolor) + Kd * lambertian * lightColorD + Ks * specular * lightColorD, 1.0);
}

void main() {
    // gl_FragColor = vec4(0.25, 0.53, 0.96, 1.0);
    // gl_FragColor = fcolor;
    // gl_FragColor = vec4(normalize(abs(normal)), 1.0);    
    gl_FragColor = getLightColor();
}